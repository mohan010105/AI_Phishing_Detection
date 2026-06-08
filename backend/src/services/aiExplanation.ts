import OpenAI from "openai";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

// ---------------------------------------------------------------------------
// Provider setup — same dual-provider pattern as aiAssistant.ts
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

let geminiClient: OpenAI | null = null;
if (env.GEMINI_API_KEY) {
  geminiClient = new OpenAI({
    apiKey: env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

export interface AiSummary {
  technical: string;
  executive: string;
  beginner: string;
  incidentResponse: string[];
}

export interface ThreatExplanation {
  explanation: string;
  aiSummary: AiSummary;
}

export async function generateThreatExplanation(
  type: "url" | "email" | "qr" | "screenshot",
  target: string,
  riskScore: number,
  riskLevel: string,
  findings: string[]
): Promise<ThreatExplanation | null> {
  if (!openaiClient && !geminiClient) {
    logger.debug("No AI provider configured — skipping threat explanation generation");
    return null;
  }

  const typeLabel = type === "qr" ? "QR code URL" : type === "screenshot" ? "website screenshot" : type;
  const findingsList = findings.length > 0 ? findings.slice(0, 8).join("; ") : "No specific indicators found";
  const levelLabel = riskLevel === "high_risk" ? "HIGH RISK" : riskLevel === "suspicious" ? "SUSPICIOUS" : "SAFE";

  const prompt = `You are a cybersecurity analyst. Analyze this ${typeLabel} scan result and produce summaries plus incident response steps.

Target: ${target.slice(0, 200)}
Risk Score: ${riskScore}/100
Risk Level: ${levelLabel}
Detection Findings: ${findingsList}

Respond with ONLY valid JSON in exactly this shape:
{
  "explanation": "One clear sentence (max 40 words) explaining why this ${typeLabel} got a ${levelLabel} verdict.",
  "technical": "2-3 sentences for a security engineer describing the specific IOCs and detection logic.",
  "executive": "1-2 sentences for a non-technical manager describing the business risk.",
  "beginner": "1 sentence in plain English for a normal user explaining the risk simply.",
  "incidentResponse": ["Action step 1", "Action step 2", "Action step 3", "Action step 4"]
}

For incidentResponse, provide 3-5 specific, actionable steps appropriate for a ${levelLabel} ${typeLabel} threat.
If SAFE: steps like "No action required", "Bookmark for future reference".
If SUSPICIOUS: steps like "Avoid entering credentials", "Verify domain legitimacy".
If HIGH RISK: steps like "Do not visit this URL", "Change any entered passwords immediately", "Report to IT security".`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: prompt },
  ];

  // --- Attempt 1: OpenAI ---
  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3,
      });
      const result = parseExplanationResponse(completion.choices[0]?.message?.content);
      if (result) return result;
    } catch (err: any) {
      logger.warn({ err: err?.message, status: err?.status }, "OpenAI threat explanation failed, trying Gemini");
    }
  }

  // --- Attempt 2: Gemini fallback ---
  if (geminiClient) {
    try {
      const completion = await geminiClient.chat.completions.create({
        model: "gemini-2.0-flash",
        messages,
        max_tokens: 500,
        temperature: 0.3,
      });
      const result = parseExplanationResponse(completion.choices[0]?.message?.content);
      if (result) return result;
    } catch (err: any) {
      logger.warn({ err: err?.message, status: err?.status }, "Gemini threat explanation also failed");
    }
  }

  logger.warn("All AI providers failed for threat explanation");
  return null;
}

function parseExplanationResponse(raw: string | null | undefined): ThreatExplanation | null {
  if (!raw) return null;

  try {
    // Strip markdown code fences if Gemini wraps in ```json ... ```
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    }

    const parsed = JSON.parse(cleaned) as {
      explanation?: string;
      technical?: string;
      executive?: string;
      beginner?: string;
      incidentResponse?: unknown;
    };

    const incidentResponse = Array.isArray(parsed.incidentResponse)
      ? (parsed.incidentResponse as unknown[]).filter(s => typeof s === "string") as string[]
      : [];

    return {
      explanation: parsed.explanation ?? "",
      aiSummary: {
        technical: parsed.technical ?? "",
        executive: parsed.executive ?? "",
        beginner: parsed.beginner ?? "",
        incidentResponse,
      },
    };
  } catch (parseErr) {
    logger.warn({ raw: raw?.slice(0, 200) }, "Failed to parse AI explanation JSON");
    return null;
  }
}
