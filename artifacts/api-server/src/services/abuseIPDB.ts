import { env } from "../config/env.js";

const ABUSEIPDB_API_KEY = env.ABUSEIPDB_API_KEY;
const ABUSEIPDB_BASE = "https://api.abuseipdb.com/api/v2";
const TIMEOUT_MS = 8000;

export interface AbuseIPDBResult {
  available: boolean;
  checked: boolean;
  ipAddress?: string;
  isAbusive: boolean;
  abuseConfidenceScore: number;
  countryCode?: string;
  isp?: string;
  domain?: string;
  totalReports: number;
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

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isIpAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

async function resolveHostToIp(hostname: string): Promise<string | null> {
  try {
    const { Resolver } = await import("node:dns/promises");
    const resolver = new Resolver();
    const addresses = await resolver.resolve4(hostname);
    return addresses[0] ?? null;
  } catch {
    return null;
  }
}

export async function checkUrlAbuseIPDB(url: string): Promise<AbuseIPDBResult> {
  if (!ABUSEIPDB_API_KEY) {
    return { available: false, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
  }

  const hostname = extractHostname(url);
  if (!hostname) {
    return { available: false, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
  }

  let ipAddress: string | null = isIpAddress(hostname) ? hostname : await resolveHostToIp(hostname);

  if (!ipAddress) {
    return { available: true, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
  }

  try {
    const res = await fetchWithTimeout(
      `${ABUSEIPDB_BASE}/check?ipAddress=${encodeURIComponent(ipAddress)}&maxAgeInDays=90&verbose`,
      {
        headers: {
          Key: ABUSEIPDB_API_KEY,
          Accept: "application/json",
        },
      },
      TIMEOUT_MS
    );

    if (!res.ok) {
      return { available: false, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
    }

    interface AbuseData {
      data?: {
        ipAddress?: string;
        abuseConfidenceScore?: number;
        countryCode?: string;
        isp?: string;
        domain?: string;
        totalReports?: number;
      };
    }

    const json = (await res.json()) as AbuseData;
    const data = json?.data;
    if (!data) {
      return { available: false, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
    }

    const score = data.abuseConfidenceScore ?? 0;
    const totalReports = data.totalReports ?? 0;
    const isAbusive = score >= 25;

    let finding: string | undefined;
    if (score >= 75) {
      finding = `AbuseIPDB: IP ${ipAddress} has a ${score}% abuse confidence score — highly malicious host`;
    } else if (score >= 25) {
      finding = `AbuseIPDB: IP ${ipAddress} has a ${score}% abuse confidence score — suspicious hosting`;
    } else if (totalReports > 0) {
      finding = `AbuseIPDB: IP ${ipAddress} has ${totalReports} abuse report(s) but low confidence score`;
    }

    return {
      available: true,
      checked: true,
      ipAddress: data.ipAddress ?? ipAddress,
      isAbusive,
      abuseConfidenceScore: score,
      countryCode: data.countryCode,
      isp: data.isp,
      domain: data.domain,
      totalReports,
      finding,
    };
  } catch {
    return { available: false, checked: false, isAbusive: false, abuseConfidenceScore: 0, totalReports: 0 };
  }
}

export function scoreFromAbuseIPDB(result: AbuseIPDBResult): { score: number; findings: string[] } {
  if (!result.available || !result.checked) return { score: 0, findings: [] };
  const findings: string[] = [];
  let score = 0;

  if (result.abuseConfidenceScore >= 75) {
    score += 35;
    if (result.finding) findings.push(result.finding);
  } else if (result.abuseConfidenceScore >= 25) {
    score += 20;
    if (result.finding) findings.push(result.finding);
  } else if (result.totalReports > 0 && result.finding) {
    findings.push(result.finding);
  }

  return { score, findings };
}
