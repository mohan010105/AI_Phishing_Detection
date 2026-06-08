import {
  SUSPICIOUS_URL_KEYWORDS,
  HIGH_RISK_TLDS,
  URL_SHORTENERS,
  BLACKLISTED_DOMAINS,
  BRAND_DOMAINS,
  PHISHING_EMAIL_KEYWORDS,
  PHISHING_EMAIL_PATTERNS,
  SENSITIVE_DATA_PATTERNS,
} from "../constants/threatIntel.js";
import { clampScore, scoreToRiskLevel } from "../utils/riskCalculator.js";

export interface RiskResult {
  riskScore: number;
  riskLevel: "safe" | "suspicious" | "high_risk";
  findings: string[];
}

interface UrlCheckResult {
  score: number;
  finding: string | null;
}

function checkHttps(protocol: string): UrlCheckResult {
  if (protocol !== "https:") {
    return { score: 25, finding: "URL uses HTTP instead of HTTPS — connection is unencrypted" };
  }
  return { score: 0, finding: null };
}

function checkIpAddress(hostname: string): UrlCheckResult {
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    return { score: 30, finding: "URL targets a raw IP address instead of a domain name — common malware delivery technique" };
  }
  return { score: 0, finding: null };
}

function checkUrlLength(url: string): UrlCheckResult {
  if (url.length > 200) {
    return { score: 15, finding: `Unusually long URL (${url.length} characters) — often used to hide malicious paths` };
  }
  if (url.length > 100) {
    return { score: 8, finding: `Long URL detected (${url.length} characters) — may be obscuring destination` };
  }
  return { score: 0, finding: null };
}

function checkUrlShortener(hostname: string): UrlCheckResult {
  if (URL_SHORTENERS.has(hostname)) {
    return { score: 20, finding: `URL uses a known shortening service (${hostname}) — actual destination is hidden` };
  }
  return { score: 0, finding: null };
}

function checkBlacklist(hostname: string): UrlCheckResult {
  if (BLACKLISTED_DOMAINS.has(hostname)) {
    return { score: 90, finding: `Domain ${hostname} is on the known phishing blacklist` };
  }
  return { score: 0, finding: null };
}

function checkTld(hostname: string): UrlCheckResult {
  const parts = hostname.split(".");
  const tld = "." + parts[parts.length - 1].toLowerCase();
  if (HIGH_RISK_TLDS.has(tld)) {
    return { score: 20, finding: `High-risk top-level domain detected (${tld}) — frequently abused for phishing` };
  }
  return { score: 0, finding: null };
}

function checkSubdomainDepth(hostname: string): UrlCheckResult {
  const parts = hostname.split(".");
  if (parts.length > 4) {
    return { score: 15, finding: `Excessive subdomain depth (${parts.length - 2} subdomains) — common evasion technique` };
  }
  if (parts.length > 3) {
    return { score: 8, finding: "Multiple subdomains detected — may be disguising the actual domain" };
  }
  return { score: 0, finding: null };
}

function checkSuspiciousKeywords(hostname: string, path: string, search: string): UrlCheckResult {
  const combined = (hostname + path + search).toLowerCase();
  const matched = SUSPICIOUS_URL_KEYWORDS.filter(kw => combined.includes(kw));
  if (matched.length === 0) return { score: 0, finding: null };
  const score = Math.min(matched.length * 6, 28);
  return {
    score,
    finding: `Contains ${matched.length} suspicious keyword(s): ${matched.slice(0, 3).join(", ")}`,
  };
}

function checkBrandImpersonation(hostname: string, pathname: string, search: string): UrlCheckResult {
  const combined = (hostname + pathname + search).toLowerCase();
  for (const [brand, officialDomain] of Object.entries(BRAND_DOMAINS)) {
    if (combined.includes(brand) && !hostname.endsWith(officialDomain)) {
      return {
        score: 40,
        finding: `Brand impersonation detected: "${brand}" referenced but domain is not ${officialDomain}`,
      };
    }
  }
  return { score: 0, finding: null };
}

function checkAtSymbol(url: string): UrlCheckResult {
  if (url.includes("@")) {
    return { score: 25, finding: "URL contains '@' symbol — browser ignores everything before it, common in phishing" };
  }
  return { score: 0, finding: null };
}

function checkDoubleSlash(pathname: string): UrlCheckResult {
  if (/\/\//.test(pathname)) {
    return { score: 10, finding: "URL path contains double slashes — possible redirect manipulation" };
  }
  return { score: 0, finding: null };
}

function checkPunycode(hostname: string): UrlCheckResult {
  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    return { score: 30, finding: "Punycode / internationalized domain detected — potential homograph attack" };
  }
  if (/[^\x00-\x7F]/.test(hostname)) {
    return { score: 30, finding: "Non-ASCII characters in domain — potential homograph spoofing attack" };
  }
  return { score: 0, finding: null };
}

function checkExcessiveHyphens(hostname: string): UrlCheckResult {
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 4) {
    return { score: 15, finding: `Domain contains ${hyphenCount} hyphens — common in phishing domains mimicking legitimate sites` };
  }
  if (hyphenCount >= 2) {
    return { score: 7, finding: "Multiple hyphens in domain name — possible typosquatting" };
  }
  return { score: 0, finding: null };
}

function checkLongDomain(hostname: string): UrlCheckResult {
  const base = hostname.split(".").slice(-2)[0];
  if (base.length > 30) {
    return { score: 12, finding: `Unusually long domain name segment (${base.length} characters)` };
  }
  return { score: 0, finding: null };
}

export function analyzeUrl(url: string): RiskResult {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { riskScore: 85, riskLevel: "high_risk", findings: ["Invalid or malformed URL"] };
  }

  const { protocol, hostname, pathname, search } = parsedUrl;
  const checks: UrlCheckResult[] = [
    checkHttps(protocol),
    checkIpAddress(hostname),
    checkUrlLength(url),
    checkUrlShortener(hostname),
    checkBlacklist(hostname),
    checkTld(hostname),
    checkSubdomainDepth(hostname),
    checkSuspiciousKeywords(hostname, pathname, search),
    checkBrandImpersonation(hostname, pathname, search),
    checkAtSymbol(url),
    checkDoubleSlash(pathname),
    checkPunycode(hostname),
    checkExcessiveHyphens(hostname),
    checkLongDomain(hostname),
  ];

  const findings: string[] = [];
  let totalScore = 0;

  for (const check of checks) {
    if (check.score > 0) {
      totalScore += check.score;
      if (check.finding) findings.push(check.finding);
    }
  }

  const riskScore = clampScore(totalScore);
  const riskLevel = scoreToRiskLevel(riskScore);

  if (findings.length === 0) {
    findings.push("No phishing indicators detected — URL appears legitimate");
  }

  return { riskScore, riskLevel, findings };
}

export function analyzeEmail(content: string, subject?: string, sender?: string): RiskResult {
  const findings: string[] = [];
  let totalScore = 0;

  const combined = [content, subject ?? "", sender ?? ""].join(" ").toLowerCase();

  const matchedKeywords = PHISHING_EMAIL_KEYWORDS.filter(kw => combined.includes(kw.toLowerCase()));
  if (matchedKeywords.length > 0) {
    const score = Math.min(matchedKeywords.length * 5, 35);
    totalScore += score;
    findings.push(`Contains ${matchedKeywords.length} phishing trigger phrase(s): "${matchedKeywords.slice(0, 3).join('", "')}"`);
  }

  for (const pattern of PHISHING_EMAIL_PATTERNS) {
    if (pattern.test(combined)) {
      totalScore += 20;
      findings.push("Email body matches a known phishing script pattern");
      break;
    }
  }

  const urlMatches = combined.match(/https?:\/\/[^\s]+/gi) ?? [];
  const httpUrls = urlMatches.filter(u => u.startsWith("http://"));
  if (httpUrls.length > 0) {
    totalScore += 15;
    findings.push(`Contains ${httpUrls.length} unencrypted HTTP link(s) — data may be intercepted`);
  }

  const ipUrlMatches = urlMatches.filter(u => /https?:\/\/\d{1,3}\.\d{1,3}/.test(u));
  if (ipUrlMatches.length > 0) {
    totalScore += 25;
    findings.push("Email contains link(s) to raw IP addresses — strong phishing indicator");
  }

  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    if (pattern.test(combined)) {
      totalScore += 40;
      findings.push("Email requests highly sensitive personal or financial information");
      break;
    }
  }

  if (sender) {
    const senderLower = sender.toLowerCase();
    if (senderLower.includes("noreply") || senderLower.includes("no-reply")) {
      totalScore += 5;
      findings.push("Sent from a no-reply address — cannot be contacted to report phishing");
    }
    const hasMismatch = Object.entries(BRAND_DOMAINS).some(([brand, domain]) =>
      senderLower.includes(brand) && !senderLower.includes(domain)
    );
    if (hasMismatch) {
      totalScore += 30;
      findings.push("Sender address references a brand but does not match its official domain");
    }
  }

  const hasAttachmentMention = /(?:open the (?:file|attachment)|download (?:the )?(?:file|document)|see (?:attached|attachment))/i.test(combined);
  if (hasAttachmentMention) {
    totalScore += 10;
    findings.push("References an attachment — potential malware delivery vector");
  }

  const hasUrgencyPattern = /(?:within \d+ hours?|respond immediately|account (?:closes?|terminate|suspend)|last chance|expires? (?:today|tonight|soon))/i.test(combined);
  if (hasUrgencyPattern) {
    totalScore += 15;
    findings.push("Creates false urgency — common psychological manipulation tactic in phishing");
  }

  const riskScore = clampScore(totalScore);
  const riskLevel = scoreToRiskLevel(riskScore);

  if (findings.length === 0) {
    findings.push("No phishing indicators detected in this email");
  }

  return { riskScore, riskLevel, findings };
}
