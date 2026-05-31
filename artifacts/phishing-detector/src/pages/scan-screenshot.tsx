import { useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertOctagon, Image, FileSearch, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { AiExplanation } from "@/components/ai-explanation";
import type { ScreenshotScanResult } from "@workspace/api-client-react";

const API_BASE = "/api/";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function ScanScreenshot() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenshotScanResult | null>(null);
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
      const token = localStorage.getItem("phishing_token");
      const fd = new FormData();
      fd.append("image", file);

      const resp = await fetch(`${API_BASE}scan/screenshot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await resp.json() as ScreenshotScanResult & { error?: string };
      if (!resp.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
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

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-primary" />
            Screenshot Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">Upload a screenshot of a suspicious website for AI-powered phishing analysis.</p>
        </div>

        {!result && (
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Upload Screenshot</CardTitle>
              <CardDescription>
                GPT-4o Vision analyzes for fake login forms, brand impersonation, and credential theft indicators.
                Supported: PNG, JPG, JPEG, WEBP · Max 8 MB
              </CardDescription>
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
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">AI analyzing screenshot...</p>
                      <p className="text-xs mt-1 text-muted-foreground">GPT-4o Vision is examining for phishing indicators</p>
                    </div>
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={preview} alt="Screenshot" className="max-h-28 rounded border border-border object-contain" />
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

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Fake login forms", "Brand impersonation", "Urgency tactics", "Credential theft"].map(f => (
                  <div key={f} className="text-center p-2 rounded border border-border bg-background">
                    <FileSearch className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{f}</p>
                  </div>
                ))}
              </div>

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
                    <Camera className="h-4 w-4 text-primary" />
                    Screenshot Analysis
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={reset}>Analyze Another</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preview && (
                    <img src={preview} alt="Analyzed screenshot" className="w-full max-h-48 object-contain rounded border border-border bg-background" />
                  )}

                  <div className="flex items-center gap-4">
                    <RiskScore score={result.riskScore} />
                    <RiskBadge level={result.riskLevel} />
                  </div>

                  {result.detectedText && (
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 uppercase font-semibold">
                        <FileText className="h-3 w-3" />
                        Detected Text
                      </div>
                      <p className="text-sm font-mono text-foreground">{result.detectedText}</p>
                    </div>
                  )}

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

              {(result.explanation || result.aiSummary) && (
                <AiExplanation explanation={result.explanation} aiSummary={result.aiSummary} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
