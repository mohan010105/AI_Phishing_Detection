# PhishGuard — Major Project Report

---

## 1. Title Page

**PROJECT TITLE**:  
### PHISHGUARD: A DUAL-PROVIDER COGNITIVE THREAT INTELLIGENCE AND MULTI-ENGINE PHISHING DETECTION SYSTEM

**A Major Project Report submitted in partial fulfillment of the requirements for the award of the degree of**  
#### Bachelor of Technology in Computer Science & Engineering

**Submitted By**:  
- [Candidate Name] (Roll No: [XXXXXX])  

**Under the Guidance of**:  
- [Advisor/Professor Name]  
- Department of Computer Science & Engineering  
- [University/Institution Name]  

**Academic Session**: 2025 – 2026  

---

## 2. Certificate

### DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
#### [UNIVERSITY/INSTITUTION NAME]

This is to certify that the project report entitled **"PHISHGUARD: A DUAL-PROVIDER COGNITIVE THREAT INTELLIGENCE AND MULTI-ENGINE PHISHING DETECTION SYSTEM"** is a bonafide work carried out by **[Candidate Name]** under my supervision and guidance. 

To the best of my knowledge, the matter embodied in this project report has not been submitted to any other University or Institution for the award of any degree or diploma.

\
\
__________________________  
**[Advisor/Professor Name]**  
Project Guide / Head of Department  
Department of Computer Science & Engineering  
[University/Institution Name]  

---

## 3. Acknowledgement

I express my deepest gratitude to our project guide, **[Advisor/Professor Name]**, for their invaluable guidance, encouragement, and feedback throughout this project.

I am also thankful to the Department of Computer Science & Engineering for providing the necessary facilities and resources to complete this work.

Finally, I would like to thank my family and friends for their constant support and encouragement.

**[Candidate Name]**  
B.Tech CSE, Roll No: [XXXXXX]  

---

## 4. Abstract

The rise of digital communications has led to a significant increase in social engineering attacks, particularly phishing, which exploits human behavior to steal sensitive credentials. Traditional security filters struggle to counter sophisticated techniques like "Quishing" (QR code redirection) and visual brand impersonation, and often return technical threat reports that confuse everyday users.

To address these challenges, we developed **PhishGuard**: a multi-vector phishing detection platform that combines local lexical heuristic rules with external threat intelligence APIs (VirusTotal, Google Safe Browsing, AbuseIPDB). Using large language models (LLMs) with a robust dual-provider fallback architecture (OpenAI first, Gemini fallback), PhishGuard translates complex threat data into clear, natural language explanations and actionable security recommendations. 

The platform also includes a screenshot analyzer powered by vision LLMs to detect visual brand impersonation and a QR code scanner optimized with image thresholding. To guarantee high availability, PhishGuard features database resiliency wrappers that automatically fall back to an in-memory SQL database if the primary cloud database goes offline. The final system is packaged as a high-performance monorepo utilizing React 19, TypeScript, Node.js, Express, Drizzle ORM, and Supabase.

---

## 5. Table of Contents

1. **Title Page**
2. **Certificate**
3. **Acknowledgement**
4. **Abstract**
5. **Table of Contents**
6. **Introduction**
7. **Problem Statement**
8. **Existing System**
9. **Proposed System**
10. **Objectives**
11. **Literature Survey**
12. **System Architecture**
13. **Technology Stack**
14. **Database Design**
15. **Module Description**
16. **Implementation**
17. **Security Features**
18. **Testing**
19. **Results**
20. **Advantages**
21. **Future Enhancements**
22. **Conclusion**
23. **References**

---

## 6. Introduction

Phishing remains one of the most common and effective cyberattack vectors globally. Traditional email filters and firewalls struggle to detect newly registered domains, obfuscated redirect links, and QR-code-based attacks (Quishing).

PhishGuard was designed to address these limitations by providing a unified multi-engine security evaluation platform. By combining lexical heuristics, threat feeds, and machine vision analysis, PhishGuard creates a comprehensive assessment of digital threats. It then uses generative AI to explain these risks in clear, natural language, helping users make informed safety decisions.

---

## 7. Problem Statement

Modern phishing attacks exploit human behavior through urgency, fear, or curiosity, using advanced techniques to bypass traditional security measures:
1. **Quishing**: Hidden link redirections in QR codes.
2. **Impersonation**: Spoofed login pages that match reputable portals.
3. **Complex Reports**: Traditional security tools output raw technical data that confuses everyday users.
4. **Single-feed Bias**: Relying on a single security database leaves systems vulnerable to blind spots.

---

## 8. Existing System

Existing systems rely primarily on signature-based blacklists or static keyword heuristics, which suffer from major limitations:
- **High Latency**: Blacklists are reactive, failing to catch zero-day phishing sites.
- **Single-Feed Biases**: A target flagged in one database might go undetected in others.
- **Complex Outputs**: Technical summaries like `Google Safe Browsing: Flagged as SOCIAL_ENGINEERING` lack clear explanations and actionable guidance for non-technical users.

---

## 9. Proposed System

PhishGuard addresses these limitations through an aggregated, multi-engine detection model:
- **Heuristic Engine**: Lexical checks identify common phishing indicators in URLs and emails.
- **External Feeds**: Queries VirusTotal, Google Safe Browsing, and AbuseIPDB simultaneously to build a comprehensive security assessment.
- **Cognitive AI Explainers**: Translates binary threat data into clear, natural language summaries and actionable next steps.
- **High Availability**: Features a resilient fallback design that automatically shifts database operations to an in-memory SQL mock during cloud outages, and switches AI queries to a fallback provider if rate limits are hit.

---

## 10. Objectives

The primary objectives of PhishGuard are to:
1. Combine local lexical rules with global intelligence databases to build a robust security evaluation model.
2. Implement computer vision tools to detect brand spoofing on suspect login screens.
3. Use generative AI to explain threat signatures to users in natural language.
4. Build a secure, high-performance monorepo featuring JWT authentication, role-based access control, and dynamic dashboards.
5. Guarantee high availability through robust database and API fallback pipelines.

---

## 11. Literature Survey

The development of PhishGuard was guided by research in threat intelligence aggregation, lexical heuristic modeling, and natural language explanation systems:
- **Lexical Analysis**: Standard research shows that checking URL structures (e.g., subdomain depth and security keywords) is highly effective for identifying suspicious links.
- **Multi-Engine Consensus**: Studies demonstrate that combining security feeds significantly reduces false negatives compared to single-database checks.
- **Natural Language Explanations**: Educational research indicates that translating technical threat data into clear, natural language explanations significantly improves user adherence to security guidelines.

---

## 12. System Architecture

The PhishGuard architecture features a robust three-tier system:

```
  ┌────────────────────────────────────────────────────────┐
  │                      Web Client                        │
  │                   (Hosted on Vercel)                   │
  └──────────────────────────┬─────────────────────────────┘
                             │ HTTPS API Requests
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   API Node.js Server                   │
  │            (Hosted on Render / AWS EC2)                │
  └──────────────┬───────────────────────────┬─────────────┘
                 │ PostgreSQL Dialect        │ AI & Threat APIs
                 ▼                           ▼
  ┌──────────────────────────┐   ┌─────────────────────────┐
  │   Supabase Postgres DB   │   │ VirusTotal, Google SB,   │
  │     (Cloud Database)     │   │ OpenAI, Gemini APIs     │
  └──────────────────────────┘   └─────────────────────────┘
```

1. **Client Tier**: A modern Single Page Application (SPA) built using React 19, TailwindCSS, and Radix UI.
2. **Application Tier**: An Express.js backend managing API routing, input validation via Zod, and multi-thread threat scans.
3. **Data Tier**: PostgreSQL persistence hosted on Supabase, with automatic failover to an in-memory SQL database mock.

---

## 13. Technology Stack

- **Frontend Core**: React 19, TypeScript, TailwindCSS, Radix UI, Lucide Icons, Recharts.
- **Backend Core**: Node.js, Express, Multer, Zod Schema Validation, Drizzle ORM.
- **Cloud Infrastructure**: PostgreSQL database hosted on Supabase, server deployments on Vercel/Render.
- **Cognitive Integrations**: OpenAI API (GPT-4o-mini), Google Gemini API (Gemini 2.0 Flash), jsQR, Jimp OCR processing.

---

## 14. Database Design

PhishGuard manages structured relational schemas using **Drizzle ORM** with a **PostgreSQL** dialect:
- **`users`**: Manages user profiles, role-based access controls, and authentication credentials.
- **`scan_history`**: Logs scan types, targets, risk levels, and findings to populate historical charts and dashboard reports.
- **`assistant_chats`**: Reconstructs session histories for the companion chat assistant.

*For complete schema structures, refer to [Database Documentation](file:///d:/Projects/Phishing-Defender/docs/database_documentation.md).*

---

## 15. Module Description

1. **URL Scanner**: Integrates lexical heuristic rules with VirusTotal, Google Safe Browsing, and AbuseIPDB feeds, returning normalized risk scores.
2. **Email Analyzer**: Parses headers and body content for linguistic urgency indicators, extracting and checking embedded links.
3. **QR Scanner**: Adjusts contrast levels and pre-processes images using Jimp before decoding and scanning embedded URLs using jsQR.
4. **Screenshot AI**: Extracts layout text using image text recognition and checks for brand impersonation spoofing using vision assistants.
5. **AI Assistant**: A conversational security guide built with dual-provider API fallbacks (OpenAI first, Gemini fallback).
6. **Admin Panel**: Displays system analytics, including 30-day telemetry trends and security score tiers.

---

## 16. Implementation

PhishGuard was developed and built as a unified monorepo workspace:
- **Libraries**: Schema definitions are compiled into a standalone `@workspace/db` package, and API queries are handled using `@workspace/api-client-react`.
- **API Server**: Runs as an Express app on Node.js, using Zod to parse and validate all incoming request bodies.
- **Resilient Fallback**: Uses `RobustPool` to handle database operations, shifting to an in-memory SQL mock during cloud outages, and routes AI chat queries to a fallback provider if rate limits are hit.

---

## 17. Security Features

- **Stateless JWT**: Sessions are verified via secure, signed JWT tokens.
- **Password Protection**: Credentials are encrypted using bcrypt before database storage.
- **Input Sanitization**: React's auto-escaping safeguards block potential XSS injection attacks.
- **Endpoint Protection**: Middleware routes verify permissions, blocking standard accounts from admin interfaces.

---

## 18. Testing

We verified the stability of the entire platform by running a complete typecheck and production build:
- **Type Checking**: Runs `tsc --build` across all projects to verify type safety.
- **Resilience Testing**: Simulated failures verified that the Gemini fallback and db fallback switches activate gracefully.
- **Coverage**: Includes lexical heurism, VirusTotal APIs, Google Safe Browsing, vision OCR spoof checks, and fallback mechanisms.

*For complete test tables, refer to [Testing Documentation](file:///d:/Projects/Phishing-Defender/docs/testing_documentation.md).*

---

## 19. Results

The system builds successfully without warnings. API routes return structured, Zod-validated JSON responses, and the frontend dynamically renders threat metrics, telemetry trends, and chat interactions. All fallback systems activate correctly, keeping the application online during simulated outages.

---

## 20. Advantages

- **Aggregated Scoring**: Replaces single-feed engines with consolidated multi-database scans.
- **Plain-Text Explainers**: Explains threat patterns in clear, simple language instead of raw technical codes.
- **Resilient Architecture**: Uses multiple fallback systems to guarantee the application stays online.
- **Dynamic CSS Design**: A premium dark-mode interface with polished, responsive styling.

---

## 21. Future Enhancements

- **Real-Time Extension**: Browser add-ons that check links and traffic automatically.
- **Offline OCR**: Visual screen analysis processed entirely on the user's local machine.
- **Active Monitoring**: Automated checks for newly registered domains mimicking key company sites.

---

## 22. Conclusion

PhishGuard provides a comprehensive and resilient multi-engine phishing defense platform. By combining lexical rules with threat feeds and applying machine vision and LLM-driven explainers, the system offers robust protection and translates complex data into simple, actionable steps. The final system is fully built, securely tested, and ready for deployment.

---

## 23. References

1. Aleroud, A., & Zhou, L. (2017). Phishing detection: A literature survey. *Computers & Security*, 70, 44-74.
2. Basnet, R., Mukkamala, S., & Sung, A. H. (2008). Detection of phishing attacks: A machine learning approach. *Soft Computing Applications in Industry*, 373-383.
3. Drizzle ORM Documentation: https://orm.drizzle.team
4. React 19 Reference Guide: https://react.dev
5. Express.js Security Best Practices: https://expressjs.com
