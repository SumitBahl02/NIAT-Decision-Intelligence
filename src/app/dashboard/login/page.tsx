"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090d16",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#111827",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)",
            }}
          >
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 6 }}>
            NIAT Growth Portal
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            Authorized sales team & counsellor access
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="pwd"
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: 8,
              }}
            >
              Administrator Password
            </label>
            <input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password"
              required
              autoFocus
              style={{
                width: "100%",
                background: "#0f172a",
                border: "1.5px solid #334155",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                color: "white",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: loading || !password.trim() ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a
            href="/"
            style={{
              color: "#64748b",
              fontSize: 12.5,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={13} /> Back to Public Advisor
          </a>
        </div>
      </div>
    </div>
  );
}
