import { useState, useMemo } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import {
  useAdminGetUsers, getAdminGetUsersQueryKey,
  useAdminGetReports, getAdminGetReportsQueryKey,
  useAdminGetAnalytics,
  AdminGetReportsRiskLevel,
} from "@/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RiskBadge } from "@/components/risk-badge";
import {
  Settings, Users, ShieldAlert, ChevronLeft, ChevronRight,
  BarChart3, Link2, Mail, TrendingUp, AlertTriangle, Search, Download, FileJson,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

const RISK_COLORS = { safe: "#22c55e", suspicious: "#f59e0b", high_risk: "#ef4444" };

function safeFormatDate(d: any, formatStr: string): string {
  if (!d) return "N/A";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return format(date, formatStr);
  } catch {
    return String(d);
  }
}


function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent?: string }) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-bold mt-1 font-mono ${accent ?? "text-foreground"}`}>{value}</p>
          </div>
          <div className="p-3 rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useAdminGetAnalytics();

  const pieData = data ? [
    { name: "Safe", value: data.safeCount, color: RISK_COLORS.safe },
    { name: "Suspicious", value: data.suspiciousCount, color: RISK_COLORS.suspicious },
    { name: "High Risk", value: data.highRiskCount, color: RISK_COLORS.high_risk },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-border"><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : data ? (
          <>
            <StatCard label="Total Users" value={data.totalUsers} icon={Users} accent="text-primary" />
            <StatCard label="Total Scans" value={data.totalScans} icon={BarChart3} />
            <StatCard label="URL Scans" value={data.urlScans} icon={Link2} />
            <StatCard label="Email Scans" value={data.emailScans} icon={Mail} />
            <StatCard label="Scans Today" value={data.scansToday} icon={TrendingUp} accent="text-primary" />
            <StatCard label="This Week" value={data.scansThisWeek} icon={TrendingUp} />
            <StatCard label="High Risk" value={data.highRiskCount} icon={AlertTriangle} accent="text-destructive" />
            <StatCard label="Suspicious" value={data.suspiciousCount} icon={ShieldAlert} accent="text-yellow-400" />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Scan Activity — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : data && data.dailyScans.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.dailyScans}>
                  <defs>
                    <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={d => safeFormatDate(d, "MMM d")} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    labelFormatter={d => safeFormatDate(d, "MMM d, yyyy")}
                  />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#scanGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No scan data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : data ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Top Threats Detected
          </CardTitle>
          <CardDescription>Highest-risk scans across the platform</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data || data.topThreats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No high-risk threats logged yet.</TableCell>
                </TableRow>
              ) : (
                data.topThreats.map(threat => (
                  <TableRow key={threat.id}>
                    <TableCell className="font-mono text-xs max-w-[280px] truncate" title={threat.target}>{threat.target}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase font-mono">{threat.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-destructive">{threat.riskScore}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {safeFormatDate(threat.createdAt, "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function exportReportsCsv(reports: { target: string; riskLevel: string; riskScore?: number; findings: string[]; createdAt: string }[]) {
  const header = "Target,Risk Level,Findings,Date";
  const rows = reports.map(r =>
    `"${r.target.replace(/"/g, '""')}","${r.riskLevel}","${r.findings.join("; ").replace(/"/g, '""')}","${r.createdAt}"`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `phishguard-admin-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportReportsJson(reports: object[]) {
  const json = JSON.stringify(reports, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `phishguard-admin-reports-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [usersPage, setUsersPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [riskLevelFilter, setRiskLevelFilter] = useState<AdminGetReportsRiskLevel | "all">("all");
  const [userSearch, setUserSearch] = useState("");
  const limit = 10;

  const { data: usersData, isLoading: usersLoading } = useAdminGetUsers({ page: usersPage, limit }, {
    query: { queryKey: getAdminGetUsersQueryKey({ page: usersPage, limit }), placeholderData: keepPreviousData }
  });

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    const q = userSearch.toLowerCase().trim();
    if (!q) return usersData.users;
    return usersData.users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usersData?.users, userSearch]);

  const reportsParams = {
    page: reportsPage,
    limit,
    ...(riskLevelFilter !== "all" ? { riskLevel: riskLevelFilter } : {})
  };

  const { data: reportsData, isLoading: reportsLoading } = useAdminGetReports(reportsParams, {
    query: { queryKey: getAdminGetReportsQueryKey(reportsParams), placeholderData: keepPreviousData }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
            <Settings className="h-6 w-6" />
            Admin Console
          </h1>
          <p className="text-muted-foreground mt-1">System-wide surveillance, analytics, and operator management.</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-card border border-border">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShieldAlert className="h-4 w-4 mr-2" /> Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" /> Operators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-card/50 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Risk Filter:</span>
                <Select value={riskLevelFilter} onValueChange={(val: AdminGetReportsRiskLevel | "all") => { setRiskLevelFilter(val); setReportsPage(1); }}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="All Risks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Logs</SelectItem>
                    <SelectItem value="high_risk">Critical (High Risk)</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                {reportsData && reportsData.reports.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => exportReportsCsv(reportsData.reports)}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReportsJson(reportsData.reports)}>
                      <FileJson className="h-3.5 w-3.5 mr-1.5" /> JSON
                    </Button>
                  </>
                )}
                <span className="text-sm text-muted-foreground font-mono">
                  {reportsData ? `Total: ${reportsData.total}` : "Loading..."}
                </span>
              </div>
            </div>

            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !reportsData || reportsData.reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No reports found.</TableCell>
                      </TableRow>
                    ) : (
                      reportsData.reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs max-w-[250px] truncate" title={report.target}>
                            {report.target}
                          </TableCell>
                          <TableCell><RiskBadge level={report.riskLevel} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={report.findings.join(", ")}>
                            {report.findings.length > 0 ? report.findings.join(" • ") : "None"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {safeFormatDate(report.createdAt, "MMM d, yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {reportsData && reportsData.total > limit && (
              <div className="flex justify-between items-center p-4 border border-border bg-card/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Page {reportsPage} of {Math.ceil(reportsData.total / limit)}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={reportsPage === 1} onClick={() => setReportsPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={reportsPage >= Math.ceil(reportsData.total / limit)} onClick={() => setReportsPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Registered Operators</CardTitle>
                <CardDescription>
                  Personnel with system access clearance.
                  {userSearch && ` Showing ${filteredUsers.length} match${filteredUsers.length !== 1 ? "es" : ""}.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow>
                      <TableHead>Alias</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Clearance</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          {userSearch ? "No operators match your search." : "No operators found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="font-mono text-sm">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-primary text-primary-foreground" : ""}>
                              {u.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {safeFormatDate(u.createdAt, "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {usersData && usersData.total > limit && (
              <div className="flex justify-between items-center p-4 border border-border bg-card/50 rounded-lg mt-4">
                <div className="text-sm text-muted-foreground">Page {usersPage} of {Math.ceil(usersData.total / limit)}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={usersPage >= Math.ceil(usersData.total / limit)} onClick={() => setUsersPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
