"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  TrendingUp,
  Languages,
  ArrowRight,
  HelpCircle,
  PhoneCall,
  Clock,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
  retryQuery?: string;
};

const LANGUAGES = [
  { code: "English", label: "English", native: "English" },
  { code: "Telugu", label: "Telugu", native: "తెలుగు" },
  { code: "Hindi", label: "Hindi", native: "हिन्दी" },
  { code: "Tamil", label: "Tamil", native: "தமிழ்" },
  { code: "Kannada", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "Malayalam", label: "Malayalam", native: "മലയാളം" },
];

const SUGGESTIONS = [
  {
    category: "Fees & ROI",
    icon: "💰",
    question: "What is the total fee for 4 years and are EMI/scholarship options available?",
  },
  {
    category: "Degree Legitimacy",
    icon: "📜",
    question: "Is the partner university degree recognized by UGC/AICTE for higher studies and govt jobs?",
  },
  {
    category: "NIAT vs College",
    icon: "⚡",
    question: "How is NIAT's curriculum different from a traditional local B.Tech college?",
  },
  {
    category: "Parent Checklist",
    icon: "🛡️",
    question: "What specific criteria should parents verify before enrolling their child in NIAT?",
  },
  {
    category: "Placements",
    icon: "💼",
    question: "What are realistic placement outcomes, starting salaries, and hiring partners?",
  },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("English");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function handleSend(queryText?: string) {
    const textToSend = (queryText || question).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          language,
          sessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "The advisor service encountered an issue. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
        retryQuery: textToSend,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSpeak(id: string, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    const langMap: Record<string, string> = {
      English: "en-IN",
      Hindi: "hi-IN",
      Telugu: "te-IN",
      Tamil: "ta-IN",
      Kannada: "kn-IN",
      Malayalam: "ml-IN",
    };
    utterance.lang = langMap[language] || "en-US";
    utterance.rate = 1.0;

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  async function submitLeadCallback(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = leadPhone.trim().replace(/[\s\-\(\)]/g, "");
    
    // Validate phone: 10 digits or international format
    if (!/^[6-9]\d{9}$/.test(cleanPhone) && !/^\+?[1-9]\d{6,14}$/.test(cleanPhone)) {
      setCallbackError("Please enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }

    setCallbackError("");
    setSubmittingLead(true);

    try {
      const res = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          question: "Requested direct counsellor phone guidance on NIAT admissions and fees",
          language,
          answer: "Logged callback request for regional admissions desk follow-up.",
          sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule callback. Please try again.");
      }

      setLeadSubmitted(true);
      setTimeout(() => {
        setLeadModalOpen(false);
        setLeadSubmitted(false);
        setLeadPhone("");
      }, 2500);
    } catch (err) {
      setCallbackError(err instanceof Error ? err.message : "Failed to connect to admissions desk.");
    } finally {
      setSubmittingLead(false);
    }
  }

  return (
    <div className="root-layout">
      {/* Decorative ambient background glows */}
      <div className="glow-sphere glow-sphere-1" />
      <div className="glow-sphere glow-sphere-2" />

      {/* Top Navbar */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-avatar">
              <span className="brand-letter">N</span>
              <span className="brand-pulse" />
            </div>
            <div>
              <div className="brand-title">
                NIAT Decision Intelligence
                <span className="badge-pill">v2.0 AI-Native</span>
              </div>
              <div className="brand-subtitle">
                Official NxtWave Family Decision Support Engine
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="live-status">
              <span className="status-dot" />
              <span>Live System (Gemini 2.5 Flash)</span>
            </div>

            <a
              href="/dashboard"
              className="btn-dashboard"
            >
              <span>Sales Dashboard</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="content-wrap">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="eyebrow-chip">
            <Sparkles size={14} className="sparkle-icon" />
            <span>AI-POWERED FAMILY ADVISORY</span>
          </div>

          <h1 className="hero-heading">
            Make your family&apos;s next big education choice with{" "}
            <span className="gradient-text">unbiased clarity.</span>
          </h1>

          <p className="hero-description">
            Explore NIAT&apos;s 4-year on-campus software engineering program. Get real answers on
            fees, university affiliations, and placements without marketing fluff — in your native
            language.
          </p>

          {/* Value Badges */}
          <div className="value-pills-row">
            <div className="value-pill">
              <GraduationCap size={15} />
              <span>UGC-Recognized Partner Degree</span>
            </div>
            <div className="value-pill">
              <TrendingUp size={15} />
              <span>Industry-Led Coding From Day 1</span>
            </div>
            <div className="value-pill">
              <ShieldCheck size={15} />
              <span>Verified Facts Only</span>
            </div>
            <div className="value-pill">
              <Languages size={15} />
              <span>6 Vernacular Languages</span>
            </div>
          </div>
        </section>

        {/* Advisor Chat Card */}
        <section className="advisor-card">
          {/* Card Header & Language Switcher */}
          <div className="card-topbar">
            <div className="advisor-identity">
              <div className="advisor-avatar">
                <Bot size={22} />
              </div>
              <div>
                <h2>AI Family Decision Advisor</h2>
                <p>24/7 Objective Advisory • Multi-Turn Conversation</p>
              </div>
            </div>

            {/* Language Selector Bar */}
            <div className="language-selector-box">
              <span className="language-label">
                <Languages size={14} /> Response Language:
              </span>
              <div className="language-pills">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`lang-pill ${language === item.code ? "active" : ""}`}
                    onClick={() => setLanguage(item.code)}
                  >
                    <span className="lang-native">{item.native}</span>
                    <span className="lang-code">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation Feed */}
          <div className="messages-stream">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Bot size={36} />
                </div>
                <h3>Welcome! What is on your family&apos;s mind?</h3>
                <p>
                  Click any frequent parental inquiry below or type your own question in the box.
                </p>

                {/* Question Suggestion Cards */}
                <div className="suggestions-grid">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-tile"
                      onClick={() => handleSend(item.question)}
                    >
                      <div className="suggestion-header">
                        <span className="suggestion-icon">{item.icon}</span>
                        <span className="suggestion-tag">{item.category}</span>
                      </div>
                      <p className="suggestion-query">{item.question}</p>
                      <div className="suggestion-cta">
                        Ask this question <ArrowRight size={13} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-thread">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble-wrapper ${
                      msg.role === "assistant" ? "assistant-bubble" : "user-bubble"
                    }`}
                  >
                    <div className="message-header-row">
                      <div className="sender-tag">
                        {msg.role === "assistant" ? (
                          <>
                            <div className="mini-avatar bot">
                              <Bot size={13} />
                            </div>
                            <span className="sender-name">NIAT Family Advisor</span>
                            <span className="ai-badge">AI Verified</span>
                          </>
                        ) : (
                          <>
                            <div className="mini-avatar user">
                              <User size={13} />
                            </div>
                            <span className="sender-name">You (Parent / Student)</span>
                          </>
                        )}
                      </div>
                      <div className="message-meta-actions">
                        <span className="meta-time">
                          <Clock size={11} /> {msg.timestamp}
                        </span>
                        {msg.role === "assistant" && (
                          <>
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Listen to response"
                              onClick={() => handleSpeak(msg.id, msg.content)}
                            >
                              {speakingId === msg.id ? (
                                <VolumeX size={14} className="speaking-active" />
                              ) : (
                                <Volume2 size={14} />
                              )}
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Copy answer"
                              onClick={() => handleCopy(msg.id, msg.content)}
                            >
                              {copiedId === msg.id ? (
                                <Check size={14} className="copied-active" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="message-text-body">
                      {msg.role === "assistant" ? (
                        msg.isError ? (
                          <div style={{ color: "#dc2626" }}>
                            <p style={{ marginBottom: 8, fontWeight: 500 }}>{msg.content}</p>
                            {msg.retryQuery && (
                              <button
                                type="button"
                                onClick={() => handleSend(msg.retryQuery)}
                                style={{
                                  background: "#fee2e2",
                                  border: "1px solid #fca5a5",
                                  color: "#b91c1c",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                ↺ Retry Question
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="markdown-prose">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <p className="user-plain-text">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="message-bubble-wrapper assistant-bubble">
                    <div className="message-header-row">
                      <div className="sender-tag">
                        <div className="mini-avatar bot">
                          <Bot size={13} />
                        </div>
                        <span className="sender-name">NIAT Family Advisor</span>
                      </div>
                    </div>
                    <div className="loading-state">
                      <div className="pulsing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span>Reviewing curriculum and admissions context...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Context Prompt Chips when chat is active */}
          {messages.length > 0 && (
            <div className="quick-followups">
              <span className="quick-label">
                <HelpCircle size={13} /> Quick Follow-ups:
              </span>
              {[
                "Tell me about NAT exam registration",
                "What companies hire NIAT students?",
                "Which university partners award the degree?",
                "Is hostel and mess included in fees?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="quick-chip"
                  onClick={() => handleSend(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="input-toolbar"
          >
            <div className="input-field-wrap">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  language === "English"
                    ? "Ask your questions about NIAT fees, degree, admissions, hostels..."
                    : `Ask in ${language} or English...`
                }
                maxLength={1500}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="send-button"
              disabled={loading || !question.trim()}
              title="Send Inquiry"
            >
              <span>Ask Advisor</span>
              <Send size={16} />
            </button>
          </form>

          {/* Disclaimer & Bottom Action */}
          <div className="card-footer-strip">
            <p className="disclaimer-note">
              🛡️ <strong>Independent Advisory:</strong> This AI synthesizes public program
              documentation and official university guidelines. Always verify final admission,
              scholarships, and seat allotment directly with NIAT counsellors.
            </p>
            <button
              type="button"
              className="counsellor-trigger-btn"
              onClick={() => setLeadModalOpen(true)}
            >
              <PhoneCall size={14} />
              <span>Need official counsellor callback?</span>
            </button>
          </div>
        </section>
      </main>

      {/* Official Callback Modal */}
      {leadModalOpen && (
        <div className="modal-backdrop" onClick={() => setLeadModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrap">
                <PhoneCall size={20} />
              </div>
              <div>
                <h3>Request Official Guidance</h3>
                <p>Have an authorized NIAT regional counsellor call you</p>
              </div>
            </div>

            {leadSubmitted ? (
              <div className="modal-success">
                <Check size={36} className="success-icon" />
                <h4>Request Received!</h4>
                <p>Our team will reach out during office hours (9 AM – 7 PM).</p>
              </div>
            ) : (
              <form onSubmit={submitLeadCallback} className="modal-form">
                {callbackError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#b91c1c",
                      fontSize: 12.5,
                      padding: "8px 12px",
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    {callbackError}
                  </div>
                )}
                <label htmlFor="phone-input">Your Mobile / WhatsApp Number</label>
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={leadPhone}
                  onChange={(e) => {
                    setLeadPhone(e.target.value);
                    if (callbackError) setCallbackError("");
                  }}
                  required
                  autoFocus
                />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "10px 0 16px" }}>
                  <input
                    type="checkbox"
                    id="consent-check"
                    required
                    defaultChecked
                    style={{ marginTop: 3, width: "auto" }}
                  />
                  <label htmlFor="consent-check" style={{ fontSize: 11.5, color: "#64748b", margin: 0, fontWeight: 400 }}>
                    I agree to be contacted by an authorized NIAT regional admissions counsellor via WhatsApp or phone. No marketing spam.
                  </label>
                </div>
                <div className="modal-btn-row">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setLeadModalOpen(false);
                      setCallbackError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm" disabled={submittingLead}>
                    {submittingLead ? "Submitting..." : "Request Callback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <p>
            <strong>NIAT Decision Intelligence</strong> · Multi-Component AI Growth System · Built
            for NxtWave Growth Challenge Round 1
          </p>
          <div className="footer-links">
            <a href="/dashboard">
              Growth Intelligence Dashboard →
            </a>
            <span>•</span>
            <a href="https://www.niatindia.com" target="_blank" rel="noreferrer">
              Official NIAT Website ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
