import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetRecentScans, getGetRecentScansQueryKey,
  useGetRiskBreakdown, getGetRiskBreakdownQueryKey,
  useGetDashboardTrend, getGetDashboardTrendQueryKey,
  useGetSecurityScore, getGetSecurityScoreQueryKey,
  useGetThreatCategories, getGetThreatCategoriesQueryKey,
  useGetThreatFeed, getGetThreatFeedQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ShieldAlert, ShieldCheck, Target, AlertTriangle,
  Link as LinkIcon, Mail, Radio, Trophy, QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { RiskBadge } from "@/components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";

function safeFormatDate(d: any, formatStr: string): string {
  if (!d) return "N/A";
  try {
    const dateVal = String(d).includes("T") ? d : `${d}T12:00:00`;
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return String(d);
    return format(date, formatStr);
  } catch {
    return String(d);
  }
}

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function AnimatedStat({ value, loading }: { value: number | undefined; loading: boolean }) {
  const animated = useCountUp(loading ? undefined : (value ?? 0));
  if (loading) return <Skeleton className="h-8 w-20" />;
  return <div className="text-3xl font-bold text-foreground">{animated.toLocaleString()}</div>;
}

function AnimatedStatColored({ value, loading, className }: { value: number | undefined; loading: boolean; className: string }) {
  const animated = useCountUp(loading ? undefined : (value ?? 0));
  if (loading) return <Skeleton className="h-8 w-20" />;
  return <div className={`text-3xl font-bold ${className}`}>{animated.toLocaleString()}</div>;
}

const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", icon: "🥉" },
  silver: { label: "Silver", color: "text-slate-300", bg: "bg-slate-300/10 border-slate-300/30", icon: "🥈" },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", icon: "🥇" },
  platinum: { label: "Platinum", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30", icon: "💎" },
};

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899"
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recentScans, isLoading: recentLoading } = useGetRecentScans({ limit: 5 }, { query: { queryKey: getGetRecentScansQueryKey({ limit: 5 }) } });
  const { data: riskBreakdown, isLoading: riskLoading } = useGetRiskBreakdown({ query: { queryKey: getGetRiskBreakdownQueryKey() } });
  const { data: trend, isLoading: trendLoading } = useGetDashboardTrend({ query: { queryKey: getGetDashboardTrendQueryKey() } });
  const { data: securityScore, isLoading: scoreLoading } = useGetSecurityScore({ query: { queryKey: getGetSecurityScoreQueryKey() } });
  const { data: threatCategories, isLoading: catLoading } = useGetThreatCategories({ query: { queryKey: getGetThreatCategoriesQueryKey() } });
  const { data: threatFeed, isLoading: feedLoading } = useGetThreatFeed({ query: { queryKey: getGetThreatFeedQueryKey() } });

  // Auto-refresh threat feed every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetThreatFeedQueryKey() });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const pieData = riskBreakdown ? [
    { name: 'Safe', value: riskBreakdown.safe, color: 'hsl(var(--chart-3))' },
    { name: 'Suspicious', value: riskBreakdown.suspicious, color: 'hsl(var(--chart-4))' },
    { name: 'High Risk', value: riskBreakdown.high_risk, color: 'hsl(var(--destructive))' },
  ] : [];

  const urlPct = stats && stats.totalScans > 0
    ? Math.round((stats.urlScans / stats.totalScans) * 100)
    : 0;

  const tier = securityScore?.tier ?? "bronze";
  const tierCfg = TIER_CONFIG[tier];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground mt-1">Real-time threat intelligence overview.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/scan/url">
              <Button size="sm" variant="outline" className="border-primary/50 hover:bg-primary/10">
                <LinkIcon className="h-4 w-4 mr-2" />Scan URL
              </Button>
            </Link>
            <Link href="/scan/email">
              <Button size="sm" variant="outline" className="border-primary/50 hover:bg-primary/10">
                <Mail className="h-4 w-4 mr-2" />Scan Email
              </Button>
            </Link>
            <Link href="/scan/qr">
              <Button size="sm" variant="outline" className="border-primary/50 hover:bg-primary/10">
                <QrCode className="h-4 w-4 mr-2" />Scan QR
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="bg-card/50 border-border h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Scans</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <AnimatedStat value={stats?.totalScans} loading={statsLoading} />
                <p className="text-xs text-muted-foreground mt-1">
                  {statsLoading ? <Skeleton className="h-3 w-24 inline-block" /> : <>{stats?.scansThisWeek ?? 0} this week</>}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <Card className="bg-card/50 border-destructive/20 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/10 rounded-bl-full" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-destructive uppercase">Critical Threats</CardTitle>
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <AnimatedStatColored value={stats?.highRiskCount} loading={statsLoading} className="text-destructive" />
                <p className="text-xs text-muted-foreground mt-1">high-risk detections</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <Card className="bg-card/50 border-chart-4/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-chart-4 uppercase">Suspicious</CardTitle>
                <AlertTriangle className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <AnimatedStatColored value={stats?.suspiciousCount} loading={statsLoading} className="text-chart-4" />
                <p className="text-xs text-muted-foreground mt-1">under review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
            <Card className="bg-card/50 border-chart-3/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-chart-3 uppercase">Safe Targets</CardTitle>
                <ShieldCheck className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <AnimatedStatColored value={stats?.safeCount} loading={statsLoading} className="text-chart-3" />
                <p className="text-xs text-muted-foreground mt-1">confirmed clean</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Score */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
          <Card className={`border ${tierCfg.bg}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className={`h-8 w-8 ${tierCfg.color}`} />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Security Awareness Score</div>
                    {scoreLoading ? (
                      <Skeleton className="h-6 w-32 mt-1" />
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-2xl font-bold ${tierCfg.color}`}>{securityScore?.score ?? 0}/100</span>
                        <Badge className={`${tierCfg.bg} ${tierCfg.color} border text-xs`}>
                          {tierCfg.icon} {tierCfg.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${tier === "platinum" ? "bg-cyan-400" : tier === "gold" ? "bg-yellow-400" : tier === "silver" ? "bg-slate-300" : "bg-orange-400"}`}
                      initial={{ width: 0 }}
                      animate={{ width: scoreLoading ? "0%" : `${securityScore?.score ?? 0}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                {!scoreLoading && securityScore && (
                  <div className="flex gap-4 shrink-0 text-xs text-muted-foreground">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{securityScore.threatsAvoided}</div>
                      <div>Threats Caught</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{securityScore.safeScans}</div>
                      <div>Safe Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{securityScore.totalScans}</div>
                      <div>Total Scans</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scan type breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card className="bg-card/50 border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold shrink-0">Scan Breakdown</div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: statsLoading ? "0%" : `${urlPct}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-primary font-medium w-10 text-right">
                    {statsLoading ? "—" : <>{stats?.urlScans ?? 0} URL</>}
                  </span>
                </div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <Mail className="h-3.5 w-3.5 text-chart-5 shrink-0" />
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-chart-5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: statsLoading ? "0%" : `${100 - urlPct}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-chart-5 font-medium w-14 text-right">
                    {statsLoading ? "—" : <>{stats?.emailScans ?? 0} Email</>}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trend Chart */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              7-Day Scan Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {trendLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trend && trend.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={d => safeFormatDate(d, "EEE")} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    labelFormatter={d => safeFormatDate(d, "MMM d, yyyy")}
                    formatter={(v: number) => [v, "Scans"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#trendGrad)" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Activity className="h-8 w-8 opacity-30" />
                No scan activity in the past 7 days
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="lg:col-span-1 border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] flex items-center justify-center">
              {riskLoading ? <Skeleton className="h-[220px] w-[220px] rounded-full" /> : (
                (!riskBreakdown || (riskBreakdown.safe + riskBreakdown.suspicious + riskBreakdown.high_risk === 0)) ? (
                  <div className="text-muted-foreground text-sm flex flex-col items-center">
                    <Target className="h-8 w-8 mb-2 opacity-50" />
                    No scan data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" isAnimationActive={true}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              )}
            </CardContent>
          </Card>

          {/* Threat Categories */}
          <Card className="lg:col-span-2 border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Threat Category Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              {catLoading ? (
                <Skeleton className="h-full w-full" />
              ) : !threatCategories || threatCategories.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <ShieldCheck className="h-8 w-8 opacity-30" />
                  No threat category data yet — run some scans!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={threatCategories} margin={{ top: 4, right: 8, bottom: 40, left: -10 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(v: number) => [v, "Detections"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {threatCategories.map((_, index) => (
                        <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Scans */}
          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Interceptions</CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No recent activity logged.</div>
                  ) : (
                    recentScans?.map((scan, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.07 }}
                        key={scan.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-1.5 rounded-md shrink-0 ${scan.type === 'url' ? 'bg-primary/10 text-primary' : 'bg-chart-5/10 text-chart-5'}`}>
                            {scan.type === 'url' ? <LinkIcon className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-xs truncate max-w-[160px] sm:max-w-[220px]">{scan.target}</div>
                            <div className="text-xs text-muted-foreground">{safeFormatDate(scan.createdAt, 'MMM d HH:mm')}</div>
                          </div>
                        </div>
                        <RiskBadge level={scan.riskLevel} />
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Threat Feed */}
          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-4 w-4 text-destructive animate-pulse" />
                Live Threat Feed
              </CardTitle>
              <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">auto-refresh 30s</Badge>
            </CardHeader>
            <CardContent>
              {feedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !threatFeed || threatFeed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <ShieldCheck className="h-8 w-8 opacity-30 text-chart-3" />
                  No active threats detected.
                </div>
              ) : (
                <div className="space-y-2">
                  {threatFeed.map((threat, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={threat.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        threat.riskLevel === "high_risk"
                          ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                          : "border-chart-4/30 bg-chart-4/5 hover:border-chart-4/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-1.5 rounded-md shrink-0 ${threat.riskLevel === "high_risk" ? "bg-destructive/15 text-destructive" : "bg-chart-4/15 text-chart-4"}`}>
                          {threat.type === 'url' ? <LinkIcon className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-xs truncate max-w-[160px] sm:max-w-[220px]">{threat.target}</div>
                          <div className="text-xs text-muted-foreground">{safeFormatDate(threat.createdAt, 'MMM d HH:mm')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold ${threat.riskLevel === "high_risk" ? "text-destructive" : "text-chart-4"}`}>
                          {threat.riskScore}
                        </span>
                        <RiskBadge level={threat.riskLevel} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
