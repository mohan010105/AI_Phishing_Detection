import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scanTypeEnum = pgEnum("scan_type", ["url", "email"]);
export const riskLevelEnum = pgEnum("risk_level", ["safe", "suspicious", "high_risk"]);

export const scanHistoryTable = pgTable("scan_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: scanTypeEnum("type").notNull(),
  target: text("target").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  findings: text("findings").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScanSchema = createInsertSchema(scanHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScan = z.infer<typeof insertScanSchema>;
export type ScanHistory = typeof scanHistoryTable.$inferSelect;
