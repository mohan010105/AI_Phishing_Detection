import { env } from "../config/env.js";

const GSB_API_KEY = env.GOOGLE_SAFE_BROWSING_API_KEY;
const GSB_BASE = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

export interface SafeBrowsingResult {
  available: boolean;
  isMalicious: boolean;
  threatTypes: string[];
  finding?: string;
}

const THREAT_TYPE_LABELS: Record<string, string> = {
  MALWARE: "malware distribution",
  SOCIAL_ENGINEERING: "social engineering / phishing",
  UNWANTED_SOFTWARE: "unwanted software distribution",
  POTENTIALLY_HARMFUL_APPLICATION: "potentially harmful application",
};

export async function checkUrlSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  if (!GSB_API_KEY) {
    return { available: false, isMalicious: false, threatTypes: [] };
  }

  try {
    const response = await fetch(`${GSB_BASE}?key=${GSB_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "phishguard", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    });

    if (!response.ok) {
      return { available: false, isMalicious: false, threatTypes: [] };
    }

    interface GsbMatch { threatType: string }
    interface GsbResponse { matches?: GsbMatch[] }
    const data = (await response.json()) as GsbResponse;
    const matches: GsbMatch[] = data?.matches ?? [];

    if (matches.length === 0) {
      return { available: true, isMalicious: false, threatTypes: [] };
    }

    const threatTypes = [...new Set(matches.map((m) => m.threatType))];
    const labels = threatTypes.map(t => THREAT_TYPE_LABELS[t] ?? t.toLowerCase());
    const finding = `Google Safe Browsing: URL flagged for ${labels.join(", ")}`;

    return { available: true, isMalicious: true, threatTypes, finding };
  } catch {
    return { available: false, isMalicious: false, threatTypes: [] };
  }
}

export function scoreFromGSB(result: SafeBrowsingResult): { score: number; findings: string[] } {
  if (!result.available || !result.isMalicious) return { score: 0, findings: [] };

  const findings: string[] = [];
  let score = 0;

  if (result.threatTypes.includes("SOCIAL_ENGINEERING")) {
    score += 45;
  } else if (result.threatTypes.includes("MALWARE")) {
    score += 50;
  } else {
    score += 35;
  }

  if (result.finding) findings.push(result.finding);

  return { score, findings };
}
