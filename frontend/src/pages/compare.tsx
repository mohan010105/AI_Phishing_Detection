import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { IncidentResponseCard } from "@/components/ai-explanation";
import { Loader2, GitCompare, Trophy, ShieldAlert, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api/";

interface CompareSide {
  target: string;
  type: string;
  riskScore: number;
  riskLevel: "safe" | "suspicious" | "high_risk";
  findings: string[];
  explanation: string | null;
  incidentResponse: string[];
}

interface CompareResult {
  a: CompareSide;
  b: CompareSide;
  summary: string;
  winner: "a" | "b" | "tie";
}

export default function ComparePage() {
  const { toast } = useToast();
  const [typeA, setTypeA] = useState<"url" | "email">("url");
  const [targetA, setTargetA] = useState("");
  const [typeB, setTypeB] = useState<"url" | "email">("url");
  const [targetB, setTargetB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleCompare = async () => {
    if (!targetA.trim() || !targetB.trim()) {
      toast({ variant: "destructive", title: "Missing Input", description: "Both targets are required." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("phishing_token");
      const resp = await fetch(`${API_BASE}scan/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ typeA, targetA: targetA.trim(), typeB, targetB: targetB.trim() }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Comparison failed");
      }
      const data = await resp.json() as CompareResult;
      setResult(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Comparison Failed", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const levelColor = (level: string) =>
    level === "high_risk" ? "border-destructive bg-destructive/5" :
    level === "suspicious" ? "border-chart-4 bg-chart-4/5" :
    "border-chart-3 bg-chart-3/5";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            Threat Comparison Engine
          </h1>
          <p className="text-muted-foreground mt-1">Analyze two targets side by side and get an AI-powered comparison report.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Target A */}
          <Card className="border-primary/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">TARGET A</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={typeA} onValueChange={v => setTypeA(v as "url" | "email")}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              {typeA === "url" ? (
                <Input
                  placeholder="https://suspicious-domain.com"
                  className="font-mono bg-secondary/30"
                  value={targetA}
                  onChange={e => setTargetA(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <Textarea
                  placeholder="Paste email content here..."
                  className="font-mono bg-secondary/30 min-h-[100px]"
                  value={targetA}
                  onChange={e => setTargetA(e.target.value)}
                  disabled={loading}
                />
              )}
            </CardContent>
          </Card>

          {/* Target B */}
          <Card className="border-chart-5/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-chart-5/20 text-chart-5 text-xs font-bold">TARGET B</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={typeB} onValueChange={v => setTypeB(v as "url" | "email")}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              {typeB === "url" ? (
                <Input
                  placeholder="https://another-site.com"
                  className="font-mono bg-secondary/30"
                  value={targetB}
                  onChange={e => setTargetB(e.target.value)}
                  disabled={loading}
                />
              ) : (
                <Textarea
                  placeholder="Paste email content here..."
                  className="font-mono bg-secondary/30 min-h-[100px]"
                  value={targetB}
                  onChange={e => setTargetB(e.target.value)}
                  disabled={loading}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleCompare}
            disabled={loading}
            className="px-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing Both Targets...</>
            ) : (
              <><GitCompare className="h-5 w-5 mr-2" /> Run Comparison</>
            )}
          </Button>
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 border border-border bg-card/30 rounded-xl"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <ShieldAlert className="h-16 w-16 text-primary relative z-10 animate-pulse" />
            </div>
            <p className="mt-6 text-lg font-medium animate-pulse text-primary">Running parallel threat analysis...</p>
            <p className="text-sm text-muted-foreground mt-2">Scanning both targets simultaneously · Generating AI comparison</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Winner Banner */}
              <Card className={`border-2 ${
                result.winner === "tie" ? "border-primary/40 bg-primary/5" :
                result.winner === "a" ? "border-destructive/40 bg-destructive/5" :
                "border-destructive/40 bg-destructive/5"
              }`}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  {result.winner === "tie" ? (
                    <Minus className="h-5 w-5 text-primary" />
                  ) : (
                    <Trophy className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">
                      {result.winner === "tie" ? "Similar Risk Level" :
                       result.winner === "a" ? "Target A is More Dangerous" :
                       "Target B is More Dangerous"}
                    </div>
                    {result.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5">{result.summary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {([["a", "TARGET A", "primary"] , ["b", "TARGET B", "chart-5"]] as const).map(([key, label, color]) => {
                  const side = result[key];
                  const isWinner = result.winner === key;
                  return (
                    <Card key={key} className={`border overflow-hidden shadow-xl ${levelColor(side.riskLevel)} ${isWinner ? "ring-2 ring-destructive/50" : ""}`}>
                      <div className={`h-1.5 w-full ${side.riskLevel === "high_risk" ? "bg-destructive" : side.riskLevel === "suspicious" ? "bg-chart-4" : "bg-chart-3"}`} />
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded bg-${color}/20 text-${color}`}>{label}</span>
                            <div className="font-mono text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={side.target}>
                              {side.target.slice(0, 50)}{side.target.length > 50 ? "…" : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isWinner && result.winner !== "tie" && (
                              <Trophy className="h-4 w-4 text-destructive" />
                            )}
                            <RiskBadge level={side.riskLevel} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <RiskScore score={side.riskScore} />
                          <div className="text-xs text-muted-foreground">
                            {side.findings.length} indicator{side.findings.length !== 1 ? "s" : ""} detected
                          </div>
                        </div>

                        {side.explanation && (
                          <p className="text-xs text-foreground border-l-2 border-primary/40 pl-2 leading-relaxed">
                            {side.explanation}
                          </p>
                        )}

                        {side.findings.length > 0 && (
                          <ul className="space-y-1">
                            {side.findings.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${side.riskLevel === "high_risk" ? "bg-destructive" : side.riskLevel === "suspicious" ? "bg-chart-4" : "bg-chart-3"}`} />
                                {f}
                              </li>
                            ))}
                            {side.findings.length > 4 && (
                              <li className="text-xs text-muted-foreground pl-3.5">+{side.findings.length - 4} more indicators</li>
                            )}
                          </ul>
                        )}

                        {side.incidentResponse.length > 0 && (
                          <IncidentResponseCard steps={side.incidentResponse} />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
