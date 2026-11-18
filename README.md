# NIAT Decision Intelligence 🧠

> **Enterprise-Hardened AI-Native Parent Conversion & Admissions Engine**  
> Built for the **NxtWave Jr. Growth Manager — Growth Hack Challenge (Round 1)**  
> **Track B: Bottom-of-Funnel (Lead to Sale)**

---

## 🎯 Executive Summary & Context

NIAT (*NxtWave Institute of Advanced Technologies*) is an intensive 4-year on-campus software engineering upskilling programme for 12th-completed students that embeds within UGC-recognized partner universities.

### The Conversion Problem
While NIAT generates strong top-of-funnel interest through YouTube, bootcamps, and influencer activations, the critical drop-off occurs at the **parental decision threshold**. 
- Families discuss education commitments during dinner and late-night hours (**10:00 PM – 1:00 AM**).
- Human tele-counsellors are offline during this window.
- Parents in Tier-2/3 cities face skepticism around partner university legitimacy, total fees, and hostel arrangements.
- Unanswered late-night doubts freeze high-intent leads, causing them to slip away.

### The Solution: An AI-Native 3-Component Conversion Machine
This system acts as a 24/7 objective advisory engine that converses in vernacular languages, classifies real-time objections using Google Gemini, captures warm leads in a Supabase database, and surfaces them into an actionable Growth & Admissions Priority Queue for immediate morning outreach.

---

## 🏗️ Architecture & 3 Connected Components

```mermaid
flowchart TD
    User["👨‍👩‍👧 Parent or Student\n(Visits Web App)"] --> C1

    subgraph C1 ["Component 1: AI Family Decision Advisor"]
      UI["Next.js Responsive UI\nsrc/app/page.tsx\n• 6 Vernacular Languages\n• Text-to-Speech (Voice)\n• Markdown Rendering"]
      UI <--> AssistantAPI["POST /api/assistant\n• Prompt-Injection Defenses (<user_inquiry>)\n• Verified Gemini Model Fallback\n• Direct In-Process Server Lead Logging"]
    end

    AssistantAPI -->|In-Process Service Call| C2

    subgraph C2 ["Component 2: Lead Intelligence & Intent Scoring Engine"]
      CaptureAPI["POST /api/capture-lead & recordLeadServer()\n• Persistent PostgreSQL Rate Limiting\n• Schema & E.164 Phone Validation\n• AI Objection Classifier\n• Intent Scoring (1–5 Scale)"]
      CaptureAPI --> DB[(Supabase PostgreSQL\nTokyo Region Instance\npublic.leads & public.rate_limits\nRLS: Anon SELECT Revoked)]
    end

    DB -->|Server-Side Pool Connection| C3

    subgraph C3 ["Component 3: Growth & Sales Intelligence Portal"]
      AuthGuard["Session Authentication Guard\nFail-Fast Secret Verification\nHTTP-only HMAC Signed Cookie\n/dashboard/login"] --> DashUI["Growth Dashboard\nsrc/app/dashboard/page.tsx\n• Real-Time KPI Cards\n• 🔥 Warm Leads Priority Queue\n• Category Filtering\n• Safe Masked & Confirmed Unmasked CSV\n• Real 'Assign Counsellor' Live Action\n• 30-Second Auto-Mask Phone Privacy"]
    end

    style C1 fill:#1e3a8a,stroke:#3b82f6,color:#ffffff
    style C2 fill:#0f172a,stroke:#10b981,color:#ffffff
    style C3 fill:#111827,stroke:#f59e0b,color:#ffffff
```

---

## 🔒 Security & Production Hardening Audit (Verified)

| Vulnerability / Risk | Previous State | Hardened Production State |
|---|---|---|
| **Supabase Data Privacy** | Anon key could query all leads via REST | **REVOKED `SELECT` from anon role.** Public anon key cannot read `public.leads`. Dashboard reads via authenticated server-only PostgreSQL pool (`DATABASE_URL`). |
| **Dashboard Authentication** | Hardcoded key fallback in URL | **Fail-fast validation.** Throws critical error if `AUTH_SECRET` or `ADMIN_PASSWORD` is missing. Zero hardcoded fallbacks. |
| **Login Brute-Force** | Unlimited password attempts | **IP lockout:** Max 5 attempts per 15 minutes tracked in persistent database table `public.rate_limits`. |
| **Rate Limiting** | Volatile in-memory map | **PostgreSQL-backed shared rate limiting** (`checkPersistentRateLimit`) surviving restarts & functioning across serverless instances. |
| **Prompt Injection** | String interpolation in LLM prompt | **XML Delimited `<user_inquiry>` containment** with explicit guardrails instructing the LLM to treat inquiry strictly as untrusted data. |
| **Lead Capture Mechanism** | Fire-and-forget loopback fetch | **Direct in-process server call (`recordLeadServer`)** eliminating self-HTTP loops and unhandled failures. |
| **Database Outage Handling** | Silent `rawLeads \|\| []` masking errors | **Explicit error banner & retry trigger** showing actual diagnostic status and server health. |
| **PII & Phone Security** | Plaintext display & CSV export | **Auto-masking after 30s (`98765 ••••• 10`)**, explicit consent checkbox on submission, and separate "Safe Masked CSV" vs confirmed "Unmasked CSV" export. |

---

## 📋 Database Schema (`public.leads` & `public.rate_limits`)

```sql
-- Leads Table
CREATE TABLE public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  question text NOT NULL,
  language text DEFAULT 'English',
  answer text,
  objection_type text CHECK (objection_type IN ('cost', 'trust', 'alternatives', 'timeline', 'general')),
  intent_score int CHECK (intent_score BETWEEN 1 AND 5),
  session_id text,
  phone text,
  status text DEFAULT 'pending',
  counsellor_assigned text
);

-- RLS Hardening: Anon can ONLY insert, never read
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow anon select" ON public.leads;
REVOKE SELECT ON TABLE public.leads FROM anon;
GRANT INSERT ON TABLE public.leads TO anon;
GRANT ALL ON TABLE public.leads TO authenticated, service_role, postgres;

-- Shared Serverless Rate Limiting Table
CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 1,
  reset_at timestamptz NOT NULL
);
GRANT ALL ON TABLE public.rate_limits TO anon, authenticated, service_role, postgres;
```

---

## 🚀 Environment Variables (`.env.local`)

```env
# Gemini API Key (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Public Keys (for anon client insertion)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key

# PostgreSQL Direct Connection Pool (Server-side only)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Administrator Credentials (Fail-fast: app halts if unset)
ADMIN_PASSWORD=your_strong_admin_password
AUTH_SECRET=random_32_character_hex_secret_key
```

---

## 🧪 Automated Test Suite

```bash
npm test
```

Executes 13 unit and integration tests covering:
- Timing-safe HMAC session creation & tamper rejection
- Insecure secret fail-fast validation
- Phone sanitization & Indian mobile regex
- Language & objection whitelists
- Prompt injection isolation via `<user_inquiry>` tags
- PII masking logic

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run automated tests
npm test

# 3. Start local server
npm run dev
```

- Public Advisor: **`http://localhost:3000`**
- Staff Portal: **`http://localhost:3000/dashboard/login`**
