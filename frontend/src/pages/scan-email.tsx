import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useScanEmail, ScanResult } from "@/services";
import { Loader2, Mail, FileSearch, ShieldAlert, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { ExternalSources } from "@/components/external-sources";
import { AiExplanation } from "@/components/ai-explanation";
import { motion } from "framer-motion";

const scanEmailSchema = z.object({
  content: z.string().min(10, { message: "Email content must be at least 10 characters for meaningful analysis" }),
  subject: z.string().optional(),
  sender: z.string().optional(),
});

type ScanEmailValues = z.infer<typeof scanEmailSchema>;

export default function ScanEmailPage() {
  const { toast } = useToast();
  const scanMutation = useScanEmail();
  const [result, setResult] = useState<ScanResult | null>(null);

  const form = useForm<ScanEmailValues>({
    resolver: zodResolver(scanEmailSchema),
    defaultValues: {
      content: "",
      subject: "",
      sender: "",
    },
  });

  const onSubmit = (data: ScanEmailValues) => {
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
            description: err.data?.error || "Unable to process payload.",
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
            <Mail className="h-6 w-6 text-primary" />
            Payload Inspector
          </h1>
          <p className="text-muted-foreground mt-1">Analyze email content for social engineering and malicious intent.</p>
        </div>

        <Card className="border-primary/20 bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Email Specification</CardTitle>
            <CardDescription>Paste the raw text or full payload. Sender and subject improve heuristic accuracy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Address (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin@paypal-support.com" 
                            className="font-mono bg-secondary/30"
                            disabled={scanMutation.isPending}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Line (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="URGENT: Account Suspension Notice" 
                            className="font-mono bg-secondary/30"
                            disabled={scanMutation.isPending}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Content / Payload</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dear user, your account has been compromised. Click here immediately..." 
                          className="font-mono bg-secondary/30 min-h-[200px]"
                          disabled={scanMutation.isPending}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide"
                    disabled={scanMutation.isPending}
                  >
                    {scanMutation.isPending ? (
                      <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><FileSearch className="h-5 w-5 mr-2" /> Execute Scan</>
                    )}
                  </Button>
                </div>
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
            <p className="mt-6 text-lg font-medium animate-pulse text-primary">Analyzing Payload...</p>
            <p className="text-sm text-muted-foreground mt-2">Checking heuristics, extracting URLs, querying threat intelligence...</p>
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
                    <div className="font-mono text-sm text-muted-foreground mt-1">
                      Target: Email Payload
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
                        No malicious indicators detected in text.
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
