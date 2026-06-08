import { Router } from "express";
import multer from "multer";
import { db } from "../database/index.js";
import { scanHistoryTable } from "../database/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { analyzeUrl } from "../services/riskDetection.js";
import { checkUrlVirusTotal, scoreFromVT, VirusTotalResult } from "../services/virusTotal.js";
import { checkUrlSafeBrowsing, scoreFromGSB, SafeBrowsingResult } from "../services/safeBrowsing.js";
import { checkUrlAbuseIPDB, scoreFromAbuseIPDB, AbuseIPDBResult } from "../services/abuseIPDB.js";
import { generateThreatExplanation } from "../services/aiExplanation.js";
import { getRecommendations } from "../services/recommendationEngine.js";
import { decodeQRFromBuffer, isUrl } from "../services/qrScanner.js";
import { analyzeScreenshot } from "../services/screenshotAnalyzer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../lib/logger.js";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, and WEBP images are supported"));
    }
  },
});

// ---------------------------------------------------------------------------
// External source builders (shared with scan.ts pattern)
// ---------------------------------------------------------------------------

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

const router = Router();

router.post("/scan/qr", requireAuth, upload.single("image"), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided. Please upload a QR code image." });
    return;
  }

  logger.info({ mimetype: req.file.mimetype, size: req.file.size }, "QR scan: image received");

  let decoded: string | null;
  try {
    decoded = await decodeQRFromBuffer(req.file.buffer);
  } catch (err) {
    logger.error({ err }, "QR decode threw unexpected error");
    res.status(500).json({ error: "QR decode failed due to an internal error. Please try a different image." });
    return;
  }

  if (!decoded) {
    res.status(422).json({ error: "No QR code detected in the uploaded image. Please ensure the image contains a clear, high-contrast QR code." });
    return;
  }

  if (!isUrl(decoded)) {
    res.status(422).json({ error: `QR code decoded successfully but does not contain a URL. Decoded value: "${decoded.slice(0, 100)}"` });
    return;
  }

  const url = decoded;
  logger.info({ url }, "QR scan: URL extracted from QR code");

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

  const recommendation = getRecommendations(finalScore, finalLevel, allFindings, "qr");

  const [scan, aiResult] = await Promise.all([
    db.insert(scanHistoryTable).values({
      userId: req.user!.userId,
      type: "url",
      target: url,
      riskScore: finalScore,
      riskLevel: finalLevel,
      findings: allFindings,
    }).returning().then(r => r[0]),
    generateThreatExplanation("qr", url, finalScore, finalLevel, allFindings),
  ]);

  logger.info({ scanId: scan.id, riskScore: finalScore, riskLevel: finalLevel }, "QR scan completed");

  res.json({
    id: scan.id,
    type: "qr",
    target: url,
    extractedFrom: "qr",
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    findings: scan.findings,
    externalSources,
    explanation: aiResult?.explanation ?? null,
    aiSummary: aiResult?.aiSummary ?? null,
    recommendation: {
      category: recommendation.category,
      title: recommendation.title,
      steps: recommendation.steps,
    },
    userId: scan.userId,
    createdAt: scan.createdAt.toISOString(),
  });
}));

router.post("/scan/screenshot", requireAuth, upload.single("image"), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const analysis = await analyzeScreenshot(req.file.buffer, req.file.mimetype);

  res.json({
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    findings: analysis.findings,
    explanation: analysis.explanation,
    aiSummary: analysis.aiSummary,
    detectedText: analysis.detectedText,
  });
}));

export default router;
