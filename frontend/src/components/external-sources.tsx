import { ExternalSource } from "@/services";
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const SOURCE_ICONS: Record<string, string> = {
  "VirusTotal": "🛡️",
  "Google Safe Browsing": "🔍",
  "AbuseIPDB": "🌐",
};

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof ShieldCheck;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  clean:       { label: "Clean",       color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  icon: ShieldCheck },
  safe:        { label: "Safe",        color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  icon: ShieldCheck },
  suspicious:  { label: "Suspicious",  color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: ShieldAlert },
  malicious:   { label: "Malicious",   color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: ShieldX },
  unsafe:      { label: "Unsafe",      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: ShieldX },
  abusive:     { label: "Abusive",     color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: ShieldX },
  unavailable: { label: "N/A",         color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border",       icon: Shield },
  "n/a":       { label: "N/A",         color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border",       icon: Shield },
};

function getStatusConfig(status?: string): StatusConfig {
  return STATUS_CONFIG[status ?? "unavailable"] ?? STATUS_CONFIG["unavailable"];
}

interface Props {
  sources: ExternalSource[];
}

export function ExternalSources({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <ExternalLink className="h-4 w-4" />
        Threat Intelligence Sources
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sources.map((source, idx) => {
          const cfg = getStatusConfig(source.available ? source.status : "unavailable");
          const Icon = cfg.icon;
          return (
            <motion.div
              key={source.source}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{SOURCE_ICONS[source.source] ?? "🔒"}</span>
                  <span className="text-xs font-semibold text-foreground">{source.source}</span>
                </div>
                <div className={`flex items-center gap-1 ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase">{cfg.label}</span>
                </div>
              </div>
              {source.detail && (
                <p className="text-xs text-muted-foreground leading-relaxed">{source.detail}</p>
              )}
              {!source.available && (
                <p className="text-xs text-muted-foreground italic">API not available</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ExternalSourcesSkeleton() {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Querying Threat Intelligence...
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {["VirusTotal", "Google Safe Browsing", "AbuseIPDB"].map((name, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{SOURCE_ICONS[name]}</span>
              <span className="text-xs font-semibold text-muted-foreground">{name}</span>
            </div>
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
