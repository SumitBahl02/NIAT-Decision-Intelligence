"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  Download,
  LogOut,
  Phone,
  UserCheck,
  Check,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Shield,
} from "lucide-react";

export type Lead = {
  id: string;
  created_at: string;
  question: string;
  language: string;
  answer: string | null;
  objection_type: string | null;
  intent_score: number | null;
  session_id: string | null;
  phone?: string | null;
  status?: string | null;
  counsellor_assigned?: string | null;
};

interface Props {
  initialLeads: Lead[];
  filter: string;
}

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

export default function DashboardClient({ initialLeads, filter }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const router = useRouter();

  // Sync when server revalidates
  useEffect(() => {
    setLeads(initialLeads);
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [initialLeads]);

  // Auto-mask revealed phone numbers after 30 seconds for PII security
  function togglePhoneReveal(id: string) {
    const isCurrentlyRevealed = !!revealedPhones[id];
    setRevealedPhones((prev) => ({ ...prev, [id]: !isCurrentlyRevealed }));

    if (!isCurrentlyRevealed) {
      setTimeout(() => {
        setRevealedPhones((prev) => ({ ...prev, [id]: false }));
      }, 30000); // Re-mask after 30s
    }
  }

  function maskPhone(phone: string): string {
    if (!phone || phone.length < 5) return phone;
    return phone.slice(0, 4) + " ••••• " + phone.slice(-2);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setActionError(null);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  async function handleAssign(leadId: string) {
    setAssigningId(leadId);
    setActionError(null);

    try {
      const res = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, counsellorName: "Regional Counsellor" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update lead status");
      }

      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, status: "assigned", counsellor_assigned: "Regional Counsellor" }
            : l
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to assign counsellor.");
    } finally {
      setAssigningId(null);
    }
  }

  function exportCSV(includeUnmaskedPhone = false) {
    if (
      includeUnmaskedPhone &&
      !window.confirm(
        "CONFIDENTIALITY NOTICE: You are exporting raw unmasked student/parent telephone numbers. Ensure this export complies with data privacy guidelines. Proceed?"
      )
    ) {
      return;
    }

    const headers = [
      "Lead_ID",
      "Timestamp_ISO",
      "Language",
      "Intent_Score",
      "Objection_Category",
      "Phone_Number",
      "Status",
      "Counsellor_Assigned",
      "Inquiry_Text",
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      l.language || "English",
      l.intent_score || 3,
      l.objection_type || "general",
      includeUnmaskedPhone ? (l.phone || "None") : (l.phone ? maskPhone(l.phone) : "None"),
      l.status || "pending",
      l.counsellor_assigned || "Unassigned",
      `"${(l.question || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `niat_leads_${includeUnmaskedPhone ? "unmasked" : "safe"}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filter === "all" ? true : l.objection_type === filter;
    const matchesSearch =
      search.trim() === ""
        ? true
        : l.question.toLowerCase().includes(search.toLowerCase()) ||
          (l.phone && l.phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Top Navbar Actions */}
      <div className={styles.headerActions}>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          Last query: {lastRefreshed}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          className={styles.exportBtn}
          title="Re-query database"
        >
          <RefreshCw size={13} className={isRefreshing ? styles.spinning : ""} /> Refresh
        </button>
        <button
          type="button"
          onClick={() => exportCSV(false)}
          className={styles.exportBtn}
          title="Export CSV with masked phone data"
        >
          <Download size={13} /> Export Safe CSV
        </button>
        <button
          type="button"
          onClick={() => exportCSV(true)}
          className={styles.exportBtn}
          style={{ borderColor: "#f59e0b55", color: "#f59e0b" }}
          title="Export unmasked phone numbers (requires confirmation)"
        >
          <Shield size={13} /> Unmasked CSV
        </button>
        <button type="button" onClick={handleLogout} className={styles.btnLogout}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div
          style={{
            background: "#450a0a",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Toolbar & Search */}
      <div className={styles.filterSection}>
        <div>
          <div className={styles.filterLabel}>Filter Pipeline:</div>
          <div className={styles.filterPills}>
            <a
              href="/dashboard"
              className={`${styles.filterPill} ${filter === "all" ? styles.filterPillActive : ""}`}
            >
              All Inquiries ({leads.length})
            </a>
            {Object.entries(OBJECTION_METADATA).map(([k, meta]) => {
              const count = leads.filter((l) => l.objection_type === k).length;
              return (
                <a
                  key={k}
                  href={`/dashboard?filter=${k}`}
                  className={`${styles.filterPill} ${filter === k ? styles.filterPillActive : ""}`}
                >
                  {meta.label} ({count})
                </a>
              );
            })}
          </div>
        </div>

        {/* Live Search */}
        <div style={{ position: "relative", minWidth: 260 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            placeholder="Search inquiry or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 20,
              padding: "8px 14px 8px 34px",
              color: "white",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderStrip}>
          <h3 className={styles.tableTitle}>
            Lead Activity Stream ({filteredLeads.length})
          </h3>
          <span className={styles.tableSub}>
            Phones auto-mask after 30s • Server-enforced permissions
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Logged Time</th>
                <th className={styles.th}>Language</th>
                <th className={styles.th}>Intent Score</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Contact / Phone</th>
                <th className={styles.th}>Inquiry Text</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const meta =
                  OBJECTION_METADATA[lead.objection_type || "general"] || OBJECTION_METADATA.general;
                const intent = INTENT_LEVELS[lead.intent_score || 3] || INTENT_LEVELS[3];
                const isAssigned = lead.status === "assigned";
                const isPhoneRevealed = !!revealedPhones[lead.id];

                return (
                  <tr key={lead.id}>
                    <td className={styles.td} style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(lead.created_at).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.15)",
                          color: "#60a5fa",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {lead.language || "English"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          background: intent.badgeBg,
                          color: intent.color,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {intent.text}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          background: meta.bg,
                          color: meta.text,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                      {lead.phone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {isPhoneRevealed ? lead.phone : maskPhone(lead.phone)}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePhoneReveal(lead.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: 2,
                            }}
                            title={
                              isPhoneRevealed
                                ? "Hide number"
                                : "Reveal number (Auto-masks in 30s)"
                            }
                          >
                            {isPhoneRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          {isPhoneRevealed && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(
                                /[^0-9]/g,
                                ""
                              )}?text=${encodeURIComponent(
                                "Hello from NIAT Admissions team. We saw your inquiry about the programme and are here to provide official clarification."
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.btnCall}
                              style={{ padding: "3px 7px", fontSize: 11 }}
                            >
                              <Phone size={11} /> WhatsApp
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 11 }}>Web Advisor Chat</span>
                      )}
                    </td>
                    <td className={styles.td} style={{ maxWidth: 360, color: "#f1f5f9" }}>
                      {lead.question}
                    </td>
                    <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                      {isAssigned ? (
                        <span className={`${styles.btnAssign} ${styles.btnAssigned}`}>
                          <Check size={12} /> Assigned
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAssign(lead.id)}
                          disabled={assigningId === lead.id}
                          className={styles.btnAssign}
                        >
                          <UserCheck size={12} />{" "}
                          {assigningId === lead.id ? "Assigning..." : "Assign Counsellor"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 14 }}
                  >
                    No inquiries match the current search / filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
