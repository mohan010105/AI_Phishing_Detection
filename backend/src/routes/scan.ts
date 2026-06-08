import { Router } from "express";
import { db } from "../database/index.js";
import { scanHistoryTable } from "../database/index.js";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { analyzeUrl, analyzeEmail } from "../services/riskDetection.js";
import { checkUrlVirusTotal, scoreFromVT, VirusTotalResult } from "../services/virusTotal.js";
import { checkUrlSafeBrowsing, scoreFromGSB, SafeBrowsingResult } from "../services/safeBrowsing.js";
import { checkUrlAbuseIPDB, scoreFromAbuseIPDB, AbuseIPDBResult } from "../services/abuseIPDB.js";
import { generateThreatExplanation } from "../services/aiExplanation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ScanUrlBody, ScanEmailBody, GetScanHistoryQueryParams } from "../validation/schemas.js";
import { env } from "../config/env.js";
import OpenAI from "openai";
import { logger } from "../lib/logger.js";

const router = Router();

// Dual-provider setup for compare AI summaries
let openaiClient: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
let geminiClient: OpenAI | null = null;
if (env.GEMINI_API_KEY) {
  geminiClient = new OpenAI({
    apiKey: env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

async function generateCompareAiSummary(prompt: string): Promise<string> {
  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content ?? "";
    } catch (err: any) {
      logger.warn({ err: err?.message }, "Compare AI (OpenAI) failed, trying Gemini");
    }
  }
  if (geminiClient) {
    try {
      const completion = await geminiClient.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });
      return completion.choices[0]?.message?.content ?? "";
    } catch (err: any) {
      logger.warn({ err: err?.message }, "Compare AI (Gemini fallback) also failed");
    }
  }
  return "";
}

interface ExternalSource {
  source: string;
  available: boolean;
  status?: string;
  detail?: string;
  score?: number;
}

function buildVTSource(r: VirusTotalResult): ExternalSource {
  if (!r.available) return { source: "VirusTotal", available: false, status: "unavailable" };
  const total = r.malicious + r.suspicious + r.harmless + r.undetected;
  if (r.malicious > 0) return { source: "VirusTotal", available: true, status: "malicious", detail: `${r.malicious}/${total} engines flagged as malicious`, score: Math.min(r.malicious * 5, 50) };
  if (r.suspicious > 0) return { source: "VirusTotal", available: true, status: "suspicious", detail: `${r.suspicious}/${total} engines flagged as suspicious`, score: Math.min(r.suspicious * 3, 20) };
  return { source: "VirusTotal", available: true, status: "clean", detail: total > 0 ? `${r.harmless}/${total} engines confirmed clean` : "No prior analysis cached", score: 0 };
}

function buildGSBSource(r: SafeBrowsingResult): ExternalSource {
  if (!r.available) return { source: "Google Safe Browsing", available: false, status: "unavailable" };
  if (!r.isMalicious) return { source: "Google Safe Browsing", available: true, status: "safe", detail: "No threats detected", score: 0 };
  const labels: Record<string, string> = { MALWARE: "Malware", SOCIAL_ENGINEERING: "Phishing / Social Engineering", UNWANTED_SOFTWARE: "Unwanted Software", POTENTIALLY_HARMFUL_APPLICATION: "Harmful Application" };
  const types = r.threatTypes.map(t => labels[t] ?? t).join(", ");
  return { source: "Google Safe Browsing", available: true, status: "unsafe", detail: `Threat types: ${types}`, score: r.threatTypes.includes("MALWARE") ? 50 : 45 };
}

function buildAbuseSource(r: AbuseIPDBResult): ExternalSource {
  if (!r.available) return { source: "AbuseIPDB", available: false, status: "unavailable" };
  if (!r.checked) return { source: "AbuseIPDB", available: true, status: "n/a", detail: "Could not resolve IP address", score: 0 };
  const conf = r.abuseConfidenceScore;
  const status = conf >= 75 ? "abusive" : conf >= 25 ? "suspicious" : "clean";
  const detail = [
    r.ipAddress ? `IP: ${r.ipAddress}` : null,
    r.isp ? `ISP: ${r.isp}` : null,
    r.countryCode ? `Country: ${r.countryCode}` : null,
    `Abuse score: ${conf}%`,
    r.totalReports > 0 ? `${r.totalReports} report(s)` : null,
  ].filter(Boolean).join(" · ");
  return { source: "AbuseIPDB", available: true, status, detail, score: conf >= 75 ? 35 : conf >= 25 ? 20 : 0 };
}

async function runUrlScan(url: string) {
  const [localResult, vtResult, gsbResult, abuseResult] = await Promise.all([
    Promise.resolve(analyzeUrl(url)),
    checkUrlVirusTotal(url),
    checkUrlSafeBrowsing(url),
    checkUrlAbuseIPDB(url),
  ]);
  const vtScoring = scoreFromVT(vtResult);
  const gsbScoring = scoreFromGSB(gsbResult);
  const abuseScoring = scoreFromAbuseIPDB(abuseResult);
  const allFindings = [...localResult.findings, ...vtScoring.findings, ...gsbScoring.findings, ...abuseScoring.findings];
  const rawScore = localResult.riskScore + vtScoring.score + gsbScoring.score + abuseScoring.score;
  const finalScore = Math.min(rawScore, 100);
  const finalLevel: "safe" | "suspicious" | "high_risk" = finalScore <= 30 ? "safe" : finalScore <= 60 ? "suspicious" : "high_risk";
  return { target: url, type: "url" as const, riskScore: finalScore, riskLevel: finalLevel, findings: allFindings };
}

async function runEmailScan(content: string, subject?: string, sender?: string) {
  const result = analyzeEmail(content, subject, sender);
  const urlMatches = (content + " " + (subject ?? "")).match(/https?:\/\/[^\s"'<>()]+/gi) ?? [];
  const uniqueUrls = [...new Set(urlMatches)].slice(0, 3);
  if (uniqueUrls.length > 0) {
    const firstUrl = uniqueUrls[0];
    const [vtResult, gsbResult, abuseResult] = await Promise.all([
      checkUrlVirusTotal(firstUrl),
      checkUrlSafeBrowsing(firstUrl),
      checkUrlAbuseIPDB(firstUrl),
    ]);
    result.findings.push(...scoreFromVT(vtResult).findings, ...scoreFromGSB(gsbResult).findings, ...scoreFromAbuseIPDB(abuseResult).findings);
    const extraScore = scoreFromVT(vtResult).score + scoreFromGSB(gsbResult).score + scoreFromAbuseIPDB(abuseResult).score;
    result.riskScore = Math.min(result.riskScore + extraScore, 100);
    result.riskLevel = result.riskScore <= 30 ? "safe" : result.riskScore <= 60 ? "suspicious" : "high_risk";
  }
  const target = subject ? `Email: ${subject.slice(0, 60)}` : "Email analysis";
  return { target, type: "email" as const, riskScore: result.riskScore, riskLevel: result.riskLevel as "safe" | "suspicious" | "high_risk", findings: result.findings };
}

router.post("/scan/url", requireAuth, asyncHandler(async (req, res) => {
  const parsed = ScanUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid URL provided" });
    return;
  }

  const { url } = parsed.data;

  const [localResult, vtResult, gsbResult, abuseResult] = await Promise.all([
    Promise.resolve(analyzeUrl(url)),
    checkUrlVirusTotal(url),
    checkUrlSafeBrowsing(url),
    checkUrlAbuseIPDB(url),
  ]);

  const vtScoring = scoreFromVT(vtResult);
  const gsbScoring = scoreFromGSB(gsbResult);
  const abuseScoring = scoreFromAbuseIPDB(abuseResult);

  const allFindings = [...localResult.findings, ...vtScoring.findings, ...gsbScoring.findings, ...abuseScoring.findings];
  const rawScore = localResult.riskScore + vtScoring.score + gsbScoring.score + abuseScoring.score;
  const finalScore = Math.min(rawScore, 100);
  const finalLevel: "safe" | "suspicious" | "high_risk" =
    finalScore <= 30 ? "safe" : finalScore <= 60 ? "suspicious" : "high_risk";

  const externalSources: ExternalSource[] = [
    buildVTSource(vtResult),
    buildGSBSource(gsbResult),
    buildAbuseSource(abuseResult),
  ];

  const [scan, aiResult] = await Promise.all([
    db.insert(scanHistoryTable).values({
      userId: req.user!.userId,
      type: "url",
      target: url,
      riskScore: finalScore,
      riskLevel: finalLevel,
      findings: allFindings,
    }).returning().then(r => r[0]),
    generateThreatExplanation("url", url, finalScore, finalLevel, allFindings),
  ]);

  res.json({
    id: scan.id,
    type: scan.type,
    target: scan.target,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    findings: scan.findings,
    externalSources,
    explanation: aiResult?.explanation ?? null,
    aiSummary: aiResult?.aiSummary ?? null,
    userId: scan.userId,
    createdAt: scan.createdAt.toISOString(),
  });
}));

router.post("/scan/email", requireAuth, asyncHandler(async (req, res) => {
  const parsed = ScanEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: " + parsed.error.issues[0]?.message });
    return;
  }

  const { content, subject, sender } = parsed.data;
  const result = analyzeEmail(content, subject ?? undefined, sender ?? undefined);

  const urlMatches = (content + " " + (subject ?? "")).match(/https?:\/\/[^\s"'<>()]+/gi) ?? [];
  const uniqueUrls = [...new Set(urlMatches)].slice(0, 3);

  const externalSources: ExternalSource[] = [];

  if (uniqueUrls.length > 0) {
    const firstUrl = uniqueUrls[0];
    const [vtResult, gsbResult, abuseResult] = await Promise.all([
      checkUrlVirusTotal(firstUrl),
      checkUrlSafeBrowsing(firstUrl),
      checkUrlAbuseIPDB(firstUrl),
    ]);

    const vtScoring = scoreFromVT(vtResult);
    const gsbScoring = scoreFromGSB(gsbResult);
    const abuseScoring = scoreFromAbuseIPDB(abuseResult);

    result.findings.push(...vtScoring.findings, ...gsbScoring.findings, ...abuseScoring.findings);
    const extraScore = vtScoring.score + gsbScoring.score + abuseScoring.score;
    result.riskScore = Math.min(result.riskScore + extraScore, 100);
    result.riskLevel = result.riskScore <= 30 ? "safe" : result.riskScore <= 60 ? "suspicious" : "high_risk";

    externalSources.push(buildVTSource(vtResult), buildGSBSource(gsbResult), buildAbuseSource(abuseResult));
  }

  const target = subject ? `Email: ${subject.slice(0, 60)}` : "Email analysis";

  const [scan, aiResult] = await Promise.all([
    db.insert(scanHistoryTable).values({
      userId: req.user!.userId,
      type: "email",
      target,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      findings: result.findings,
    }).returning().then(r => r[0]),
    generateThreatExplanation("email", target, result.riskScore, result.riskLevel, result.findings),
  ]);

  res.json({
    id: scan.id,
    type: scan.type,
    target: scan.target,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    findings: scan.findings,
    ...(externalSources.length > 0 ? { externalSources } : {}),
    explanation: aiResult?.explanation ?? null,
    aiSummary: aiResult?.aiSummary ?? null,
    userId: scan.userId,
    createdAt: scan.createdAt.toISOString(),
  });
}));

router.get("/scan/history", requireAuth, asyncHandler(async (req, res) => {
  const parsed = GetScanHistoryQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const type = parsed.success ? parsed.data.type : undefined;
  const offset = (page - 1) * limit;

  const conditions = [eq(scanHistoryTable.userId, req.user!.userId)];
  if (type === "url" || type === "email") {
    conditions.push(eq(scanHistoryTable.type, type));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [scans, [{ total }]] = await Promise.all([
    db.select().from(scanHistoryTable)
      .where(whereClause)
      .orderBy(desc(scanHistoryTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(scanHistoryTable).where(whereClause),
  ]);

  res.json({
    scans: scans.map(s => ({
      id: s.id, type: s.type, target: s.target, riskScore: s.riskScore,
      riskLevel: s.riskLevel, findings: s.findings, userId: s.userId,
      createdAt: s.createdAt.toISOString(),
    })),
    total: Number(total),
    page,
    limit,
  });
}));

router.post("/scan/compare", requireAuth, asyncHandler(async (req, res) => {
  const { typeA, targetA, typeB, targetB } = req.body as {
    typeA: "url" | "email";
    targetA: string;
    typeB: "url" | "email";
    targetB: string;
  };

  if (!typeA || !targetA || !typeB || !targetB) {
    res.status(400).json({ error: "typeA, targetA, typeB, and targetB are all required." });
    return;
  }

  const [resultA, resultB] = await Promise.all([
    typeA === "url" ? runUrlScan(targetA) : runEmailScan(targetA),
    typeB === "url" ? runUrlScan(targetB) : runEmailScan(targetB),
  ]);

  const [aiA, aiB] = await Promise.all([
    generateThreatExplanation(typeA, resultA.target, resultA.riskScore, resultA.riskLevel, resultA.findings),
    generateThreatExplanation(typeB, resultB.target, resultB.riskScore, resultB.riskLevel, resultB.findings),
  ]);

  let aiSummary = "";
  if (openaiClient || geminiClient) {
    const diff = resultA.riskScore - resultB.riskScore;
    const winnerLabel = diff > 5 ? "Target A is riskier" : diff < -5 ? "Target B is riskier" : "Both targets have similar risk";
    const prompt = `Compare these two cybersecurity scan results and provide a brief analysis:

Target A (${typeA}): ${resultA.target.slice(0, 100)} — Score: ${resultA.riskScore}/100 (${resultA.riskLevel})
Findings A: ${resultA.findings.slice(0, 5).join("; ") || "None"}

Target B (${typeB}): ${resultB.target.slice(0, 100)} — Score: ${resultB.riskScore}/100 (${resultB.riskLevel})
Findings B: ${resultB.findings.slice(0, 5).join("; ") || "None"}

Verdict: ${winnerLabel}

Write 2-3 sentences comparing the two threats, highlighting key differences and which is more dangerous and why.`;

    aiSummary = await generateCompareAiSummary(prompt);
  }

  const scoreDiff = resultA.riskScore - resultB.riskScore;
  const winner = scoreDiff > 5 ? "a" : scoreDiff < -5 ? "b" : "tie";

  res.json({
    a: {
      target: resultA.target,
      type: resultA.type,
      riskScore: resultA.riskScore,
      riskLevel: resultA.riskLevel,
      findings: resultA.findings,
      explanation: aiA?.explanation ?? null,
      incidentResponse: aiA?.aiSummary?.incidentResponse ?? [],
    },
    b: {
      target: resultB.target,
      type: resultB.type,
      riskScore: resultB.riskScore,
      riskLevel: resultB.riskLevel,
      findings: resultB.findings,
      explanation: aiB?.explanation ?? null,
      incidentResponse: aiB?.aiSummary?.incidentResponse ?? [],
    },
    summary: aiSummary,
    winner,
  });
}));

export default router;
