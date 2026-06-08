import { Router } from "express";
import { db } from "../database/index.js";
import { scanHistoryTable } from "../database/index.js";
import { eq, and, desc, count, gte, sql, or, ne } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { GetRecentScansQueryParams } from "../validation/schemas.js";

const router = Router();

router.get("/dashboard/stats", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [{ totalScans }],
    [{ urlScans }],
    [{ emailScans }],
    [{ highRiskCount }],
    [{ suspiciousCount }],
    [{ safeCount }],
    [{ scansThisWeek }],
  ] = await Promise.all([
    db.select({ totalScans: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.userId, userId)),
    db.select({ urlScans: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.type, "url"))),
    db.select({ emailScans: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.type, "email"))),
    db.select({ highRiskCount: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "high_risk"))),
    db.select({ suspiciousCount: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "suspicious"))),
    db.select({ safeCount: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "safe"))),
    db.select({ scansThisWeek: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), gte(scanHistoryTable.createdAt, weekStart))),
  ]);

  res.json({
    totalScans: Number(totalScans),
    urlScans: Number(urlScans),
    emailScans: Number(emailScans),
    highRiskCount: Number(highRiskCount),
    suspiciousCount: Number(suspiciousCount),
    safeCount: Number(safeCount),
    scansThisWeek: Number(scansThisWeek),
  });
}));

router.get("/dashboard/recent", requireAuth, asyncHandler(async (req, res) => {
  const parsed = GetRecentScansQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;
  const userId = req.user!.userId;

  const scans = await db.select().from(scanHistoryTable)
    .where(eq(scanHistoryTable.userId, userId))
    .orderBy(desc(scanHistoryTable.createdAt))
    .limit(limit);

  res.json(scans.map(s => ({
    id: s.id, type: s.type, target: s.target, riskScore: s.riskScore,
    riskLevel: s.riskLevel, findings: s.findings, userId: s.userId,
    createdAt: s.createdAt.toISOString(),
  })));
}));

router.get("/dashboard/risk-breakdown", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [[{ safe }], [{ suspicious }], [{ high_risk }]] = await Promise.all([
    db.select({ safe: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "safe"))),
    db.select({ suspicious: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "suspicious"))),
    db.select({ high_risk: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "high_risk"))),
  ]);

  res.json({ safe: Number(safe), suspicious: Number(suspicious), high_risk: Number(high_risk) });
}));

router.get("/dashboard/trend", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const days: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const [{ dayCount }] = await db
      .select({ dayCount: count() })
      .from(scanHistoryTable)
      .where(
        and(
          eq(scanHistoryTable.userId, userId),
          gte(scanHistoryTable.createdAt, dayStart),
          sql`${scanHistoryTable.createdAt} <= ${dayEnd}`
        )
      );

    days.push({
      date: dayStart.toISOString().slice(0, 10),
      count: Number(dayCount),
    });
  }

  res.json(days);
}));

router.get("/dashboard/security-score", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [
    [{ total }],
    [{ highRisk }],
    [{ suspicious }],
    [{ safe }],
  ] = await Promise.all([
    db.select({ total: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.userId, userId)),
    db.select({ highRisk: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "high_risk"))),
    db.select({ suspicious: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "suspicious"))),
    db.select({ safe: count() }).from(scanHistoryTable).where(and(eq(scanHistoryTable.userId, userId), eq(scanHistoryTable.riskLevel, "safe"))),
  ]);

  const totalN = Number(total);
  const highRiskN = Number(highRisk);
  const suspiciousN = Number(suspicious);
  const safeN = Number(safe);

  const usageScore = Math.min(totalN * 3, 40);
  const detectionScore = Math.min(highRiskN * 5 + suspiciousN * 2, 40);
  const safeScore = Math.min(safeN, 20);
  const score = Math.min(usageScore + detectionScore + safeScore, 100);

  const tier = score >= 75 ? "platinum" : score >= 50 ? "gold" : score >= 25 ? "silver" : "bronze";

  res.json({
    score,
    tier,
    totalScans: totalN,
    threatsAvoided: highRiskN + suspiciousN,
    safeScans: safeN,
  });
}));

router.get("/dashboard/threat-categories", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const scans = await db
    .select({ findings: scanHistoryTable.findings })
    .from(scanHistoryTable)
    .where(and(eq(scanHistoryTable.userId, userId), ne(scanHistoryTable.riskLevel, "safe")));

  const categories: Record<string, number> = {
    "Credential Theft": 0,
    "Phishing / Spoofing": 0,
    "Financial Fraud": 0,
    "Malware / Exploit": 0,
    "Social Engineering": 0,
    "URL Obfuscation": 0,
    "Brand Impersonation": 0,
  };

  const matchers: Array<{ key: keyof typeof categories; patterns: RegExp }> = [
    { key: "Credential Theft", patterns: /password|credential|login form|harvest|steal/i },
    { key: "Phishing / Spoofing", patterns: /phish|spoof|fake|impersonat|deceptive/i },
    { key: "Financial Fraud", patterns: /bank|financial|payment|card|wire transfer|paypal/i },
    { key: "Malware / Exploit", patterns: /malware|exploit|virus|ransomware|trojan|script inject/i },
    { key: "Social Engineering", patterns: /urgency|urgent|account suspend|prize|winner|click here|act now/i },
    { key: "URL Obfuscation", patterns: /redirect|obfuscat|encoded|typosquat|url short|suspicious domain/i },
    { key: "Brand Impersonation", patterns: /brand|microsoft|google|amazon|apple|paypal|netflix|impersonat/i },
  ];

  for (const scan of scans) {
    const findingsText = (scan.findings as string[]).join(" ").toLowerCase();
    for (const { key, patterns } of matchers) {
      if (patterns.test(findingsText)) {
        categories[key]++;
      }
    }
  }

  const result = Object.entries(categories)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  res.json(result);
}));

router.get("/dashboard/threat-feed", requireAuth, asyncHandler(async (req, res) => {
  const recentThreats = await db
    .select({
      id: scanHistoryTable.id,
      type: scanHistoryTable.type,
      target: scanHistoryTable.target,
      riskScore: scanHistoryTable.riskScore,
      riskLevel: scanHistoryTable.riskLevel,
      createdAt: scanHistoryTable.createdAt,
    })
    .from(scanHistoryTable)
    .where(
      or(
        eq(scanHistoryTable.riskLevel, "high_risk"),
        eq(scanHistoryTable.riskLevel, "suspicious")
      )
    )
    .orderBy(desc(scanHistoryTable.createdAt))
    .limit(15);

  res.json(recentThreats.map(t => ({
    id: t.id,
    type: t.type,
    target: t.type === "email" ? "Email Payload" : t.target.slice(0, 80),
    riskScore: t.riskScore,
    riskLevel: t.riskLevel,
    createdAt: t.createdAt.toISOString(),
  })));
}));

export default router;
