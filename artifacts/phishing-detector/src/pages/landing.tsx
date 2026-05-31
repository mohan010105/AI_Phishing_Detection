import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import { Shield, Lock, Search, Zap, ChevronRight, Activity, Globe, Database, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">PHISH_GUARD</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <div className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                Login
              </div>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Initialize
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 flex items-center justify-center min-h-[80vh]">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-destructive/10 blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-primary/20 text-primary text-sm mb-8"
          >
            <Activity className="h-4 w-4" />
            <span>Active Threat Monitoring Active</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60"
          >
            DETECT PHISHING.<br />BEFORE INFECTION.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Advanced AI-driven threat intelligence platform. Analyze URLs and emails in real-time. Uncover malicious intent with precision scoring and actionable findings.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                Start Scanning <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-border hover:bg-secondary/50 font-bold tracking-wide">
                Access Console
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Tactical Capabilities</h2>
            <p className="text-muted-foreground">Military-grade analysis at your fingertips.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
              <Globe className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Deep URL Inspection</h3>
              <p className="text-muted-foreground text-sm">
                Resolves redirects, analyzes domain age, checks reputation databases, and evaluates page content structure for deception.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
              <Mail className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Payload Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Scans email headers, sender reputation, and body text for social engineering, urgency cues, and malicious attachments.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
              <Database className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Threat History</h3>
              <p className="text-muted-foreground text-sm">
                Maintains an immutable ledger of all scans for retrospective analysis, reporting, and incident response tracking.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: "Threats Detected", value: "2.4M+" },
              { label: "URLs Analyzed Daily", value: "50K+" },
              { label: "Detection Rate", value: "99.7%" },
              { label: "Response Time", value: "<200ms" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <div className="text-3xl md:text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section className="py-24 bg-card/20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold tracking-tight mb-6">Deterministic Risk Scoring</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our engine doesn't just guess. It provides a concrete risk score from 0-100 based on multiple threat vectors, enriched by VirusTotal and Google Safe Browsing intelligence. Every high-risk flag comes with explicitly stated findings.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Shield, label: "HTTPS & certificate validation" },
                  { icon: Search, label: "Homograph and typosquatting detection" },
                  { icon: Lock, label: "External threat intelligence enrichment" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="rounded-xl border border-border bg-card p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent opacity-50" />
                
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="font-mono text-sm text-muted-foreground truncate mr-4">Target: https://secure-login-update-paypal.com/auth</div>
                  <div className="px-2 py-1 rounded bg-destructive/20 text-destructive text-xs font-bold animate-pulse">HIGH RISK</div>
                </div>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-5xl font-black text-destructive tracking-tighter">98<span className="text-xl text-muted-foreground">/100</span></div>
                  <div className="flex-1">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive w-[98%]" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Findings</div>
                  <div className="text-sm bg-destructive/10 text-destructive border border-destructive/20 px-3 py-2 rounded">
                    Google Safe Browsing: URL flagged for social engineering / phishing
                  </div>
                  <div className="text-sm bg-destructive/10 text-destructive border border-destructive/20 px-3 py-2 rounded">
                    Contains brand name "paypal" but not owned by PayPal Inc.
                  </div>
                  <div className="text-sm bg-chart-4/10 text-chart-4 border border-chart-4/20 px-3 py-2 rounded">
                    VirusTotal: 12 engine(s) flagged this URL as malicious
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-border bg-card/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Ready to secure your perimeter?</h2>
          <Link href="/register">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              Initialize Console
            </Button>
          </Link>
          <div className="mt-12 pt-8 border-t border-border/50 text-sm text-muted-foreground flex justify-between items-center">
            <span>© 2025 PHISH_GUARD Intelligence.</span>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer">Terms</span>
              <span className="hover:text-foreground cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
