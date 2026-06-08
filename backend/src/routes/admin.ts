import { Router } from "express";
import { db } from "../database/index.js";
import { usersTable, scanHistoryTable } from "../database/index.js";
import { eq, desc, count, gte, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AdminGetUsersQueryParams, AdminGetReportsQueryParams } from "../validation/schemas.js";

const router = Router();

router.get("/admin/users", requireAdmin, asyncHandler(async (req, res) => {
  const parsed = AdminGetUsersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [users, [{ total }]] = await Promise.all([
    db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(usersTable),
  ]);

  res.json({
    users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
    total: Number(total),
    page,
    limit,
  });
}));

router.get("/admin/reports", requireAdmin, asyncHandler(async (req, res) => {
  const parsed = AdminGetReportsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const riskLevel = parsed.success ? parsed.data.riskLevel : undefined;
  const offset = (page - 1) * limit;

  const whereClause = riskLevel ? eq(scanHistoryTable.riskLevel, riskLevel) : undefined;

  const [reports, [{ total }]] = await Promise.all([
    db.select().from(scanHistoryTable)
      .where(whereClause)
      .orderBy(desc(scanHistoryTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(scanHistoryTable).where(whereClause),
  ]);

  res.json({
    reports: reports.map(s => ({
      id: s.id, type: s.type, target: s.target, riskScore: s.riskScore,
      riskLevel: s.riskLevel, findings: s.findings, userId: s.userId,
      createdAt: s.createdAt.toISOString(),
    })),
    total: Number(total),
    page,
    limit,
  });
}));

router.get("/admin/analytics", requireAdmin, asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ totalUsers }],
    [{ totalScans }],
    [{ urlScans }],
    [{ emailScans }],
    [{ highRiskCount }],
    [{ suspiciousCount }],
    [{ safeCount }],
    [{ scansToday }],
    [{ scansThisWeek }],
    topThreats,
    dailyRows,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ totalScans: count() }).from(scanHistoryTable),
    db.select({ urlScans: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.type, "url")),
    db.select({ emailScans: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.type, "email")),
    db.select({ highRiskCount: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.riskLevel, "high_risk")),
    db.select({ suspiciousCount: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.riskLevel, "suspicious")),
    db.select({ safeCount: count() }).from(scanHistoryTable).where(eq(scanHistoryTable.riskLevel, "safe")),
    db.select({ scansToday: count() }).from(scanHistoryTable).where(gte(scanHistoryTable.createdAt, todayStart)),
    db.select({ scansThisWeek: count() }).from(scanHistoryTable).where(gte(scanHistoryTable.createdAt, weekStart)),
    db.select().from(scanHistoryTable)
      .where(eq(scanHistoryTable.riskLevel, "high_risk"))
      .orderBy(desc(scanHistoryTable.riskScore))
      .limit(10),
    db.select({
      date: sql<string>`TO_CHAR(created_at::date, 'YYYY-MM-DD')`,
      count: count(),
    })
      .from(scanHistoryTable)
      .where(gte(scanHistoryTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`created_at::date`)
      .orderBy(sql`created_at::date ASC`),
  ]);

  res.json({
    totalUsers: Number(totalUsers),
    totalScans: Number(totalScans),
    urlScans: Number(urlScans),
    emailScans: Number(emailScans),
    highRiskCount: Number(highRiskCount),
    suspiciousCount: Number(suspiciousCount),
    safeCount: Number(safeCount),
    scansToday: Number(scansToday),
    scansThisWeek: Number(scansThisWeek),
    topThreats: topThreats.map(s => ({
      id: s.id, type: s.type, target: s.target,
      riskScore: s.riskScore, riskLevel: s.riskLevel,
      createdAt: s.createdAt.toISOString(),
    })),
    dailyScans: dailyRows.map(r => ({ date: r.date, count: Number(r.count) })),
  });
}));

export default router;
