import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ChevronDown, ChevronUp, Cpu, Briefcase, User, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AiSummary {
  technical: string;
  executive: string;
  beginner: string;
  incidentResponse?: string[];
}

interface AiExplanationProps {
  explanation: string | null | undefined;
  aiSummary: AiSummary | null | undefined;
}

export function AiExplanation({ explanation, aiSummary }: AiExplanationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!explanation && !aiSummary) return null;

  const summaryTabs = [
    { key: "technical" as const, label: "Technical", icon: Cpu, value: aiSummary?.technical },
    { key: "executive" as const, label: "Executive", icon: Briefcase, value: aiSummary?.executive },
    { key: "beginner" as const, label: "Plain English", icon: User, value: aiSummary?.beginner },
  ].filter(t => t.value);

  const incidentSteps = aiSummary?.incidentResponse ?? [];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Threat Analysis
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">GPT-4o mini</Badge>
          </CardTitle>
          {(summaryTabs.length > 0 || incidentSteps.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-primary h-7 px-2"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" /> Collapse</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" /> View Details</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {explanation && (
          <p className="text-sm text-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
            {explanation}
          </p>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              {summaryTabs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {summaryTabs.map(tab => (
                    <div key={tab.key} className="rounded-lg border border-border bg-card/50 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{tab.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {incidentSteps.length > 0 && (
                <div className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-chart-4 mb-3">
                    <ShieldCheck className="h-4 w-4" />
                    Incident Response Recommendations
                  </div>
                  <ol className="space-y-2">
                    {incidentSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-chart-4/20 text-chart-4 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function IncidentResponseCard({ steps }: { steps: string[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-4 mb-3">
        <AlertTriangle className="h-4 w-4" />
        Incident Response
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-chart-4/20 text-chart-4 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
