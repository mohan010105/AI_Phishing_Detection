export type RiskLevel = "safe" | "suspicious" | "high_risk";

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "safe";
  if (score <= 60) return "suspicious";
  return "high_risk";
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function mergeScores(
  ...parts: Array<{ score: number; findings: string[] }>
): { score: number; riskLevel: RiskLevel; findings: string[] } {
  const combined = parts.reduce((acc, p) => ({
    score: acc.score + p.score,
    findings: [...acc.findings, ...p.findings],
  }), { score: 0, findings: [] as string[] });

  const score = clampScore(combined.score);
  return { score, riskLevel: scoreToRiskLevel(score), findings: combined.findings };
}

export function riskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    safe: "SAFE",
    suspicious: "SUSPICIOUS",
    high_risk: "HIGH RISK",
  };
  return labels[level];
}
