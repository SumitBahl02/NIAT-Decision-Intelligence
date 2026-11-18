import { redirect } from "next/navigation";
import { isUserAuthenticated } from "@/lib/auth";
import { queryServerDb } from "@/lib/db";
import DashboardClient, { Lead } from "./DashboardClient";
import styles from "./dashboard.module.css";
import {
  Users,
  Flame,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const OBJECTION_METADATA: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  cost: { label: "Cost & Fees", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  trust: { label: "Degree Trust", bg: "#fff7ed", text: "#ea580c", border: "#ffedd5" },
  alternatives: { label: "Comparisons", bg: "#faf5ff", text: "#9333ea", border: "#f3e8ff" },
  timeline: { label: "Admission Dates", bg: "#f0f9ff", text: "#0284c7", border: "#e0f2fe" },
  general: { label: "General Info", bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

const INTENT_LEVELS: Record<number, { text: string; color: string; badgeBg: string }> = {
  1: { text: "1/5 - Casual", color: "#94a3b8", badgeBg: "#f1f5f9" },
  2: { text: "2/5 - Researching", color: "#64748b", badgeBg: "#f1f5f9" },
  3: { text: "3/5 - Considering", color: "#3b82f6", badgeBg: "#eff6ff" },
  4: { text: "4/5 - Warm Lead", color: "#f59e0b", badgeBg: "#fffbeb" },
  5: { text: "5/5 - Ready to Decide", color: "#ef4444", badgeBg: "#fef2f2" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const isAuth = await isUserAuthenticated();
  if (!isAuth) {
    redirect("/dashboard/login");
  }

  const params = await searchParams;
  const filter = params.filter || "all";

  let leads: Lead[] = [];
  let dbError: string | null = null;

  try {
    leads = await queryServerDb<Lead>(
      `SELECT id, created_at, question, language, answer, objection_type, intent_score, session_id, phone, status, counsellor_assigned 
       FROM public.leads 
       ORDER BY created_at DESC 
       LIMIT 500;`
    );
  } catch (err) {
    console.error("Dashboard server query failed:", err);
    dbError =
      err instanceof Error
        ? err.message
        : "Failed to connect to the database. Please verify PostgreSQL connection credentials.";
  }

  const isConnected = dbError === null;
  const warm = leads.filter((l) => (l.intent_score || 0) >= 4);

  const byType = leads.reduce<Record<string, number>>((acc, l) => {
    const t = l.objection_type || "general";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const avgScore =
    leads.length > 0
      ? (leads.reduce((s, l) => s + (l.intent_score || 0), 0) / leads.length).toFixed(1)
      : "0.0";

  const topObjectionKey = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";
  const topObjection = OBJECTION_METADATA[topObjectionKey]?.label || "General";

  return (
    <div className={styles.dashboardWrap}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandGroup}>
            <div className={styles.logoIcon}>N</div>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.headerTitle}>NIAT Sales & Intent Intelligence</h1>
                {isConnected ? (
                  <span className={styles.headerBadge}>● Database Securely Connected</span>
                ) : (
                  <span
                    className={styles.headerBadge}
                    style={{ background: "#7f1d1d", color: "#fca5a5", borderColor: "#ef4444" }}
                  >
                    ⚠ Database Outage
                  </span>
                )}
              </div>
              <p className={styles.headerSubtitle}>
                Verified parental inquiry tracking • Server-authenticated access
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" className={styles.navLink}>
              <ArrowLeft size={14} /> Back to Advisor
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.container}>
        {/* Visible Database Outage Alert */}
        {dbError && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #dc2626",
              borderRadius: 12,
              padding: "18px 24px",
              color: "#fecaca",
              marginBottom: 24,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <AlertTriangle size={24} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "white" }}>
                Database Query Error
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.5 }}>
                Could not retrieve leads from the PostgreSQL cluster. Error:{" "}
                <code style={{ background: "#1c1917", padding: "2px 6px", borderRadius: 4 }}>
                  {dbError}
                </code>
              </p>
              <a
                href="/dashboard"
                style={{
                  color: "#38bdf8",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Click to Retry Connection
              </a>
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Total Leads</span>
              <div
                className={styles.kpiIconWrap}
                style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
              >
                <Users size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>{leads.length}</div>
            <div className={styles.kpiSubtext} style={{ color: "#10b981" }}>
              ↑ Logged sessions in database
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel} style={{ color: "#fca5a5" }}>
                🔥 Warm Closing Leads
              </span>
              <div
                className={styles.kpiIconWrap}
                style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
              >
                <Flame size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: "#f87171" }}>
              {warm.length}
            </div>
            <div className={styles.kpiSubtext} style={{ color: "#fca5a5" }}>
              Intent Level 4 & 5 (Ready for closing)
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Avg Intent Score</span>
              <div
                className={styles.kpiIconWrap}
                style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>{avgScore} / 5.0</div>
            <div className={styles.kpiSubtext} style={{ color: "#94a3b8" }}>
              Calculated via Gemini Classifier
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Top Stumbling Block</span>
              <div
                className={styles.kpiIconWrap}
                style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
              >
                <AlertCircle size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: "#fbbf24", fontSize: 24 }}>
              {topObjection}
            </div>
            <div className={styles.kpiSubtext} style={{ color: "#94a3b8" }}>
              {byType[topObjectionKey] || 0} candidate questions
            </div>
          </div>
        </div>

        {/* Priority Follow-Up Queue */}
        {warm.length > 0 && filter === "all" && (
          <section className={styles.priorityQueue}>
            <div className={styles.queueHeader}>
              <div>
                <h3 className={styles.queueTitle}>
                  <Flame size={18} /> Priority Follow-Up Queue (Score ≥ 4)
                </h3>
                <p className={styles.queueSubtitle}>
                  These parents are at the final decision threshold. Direct phone counselling will
                  convert these leads.
                </p>
              </div>
              <span className={styles.queueBadge}>{warm.length} Actionable Leads</span>
            </div>

            <div className={styles.queueList}>
              {warm.slice(0, 6).map((lead) => {
                const meta =
                  OBJECTION_METADATA[lead.objection_type || "general"] || OBJECTION_METADATA.general;
                const intent = INTENT_LEVELS[lead.intent_score || 4] || INTENT_LEVELS[4];
                return (
                  <div key={lead.id} className={styles.queueItem}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div className={styles.leadMetaRow}>
                        <span
                          className={styles.badge}
                          style={{ background: meta.bg, color: meta.text }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className={styles.badge}
                          style={{ background: intent.badgeBg, color: intent.color }}
                        >
                          {intent.text}
                        </span>
                        <span className={styles.timeMeta}>
                          <Clock size={11} style={{ verticalAlign: "middle" }} />{" "}
                          {new Date(lead.created_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {lead.phone && (
                          <span
                            style={{ fontSize: 11, color: "#38bdf8", fontFamily: "monospace" }}
                          >
                            📱 Phone Attached
                          </span>
                        )}
                      </div>
                      <p className={styles.leadQuery}>&ldquo;{lead.question}&rdquo;</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Client Component */}
        <DashboardClient initialLeads={leads} filter={filter} />
      </main>
    </div>
  );
}
