export const SUSPICIOUS_URL_KEYWORDS = [
  "login", "signin", "sign-in", "account", "secure", "verify", "update", "confirm",
  "banking", "paypal", "amazon", "apple", "microsoft", "google", "facebook", "instagram",
  "credential", "password", "wallet", "crypto", "urgent", "suspended", "validate",
  "authenticate", "reactivate", "restore", "unlock", "billing", "invoice", "payment",
  "alerting", "notification", "ebay", "netflix", "dropbox", "chase", "wellsfargo",
  "citibank", "usbank", "bankofamerica", "venmo", "zelle", "cashapp", "coinbase",
];

export const HIGH_RISK_TLDS = new Set([
  ".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".pw", ".top", ".click",
  ".download", ".zip", ".review", ".country", ".kim", ".science",
  ".work", ".party", ".gdn", ".stream", ".bid", ".loan", ".racing",
  ".date", ".win", ".faith", ".men", ".mom",
]);

export const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "adf.ly", "j.mp", "lnkd.in", "dlvr.it", "soo.gd",
  "cutt.ly", "rb.gy", "shorten.com", "shorte.st", "tiny.cc",
  "tr.im", "mcaf.ee", "su.pr", "ift.tt", "fb.me", "snip.ly",
]);

export const BLACKLISTED_DOMAINS = new Set([
  "secure-paypal-login.com", "paypal-secure-update.com",
  "apple-id-locked.net", "icloud-unlock.info",
  "amazon-order-confirm.com", "amazon-security-alert.net",
  "microsoft-account-verify.com", "microsoft-security-alert.net",
  "chase-bank-verify.com", "wellsfargo-secure.net",
  "bankofamerica-login.info", "netflix-payment-update.com",
  "facebook-security-check.com", "instagram-verify-account.net",
  "google-account-suspended.com", "gmail-verify-account.net",
  "irs-tax-refund.com", "irs-gov-refund.net",
  "fedex-delivery-failed.com", "ups-delivery-notification.net",
  "dhl-parcel-update.com", "usps-tracking-alert.com",
]);

export const BRAND_DOMAINS: Record<string, string> = {
  paypal: "paypal.com",
  apple: "apple.com",
  amazon: "amazon.com",
  microsoft: "microsoft.com",
  google: "google.com",
  facebook: "facebook.com",
  instagram: "instagram.com",
  netflix: "netflix.com",
  dropbox: "dropbox.com",
  twitter: "twitter.com",
  linkedin: "linkedin.com",
  chase: "chase.com",
  wellsfargo: "wellsfargo.com",
  citibank: "citi.com",
  bankofamerica: "bankofamerica.com",
  irs: "irs.gov",
  fedex: "fedex.com",
  ups: "ups.com",
  dhl: "dhl.com",
  usps: "usps.com",
};

export const PHISHING_EMAIL_KEYWORDS = [
  "urgent", "immediately", "suspended", "verify your account", "click here",
  "confirm your", "update your", "unusual activity", "security alert",
  "limited time", "act now", "your account has been", "we have detected",
  "congratulations you have won", "password expired", "verify now",
  "dear customer", "dear user", "unauthorized access", "your account will be",
  "important notification", "action required", "account locked",
  "unusual sign-in", "suspicious login", "confirm identity",
  "we noticed a login", "free gift", "you have been selected",
  "your subscription", "payment failed", "update your billing",
  "reset your password", "24 hours", "48 hours", "final warning",
  "account termination", "legal action", "law enforcement",
];

export const PHISHING_EMAIL_PATTERNS = [
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  /click here to (?:verify|confirm|update)/i,
  /your (?:account|password) (?:has been|will be) (?:suspended|disabled|deleted|locked)/i,
  /(?:enter|provide|submit) your (?:password|credentials|banking details|ssn|pin)/i,
  /(?:dear|hello) (?:customer|user|client|valued member)/i,
  /(?:win|won|winner|selected|chosen|award|prize|reward)/i,
  /(?:tax refund|irs|internal revenue)/i,
  /(?:pay now|avoid penalty|final notice)/i,
];

export const SENSITIVE_DATA_PATTERNS = [
  /\bssn\b|\bsocial security\b/i,
  /\bcredit card\b|\bcard number\b/i,
  /\bbank account\b|\brouting number\b/i,
  /\bcvv\b|\bcvc\b/i,
  /\bpin\b|\bpasscode\b/i,
  /\bdate of birth\b|\bdob\b/i,
  /\bmother.?s maiden\b/i,
  /\bpassport\b|\bdriver.?s license\b/i,
];
