# PhishGuard — User Manual & Operations Guide

Welcome to the **PhishGuard** Multi-Engine Phishing Detection System. This manual provides clear, step-by-step instructions on how to use all the features of the PhishGuard application.

---

## 1. System Access & User Onboarding

### 1.1. User Registration
To create a new PhishGuard security account:
1. Navigate to the PhishGuard portal (usually `http://localhost:5173` or your production domain).
2. On the welcome console, click **Create an Account**.
3. Enter your details in the registration form:
   - **Full Name**: Enter your name for display on reports.
   - **Email Address**: Enter a unique, valid email address.
   - **Password**: Enter a strong password.
4. Click **Create Account**.
5. Once registration succeeds, you will be automatically logged in and redirected to the **Command Center**.

### 1.2. User Login
To log back into your account:
1. On the welcome console, fill in the **Login** form.
2. Enter your registered **Email Address** and **Password**.
3. *(Optional)* Click the **Eye Icon** to show password text and verify typing.
4. Click **Sign In**.
5. Upon successful authentication, the system will route standard users to the **Command Center** and administrator accounts to the specialized **Admin Console**.

---

## 2. Dynamic Scanning & Threat Detection

### 2.1. URL Scanning
The URL Scanner checks links against multiple threat databases to verify their safety.
1. Select **Scan URL** from the navigation sidebar or click the action button in the Command Center.
2. Paste the target address (e.g., `http://paypal-account-security-alert.com`) into the input field.
3. Click **Analyze Target**.
4. **Scan Results Display**:
   - **Risk Score Indicator**: View the unified risk index (0–100) and danger category badge (`Safe`, `Suspicious`, or `High Risk`).
   - **Lexical Findings**: Read details of any specific keywords flagged by local heuristic checks.
   - **Threat Intelligence Feeds**: View live status badges from VirusTotal, Google Safe Browsing, and AbuseIPDB.
   - **Cognitive AI Summary**: Review the natural language explanation of the threats and detailed security recommendations.

### 2.2. Email Analysis
The Email Scanner evaluates email headers and content patterns for social engineering indicators.
1. Select **Scan Email** from the sidebar.
2. Paste the complete body content of the email you wish to scan.
3. *(Optional but Recommended)* Enter the **Subject Line** and **Sender Address** to check for sender impersonation.
4. Click **Analyze Email**.
5. **Analysis Display**:
   - The scanner will extract embedded URLs and automatically check them.
   - The system displays the risk score alongside actionable next steps (e.g., *Do not reply to this sender*, *Mark as Spam*).

### 2.3. QR Scanner (Quishing Defender)
The QR Scanner extracts URLs from uploaded QR code images and runs them through our security filters.
1. Select **Scan QR** from the sidebar.
2. Click **Choose File** or drag and drop a QR code image (PNG, JPEG, WEBP; Max: 8MB) into the upload zone.
3. Click **Scan Image**.
4. The system will decode the image, extract the URL destination, and display a complete risk scorecard and list of findings.

### 2.4. Screenshot AI (Impersonation Defender)
The Screenshot AI analyzes images of suspect websites to flag visual spoofing attempts.
1. Select **Screenshot AI** from the sidebar.
2. Upload a screenshot of the webpage you want to analyze.
3. The system's vision assistant will inspect the layout and output:
   - **Resemblance Warnings**: Identifies if the page mimics popular secure portals (e.g., Google login screens).
   - **Layout Text Warnings**: Detects mismatched headers or suspicious forms.

### 2.5. Threat Comparison
Use this tool to compare two threats side-by-side.
1. Select **Compare Threats** from the sidebar.
2. Input the targets for **Target A** and **Target B** (select whether each input is a URL or an Email).
3. Click **Run Comparison**.
4. The system displays side-by-side risk scorecards and outputs an AI-synthesized verdict explaining which target represents the greater security risk.

---

## 3. Companion AI Assistant
The AI Cybersecurity Assistant is available to help explain threat patterns and security terms.
1. Click **AI Assistant** in the sidebar.
2. Type any cybersecurity question into the chat console (e.g., *"What does domain typosquatting mean?"*).
3. Click **Send** or press Enter.
4. The Assistant will generate an informative explanation in the chat interface.
5. If the primary AI provider experiences an outage, the system will seamlessly switch to a fallback provider to answer your query.

---

## 4. Threat Reports & History

### 4.1. Scan History Logs
To audit your past scans:
1. Click **History** in the navigation sidebar.
2. View the table of all your previous scan targets, types, and risk scores.
3. Use the page controls to navigate through long lists of records.
4. Use the search bar to filter logs by specific keywords.
5. Click **Download JSON** to export your history log as a structured text file.

### 4.2. Threat Reports (PDF Downloads)
To generate and download a formal PDF report of a threat:
1. View the detailed results page of any URL or Email scan.
2. Click **Generate Report**.
3. A professionally formatted PDF document will compile in your browser, containing the target details, risk scorecard, specific findings, and incident response instructions.
4. Save the PDF locally for your security logs or compliance reviews.

---

## 5. Administrative Console (For Security Managers)

Authorized administrators have access to central system monitoring features:
1. **Analytics Dashboard**: View aggregate usage statistics, including total user counts, active threat breakdowns, and 30-day scan volume trends.
2. **Threat Feed**: Keep track of suspicious and high-risk scans logged across the platform in real time.
3. **Operator Search**: Search, filter, and verify user roles in the database.
