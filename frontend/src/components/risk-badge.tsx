import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RiskBadgeProps {
  level: "safe" | "suspicious" | "high_risk";
  className?: string;
}

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  if (level === "safe") {
    return <Badge className={`bg-chart-3/20 text-chart-3 hover:bg-chart-3/30 border-chart-3/50 ${className}`}>SAFE</Badge>;
  }
  if (level === "suspicious") {
    return <Badge className={`bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border-chart-4/50 ${className}`}>SUSPICIOUS</Badge>;
  }
  return <Badge className={`bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50 animate-pulse ${className}`}>HIGH RISK</Badge>;
}

export function RiskScore({ score, className = "" }: { score: number, className?: string }) {
  let colorClass = "text-chart-3"; // safe
  if (score >= 40 && score < 75) colorClass = "text-chart-4"; // suspicious
  if (score >= 75) colorClass = "text-destructive"; // high risk

  return (
    <div className={`font-bold text-4xl tracking-tighter ${colorClass} ${className}`}>
      {score}
      <span className="text-lg text-muted-foreground ml-1">/100</span>
    </div>
  );
}
