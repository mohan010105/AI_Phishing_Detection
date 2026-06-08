import OpenAI from "openai";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

let client: OpenAI | null = null;
if (env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export interface ScreenshotAnalysis {
  riskScore: number;
  riskLevel: "safe" | "suspicious" | "high_risk";
  findings: string[];
  explanation: string;
  aiSummary: {
    technical: string;
    executive: string;
    beginner: string;
  };
  detectedText: string;
}

const ANALYSIS_PROMPT = `You are a cybersecurity expert analyzing a website screenshot for phishing and fraud indicators.

Examine the screenshot carefully and identify:
- Fake login forms or credential harvesting pages
- Brand impersonation (fake banks, PayPal, Google, Microsoft, etc.)
- Urgency or fear-inducing language
- Suspicious URLs or domain patterns visible in the page
- Trust indicators (padlock icons, security badges) that may be faked
- Grammar/spelling errors typical of phishing pages
- Mismatched branding or logos

Respond with ONLY valid JSON in exactly this shape:
{
  "riskScore": <integer 0-100>,
  "riskLevel": <"safe"|"suspicious"|"high_risk">,
  "findings": [<array of specific detection strings, max 8>],
  "explanation": "<one clear sentence explaining the verdict, max 40 words>",
  "technical": "<2-3 sentences for a security engineer>",
  "executive": "<1-2 sentences for a manager>",
  "beginner": "<1 plain-English sentence for a normal user>",
  "detectedText": "<key visible text extracted from the page, max 100 chars>"
}

Risk score guide: 0-30 = safe, 31-60 = suspicious, 61-100 = high_risk.`;

export async function analyzeScreenshot(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ScreenshotAnalysis> {
  const fallback: ScreenshotAnalysis = {
    riskScore: 0,
    riskLevel: "safe",
    findings: ["Screenshot analysis unavailable — OpenAI API key not configured"],
    explanation: "Unable to analyze screenshot without AI integration.",
    aiSummary: { technical: "", executive: "", beginner: "" },
    detectedText: "",
  };

  if (!client) {
    fallback.findings = ["Screenshot analysis unavailable — no AI provider configured with vision support"];
    return fallback;
  }

  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as {
      riskScore?: number;
      riskLevel?: string;
      findings?: string[];
      explanation?: string;
      technical?: string;
      executive?: string;
      beginner?: string;
      detectedText?: string;
    };

    const score = Math.min(Math.max(Number(parsed.riskScore ?? 0), 0), 100);
    const level: "safe" | "suspicious" | "high_risk" =
      parsed.riskLevel === "high_risk" ? "high_risk"
      : parsed.riskLevel === "suspicious" ? "suspicious"
      : "safe";

    return {
      riskScore: score,
      riskLevel: level,
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 8) : [],
      explanation: parsed.explanation ?? "",
      aiSummary: {
        technical: parsed.technical ?? "",
        executive: parsed.executive ?? "",
        beginner: parsed.beginner ?? "",
      },
      detectedText: parsed.detectedText ?? "",
    };
  } catch (err) {
    logger.warn({ err }, "Screenshot analysis failed");
    return fallback;
  }
}
