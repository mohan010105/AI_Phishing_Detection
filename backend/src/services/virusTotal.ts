import { env } from "../config/env.js";

const VT_API_KEY = env.VIRUSTOTAL_API_KEY;
const VT_BASE = "https://www.virustotal.com/api/v3";
const TIMEOUT_MS = 8000;

export interface VirusTotalResult {
  available: boolean;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  permalink?: string;
  finding?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function lookupCachedUrl(encoded: string): Promise<VirusTotalResult | null> {
  const res = await fetchWithTimeout(
    `${VT_BASE}/urls/${encoded}`,
    { headers: { "x-apikey": VT_API_KEY! } },
    TIMEOUT_MS
  );
  if (!res.ok) return null;

  const data = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: Record<string, number> } } };
  const stats = data?.data?.attributes?.last_analysis_stats;
  if (!stats) return null;

  return {
    available: true,
    malicious: stats.malicious ?? 0,
    suspicious: stats.suspicious ?? 0,
    harmless: stats.harmless ?? 0,
    undetected: stats.undetected ?? 0,
    permalink: `https://www.virustotal.com/gui/url/${encoded}`,
    finding: buildFinding(stats),
  };
}

async function submitUrl(url: string, encoded: string): Promise<VirusTotalResult> {
  const submit = await fetchWithTimeout(
    `${VT_BASE}/urls`,
    {
      method: "POST",
      headers: {
        "x-apikey": VT_API_KEY!,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `url=${encodeURIComponent(url)}`,
    },
    TIMEOUT_MS
  );

  if (!submit.ok) {
    return { available: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  }

  await new Promise(r => setTimeout(r, 3000));

  const poll = await fetchWithTimeout(
    `${VT_BASE}/urls/${encoded}`,
    { headers: { "x-apikey": VT_API_KEY! } },
    TIMEOUT_MS
  );

  if (!poll.ok) {
    return { available: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  }

  const data = (await poll.json()) as { data?: { attributes?: { last_analysis_stats?: Record<string, number> } } };
  const stats = data?.data?.attributes?.last_analysis_stats ?? {};

  return {
    available: true,
    malicious: stats.malicious ?? 0,
    suspicious: stats.suspicious ?? 0,
    harmless: stats.harmless ?? 0,
    undetected: stats.undetected ?? 0,
    permalink: `https://www.virustotal.com/gui/url/${encoded}`,
    finding: buildFinding(stats),
  };
}

function buildFinding(stats: Record<string, number>): string | undefined {
  const mal = stats.malicious ?? 0;
  const sus = stats.suspicious ?? 0;
  if (mal > 0) return `VirusTotal: ${mal} security engine(s) flagged this URL as malicious`;
  if (sus > 0) return `VirusTotal: ${sus} security engine(s) flagged this URL as suspicious`;
  const harmless = stats.harmless ?? 0;
  if (harmless > 0) return `VirusTotal: ${harmless} engine(s) confirmed clean`;
  return undefined;
}

export async function checkUrlVirusTotal(url: string): Promise<VirusTotalResult> {
  if (!VT_API_KEY) {
    return { available: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  }
  try {
    const encoded = Buffer.from(url).toString("base64url");
    const cached = await lookupCachedUrl(encoded);
    if (cached) return cached;
    return await submitUrl(url, encoded);
  } catch {
    return { available: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  }
}

export function scoreFromVT(result: VirusTotalResult): { score: number; findings: string[] } {
  if (!result.available) return { score: 0, findings: [] };
  const findings: string[] = [];
  let score = 0;

  if (result.malicious > 0) {
    score += Math.min(result.malicious * 5, 50);
    if (result.finding) findings.push(result.finding);
  } else if (result.suspicious > 0) {
    score += Math.min(result.suspicious * 3, 20);
    if (result.finding) findings.push(result.finding);
  } else if (result.harmless > 0) {
    score = Math.max(score - 10, 0);
    if (result.finding) findings.push(result.finding);
  }

  return { score, findings };
}
