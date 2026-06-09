import { useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Upload, Loader2, AlertOctagon, Link as LinkIcon, Image, ShieldCheck, ShieldAlert, ShieldX, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { AiExplanation } from "@/components/ai-explanation";
import { ExternalSources } from "@/components/external-sources";
import { customFetch } from "@/services";

const API_BASE = "/api/";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface QrScanResultData {
  id: number;
  type: string;
  extractedFrom: string;
  target: string;
  riskScore: number;
  riskLevel: "safe" | "suspicious" | "high_risk";
  findings: string[];
  externalSources?: Array<{
    source: string;
    available: boolean;
    status?: string;
    detail?: string;
    score?: number;
  }>;
  explanation?: string | null;
  aiSummary?: {
    technical: string;
    executive: string;
    beginner: string;
    incidentResponse: string[];
  } | null;
  recommendation?: {
    category: string;
    title: string;
    steps: string[];
  } | null;
  userId?: number | null;
  createdAt: string;
  error?: string;
}

export default function ScanQr() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QrScanResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a PNG, JPG, or WEBP image.", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 8 MB.", variant: "destructive" });
      return;
    }

    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const data = await customFetch<QrScanResultData>("/api/scan/qr", {
        method: "POST",
        body: fd,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.data?.error || "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setPreview(null);
    setLoading(false);
  };

  const riskIcon = (level: string) => {
    if (level === "safe") return <ShieldCheck className="h-4 w-4 text-green-400" />;
    if (level === "suspicious") return <ShieldAlert className="h-4 w-4 text-yellow-400" />;
    return <ShieldX className="h-4 w-4 text-red-400" />;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" />
            QR Code Scanner
          </h1>
          <p className="text-muted-foreground mt-1">Upload a QR code image to extract and analyze the embedded URL.</p>
        </div>

        {!result && (
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Upload QR Code</CardTitle>
              <CardDescription>Supported formats: PNG, JPG, JPEG, WEBP · Max 8 MB</CardDescription>
            </CardHeader>
            <CardContent>
              <label
                className={`flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/30"}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onInputChange} />
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="text-sm">Scanning QR code...</span>
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={preview} alt="QR code" className="max-h-28 max-w-28 rounded border border-border object-contain" />
                    <span className="text-xs text-muted-foreground">Click or drag to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="p-4 rounded-full bg-secondary">
                      <Image className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs mt-1">PNG, JPG, JPEG, WEBP</p>
                    </div>
                  </div>
                )}
              </label>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive"
                >
                  <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-border bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    QR Scan Result
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={reset}>Scan Another</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                    <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                    <div className="truncate">
                      <div className="text-xs text-muted-foreground mb-0.5">Extracted URL</div>
                      <div className="font-mono text-sm truncate text-foreground">{result.target}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <RiskScore score={result.riskScore} />
                    <RiskBadge level={result.riskLevel} />
                  </div>

                  {result.findings && result.findings.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Detection Findings</div>
                      <ul className="space-y-1.5">
                        {result.findings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-destructive mt-0.5">›</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* External Threat Intelligence Sources */}
              {result.externalSources && result.externalSources.length > 0 && (
                <Card className="border-border bg-card/50">
                  <CardContent className="pt-6">
                    <ExternalSources sources={result.externalSources} />
                  </CardContent>
                </Card>
              )}

              {/* AI Explanation */}
              {(result.explanation || result.aiSummary) && (
                <AiExplanation explanation={result.explanation} aiSummary={result.aiSummary} />
              )}

              {/* Recommendation */}
              {result.recommendation && (
                <Card className="border-border bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      {result.recommendation.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.recommendation.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
