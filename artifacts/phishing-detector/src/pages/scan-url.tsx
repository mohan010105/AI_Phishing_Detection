import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useScanUrl, ScanResult } from "@workspace/api-client-react";
import { Loader2, Link as LinkIcon, ShieldAlert, Crosshair, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { ExternalSources } from "@/components/external-sources";
import { AiExplanation } from "@/components/ai-explanation";
import { motion } from "framer-motion";

const scanUrlSchema = z.object({
  url: z.string().url({ message: "Must be a valid URL (e.g. https://example.com)" }),
});

type ScanUrlValues = z.infer<typeof scanUrlSchema>;

export default function ScanUrlPage() {
  const { toast } = useToast();
  const scanMutation = useScanUrl();
  const [result, setResult] = useState<ScanResult | null>(null);

  const form = useForm<ScanUrlValues>({
    resolver: zodResolver(scanUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = (data: ScanUrlValues) => {
    setResult(null);
    scanMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setResult(res);
          toast({
            title: "Analysis Complete",
            description: `Target processed. Risk Level: ${res.riskLevel.toUpperCase()}`,
            variant: res.riskLevel === "high_risk" ? "destructive" : "default",
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: err.data?.error || "Unable to process target.",
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            URL Inspector
          </h1>
          <p className="text-muted-foreground mt-1">Analyze web addresses for malicious intent and deceptive structures.</p>
        </div>

        <Card className="border-primary/20 bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Target Specification</CardTitle>
            <CardDescription>Enter the fully qualified URL to begin deep inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-start">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormControl>
                        <Input 
                          placeholder="https://suspicious-domain.com/login" 
                          className="font-mono bg-secondary/30 h-12"
                          disabled={scanMutation.isPending}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full sm:w-auto h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide"
                  disabled={scanMutation.isPending}
                >
                  {scanMutation.isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Crosshair className="h-5 w-5 mr-2" /> Execute Scan</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {scanMutation.isPending && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center p-12 border border-border bg-card/30 rounded-xl"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <ShieldAlert className="h-16 w-16 text-primary relative z-10 animate-pulse" />
            </div>
            <p className="mt-6 text-lg font-medium animate-pulse text-primary">Running Intelligence Checks...</p>
            <p className="text-sm text-muted-foreground mt-2">Querying VirusTotal · Google Safe Browsing · AbuseIPDB...</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border overflow-hidden shadow-2xl ${
              result.riskLevel === 'high_risk' ? 'border-destructive bg-destructive/5' : 
              result.riskLevel === 'suspicious' ? 'border-chart-4 bg-chart-4/5' : 
              'border-chart-3 bg-chart-3/5'
            }`}>
              <div className={`h-2 w-full ${
                result.riskLevel === 'high_risk' ? 'bg-destructive' : 
                result.riskLevel === 'suspicious' ? 'bg-chart-4' : 
                'bg-chart-3'
              }`} />
              
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Analysis Report</CardTitle>
                    <div className="font-mono text-sm text-muted-foreground mt-1 truncate max-w-md" title={result.target}>
                      Target: {result.target}
                    </div>
                  </div>
                  <RiskBadge level={result.riskLevel} className="w-fit text-sm px-3 py-1" />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Score */}
                  <div className="flex flex-col items-center justify-center p-6 bg-background rounded-lg border border-border min-w-[200px]">
                    <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Threat Score</div>
                    <RiskScore score={result.riskScore} />
                  </div>

                  {/* Findings */}
                  <div className="flex-1 space-y-4">
                    <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4" />
                      Identified Vectors
                    </div>
                    
                    {result.findings.length > 0 ? (
                      <ul className="space-y-3">
                        {result.findings.map((finding, idx) => (
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="flex items-start gap-3 p-3 rounded bg-background border border-border"
                          >
                            <div className="mt-0.5 min-w-[8px]">
                              <div className={`h-2 w-2 rounded-full ${
                                result.riskLevel === 'high_risk' ? 'bg-destructive' : 
                                result.riskLevel === 'suspicious' ? 'bg-chart-4' : 
                                'bg-chart-3'
                              }`} />
                            </div>
                            <span className="text-sm">{finding}</span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 rounded border border-dashed border-chart-3 text-chart-3 text-sm flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        No malicious indicators detected.
                      </div>
                    )}
                  </div>
                </div>

                {result.externalSources && result.externalSources.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <ExternalSources sources={result.externalSources} />
                  </div>
                )}
              </CardContent>
            </Card>

            {(result.explanation || result.aiSummary) && (
              <AiExplanation explanation={result.explanation} aiSummary={result.aiSummary} />
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
