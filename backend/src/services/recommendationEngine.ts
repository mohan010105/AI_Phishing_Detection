/**
 * AI Incident Response Recommendation Engine (Feature 2)
 * Generates tailored, actionable steps based on threat vectors, findings, and risk levels.
 */

export interface Recommendation {
  category: "credential_theft" | "banking_scam" | "malware" | "generic_phishing" | "safe";
  title: string;
  steps: string[];
}

/**
 * Returns specific incident response recommendations based on scan results and findings.
 */
export function getRecommendations(
  riskScore: number,
  riskLevel: "safe" | "suspicious" | "high_risk",
  findings: string[],
  type: "url" | "email" | "qr" | "screenshot"
): Recommendation {
  const combinedFindings = findings.join(" ").toLowerCase();

  // 1. Safe Verdict
  if (riskLevel === "safe" || riskScore <= 30) {
    return {
      category: "safe",
      title: "Legitimate Asset Verified",
      steps: [
        "No immediate security actions required.",
        "Bookmark this page or verify sender address for future interactions.",
        "Keep your browser and operating system updated to the latest security patch level.",
        "Always practice caution when clicking links from unsolicited communication."
      ]
    };
  }

  // 2. Malware & Malware Delivery Vectors
  if (
    combinedFindings.includes("malware") ||
    combinedFindings.includes("ip address") ||
    combinedFindings.includes("attachment") ||
    type === "screenshot" && riskScore >= 75
  ) {
    return {
      category: "malware",
      title: "Malware & Device Intrusion Alert",
      steps: [
        "DO NOT download any files, click links, or open attachments from this source.",
        "Disconnect your device from local networks (Wi-Fi or Ethernet) to isolate any potential threat.",
        "Run a comprehensive anti-virus and anti-malware system scan immediately.",
        "If files were executed, contact your organization's IT Security Operations Center (SOC)."
      ]
    };
  }

  // 3. Banking & Financial Impersonation Scams
  if (
    combinedFindings.includes("bank") ||
    combinedFindings.includes("paypal") ||
    combinedFindings.includes("invoice") ||
    combinedFindings.includes("payment") ||
    combinedFindings.includes("financial")
  ) {
    return {
      category: "banking_scam",
      title: "Financial Spoofing & Banking Scam Warning",
      steps: [
        "IMMEDIATELY contact your bank or financial institution using official contact numbers.",
        "Request a temporary freeze on your credit/debit card transactions and check for unauthorized charges.",
        "Monitor your account statements closely for any unrecognized electronic fund transfers.",
        "Report the communication officially to the respective bank's phishing department (e.g., spoof@bank.com)."
      ]
    };
  }

  // 4. Credential Theft (Brands, Login Keywords)
  if (
    combinedFindings.includes("impersonation") ||
    combinedFindings.includes("login") ||
    combinedFindings.includes("password") ||
    combinedFindings.includes("sensitive data") ||
    combinedFindings.includes("credential")
  ) {
    return {
      category: "credential_theft",
      title: "Credential Harvesting / Account Phishing Alert",
      steps: [
        "DO NOT type your username, password, or verification code on this page.",
        "If you already entered credentials, immediately change your password on the official platform.",
        "Enable Multi-Factor Authentication (MFA) across all email and professional accounts.",
        "Revoke active device sessions or authorized API tokens for the affected account immediately."
      ]
    };
  }

  // 5. Generic Phishing / Typosquatting
  return {
    category: "generic_phishing",
    title: "Suspicious Phishing Communication Detected",
    steps: [
      "Avoid providing any personal information, full name, phone number, or address.",
      "Check the sender's actual email header and verify domain spelling (look for typosquatting).",
      "Do not trust urgency timers, warning screens, or threat claims designed to induce panic.",
      "Report the suspicious URL/email using your company's 'Report Phishing' tool or dashboard."
    ]
  };
}
