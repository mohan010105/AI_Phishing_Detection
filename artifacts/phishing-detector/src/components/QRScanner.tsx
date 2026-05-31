import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Upload, Loader2, AlertOctagon, Link as LinkIcon, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { AiExplanation } from "@/components/ai-explanation";

export interface QRScannerProps {
  apiBase?: string;
  onScanSuccess?: (result: any) => void;
}

export function QRScanner({ apiBase = "/api/", onScanSuccess }: QRScannerProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    const accepted = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!accepted.includes(file.type)) {
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

      const resp = await fetch(`${apiBase}scan/qr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await resp.json() as any;
      if (!resp.ok) {
        setError(data.error ?? "Scan failed");
        return;
      }
      setResult(data);
      if (onScanSuccess) {
        onScanSuccess(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [toast, apiBase, onScanSuccess]);

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
    <div className="space-y-4">
      {!result && (
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Upload QR Code
            </CardTitle>
            <CardDescription>Supported formats: PNG, JPG, JPEG, WEBP · Max 8 MB</CardDescription>
          </CardHeader>
          <CardContent>
            <label
              className={`flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/30"}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onInputChange} />
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
                    <Upload className="h-6 w-6 text-primary" />
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
                      {result.findings.map((f: string, i: number) => (
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
  );
}
