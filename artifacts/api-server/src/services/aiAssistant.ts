import OpenAI from "openai";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

// ---------------------------------------------------------------------------
// Provider setup
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

// Gemini uses the OpenAI-compatible endpoint
let geminiClient: OpenAI | null = null;
if (env.GEMINI_API_KEY) {
  geminiClient = new OpenAI({
    apiKey: env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

const SYSTEM_PROMPT = `You are PhishGuard AI — an expert cybersecurity assistant AND tutor specializing in phishing detection, threat intelligence, and email/URL security analysis.

Your dual role:
1. SECURITY ASSISTANT: Help users understand scan results, interpret risk scores, analyze specific URLs/emails, and provide incident response guidance.
2. CYBERSECURITY TUTOR: Educate users on security concepts in clear, accessible language.

Topics you excel at:
- Phishing attacks: techniques, red flags, real-world examples
- Email security: SPF, DKIM, DMARC, header analysis
- URL analysis: typosquatting, IDN homographs, URL shorteners, suspicious TLDs
- Malware: types, infection vectors, removal steps
- Social engineering: pretexting, urgency tactics, impersonation
- Incident response: what to do when compromised
- Password security & MFA
- Browser and network security basics

Teaching style:
- Use clear analogies for beginners ("SPF is like a guest list for your email server")
- Provide specific, actionable advice
- Give real examples when helpful
- For concept questions, structure: Definition → Why it matters → Example → How to protect yourself

Keep responses concise (under 250 words), factual, and engaging. Use bullet points for steps.
If asked about a specific threat, be specific and actionable.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AiProvider = "openai" | "gemini";

export interface AiProviderStatus {
  provider: AiProvider;
  available: boolean;
  model: string;
}

/**
 * Returns the current availability status of each AI provider.
 */
export function getAiProviderStatus(): AiProviderStatus[] {
  return [
    { provider: "openai", available: !!openaiClient, model: "gpt-4o-mini" },
    { provider: "gemini", available: !!geminiClient, model: "gemini-2.0-flash" },
  ];
}

/**
 * Try OpenAI first, then fall back to Gemini.
 * Returns a descriptive error message when both providers fail.
 */
export async function chatWithAssistant(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const providers = getAiProviderStatus();
  const anyAvailable = providers.some((p) => p.available);

  if (!anyAvailable) {
    const missing: string[] = [];
    if (!env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
    if (!env.GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
    logger.error({ missing }, "No AI providers configured — assistant unavailable");
    throw new AiAssistantError(
      `AI Assistant is unavailable. Missing API key(s): ${missing.join(", ")}. Please configure at least one AI provider.`,
      "NO_PROVIDER_CONFIGURED"
    );
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  // --- Attempt 1: OpenAI ---
  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.5,
      });
      const reply = completion.choices[0]?.message?.content;
      if (reply) {
        logger.info("AI response generated via OpenAI");
        return reply;
      }
    } catch (err: any) {
      logger.warn({ err: err?.message, status: err?.status, code: err?.code }, "OpenAI call failed, attempting Gemini fallback");

      // If Gemini is not available, surface a specific OpenAI error
      if (!geminiClient) {
        throw categorizeOpenAIError(err);
      }
    }
  }

  // --- Attempt 2: Gemini (via OpenAI-compatible API) ---
  if (geminiClient) {
    try {
      const completion = await geminiClient.chat.completions.create({
        model: "gemini-2.0-flash",
        messages,
        max_tokens: 500,
        temperature: 0.5,
      });
      const reply = completion.choices[0]?.message?.content;
      if (reply) {
        logger.info("AI response generated via Gemini fallback");
        return reply;
      }
    } catch (err: any) {
      logger.error({ err: err?.message, status: err?.status }, "Gemini call also failed");
      throw categorizeGeminiError(err);
    }
  }

  throw new AiAssistantError(
    "All AI providers failed to generate a response. Please try again later.",
    "ALL_PROVIDERS_FAILED"
  );
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export class AiAssistantError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AiAssistantError";
    this.code = code;
  }
}

function categorizeOpenAIError(err: any): AiAssistantError {
  const status = err?.status ?? err?.statusCode;
  const message = err?.message ?? "";

  if (status === 401 || message.includes("Incorrect API key") || message.includes("invalid_api_key")) {
    return new AiAssistantError("OpenAI API Key is invalid or expired. Please update your OPENAI_API_KEY.", "OPENAI_AUTH_FAILED");
  }
  if (status === 429) {
    return new AiAssistantError("OpenAI rate limit exceeded. Please wait a moment and try again.", "OPENAI_RATE_LIMIT");
  }
  if (status === 404 || message.includes("model_not_found")) {
    return new AiAssistantError("OpenAI model not found. The configured model may not be available on your plan.", "OPENAI_MODEL_NOT_FOUND");
  }
  if (status === 500 || status === 502 || status === 503) {
    return new AiAssistantError("OpenAI service is temporarily unavailable. Please try again later.", "OPENAI_UNAVAILABLE");
  }
  if (message.includes("insufficient_quota") || message.includes("billing")) {
    return new AiAssistantError("OpenAI billing quota exceeded. Please check your OpenAI account billing.", "OPENAI_QUOTA_EXCEEDED");
  }
  return new AiAssistantError(`OpenAI provider error: ${message.slice(0, 150)}`, "OPENAI_ERROR");
}

function categorizeGeminiError(err: any): AiAssistantError {
  const status = err?.status ?? err?.statusCode;
  const message = err?.message ?? "";

  if (status === 401 || status === 403 || message.includes("API_KEY_INVALID")) {
    return new AiAssistantError("Gemini API Key is invalid. Please update your GEMINI_API_KEY.", "GEMINI_AUTH_FAILED");
  }
  if (status === 429) {
    return new AiAssistantError("Gemini rate limit exceeded. Please wait a moment and try again.", "GEMINI_RATE_LIMIT");
  }
  if (status === 500 || status === 502 || status === 503) {
    return new AiAssistantError("Gemini service is temporarily unavailable. Please try again later.", "GEMINI_UNAVAILABLE");
  }
  return new AiAssistantError(`Gemini provider error: ${message.slice(0, 150)}`, "GEMINI_ERROR");
}
