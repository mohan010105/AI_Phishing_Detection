import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Loader2, Trash2, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "/api/";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "How can I identify a phishing email?",
  "What makes a URL suspicious?",
  "Explain brand impersonation attacks",
  "What is spear phishing?",
  "How do I report a phishing attempt?",
  "What are common social engineering tactics?",
];

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm PhishGuard AI — your cybersecurity assistant. I can help you understand phishing threats, interpret scan results, and answer questions about email and URL security. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem("phishing_token");
      const resp = await fetch(`${API_BASE}assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: messageText }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        const errorMessage = err.error ?? "Request failed";
        // Show the specific error as an assistant message so the user sees what went wrong
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date(),
        }]);
        toast({ title: "AI Assistant Error", description: errorMessage, variant: "destructive" });
        return;
      }

      const data = await resp.json() as { reply: string };
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error. Please check your connection.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date(),
      }]);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem("phishing_token");
      await fetch(`${API_BASE}assistant/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([{
        role: "assistant",
        content: "Conversation cleared. How can I help you today?",
        timestamp: new Date(),
      }]);
    } catch {
      toast({ title: "Error", description: "Failed to clear history", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              AI Security Assistant
            </h1>
            <p className="text-muted-foreground mt-1">Ask anything about phishing threats and cybersecurity.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        <Card className="flex-1 flex flex-col border-border bg-card/50 min-h-0">
          <CardHeader className="pb-3 border-b border-border shrink-0">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by GPT-4o mini · Context-aware · Cybersecurity-specialized
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "bg-card border border-border text-foreground" : "bg-primary text-primary-foreground"}`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {messages.length === 1 && !loading && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-xs bg-secondary hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-colors text-muted-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about phishing threats, scan results, or cybersecurity..."
                className="min-h-[44px] max-h-[120px] resize-none bg-background border-border focus:border-primary/50"
                rows={1}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="shrink-0 h-11 w-11"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
