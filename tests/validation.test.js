const { describe, it } = require("node:test");
const assert = require("node:assert");

function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/[\s\-\(\)\+]/g, "");
  return /^[6-9]\d{9}$/.test(digits) || /^\d{7,15}$/.test(digits);
}

function sanitizeQuestion(q) {
  if (!q || typeof q !== "string") return null;
  const trimmed = q.trim();
  if (trimmed.length < 2 || trimmed.length > 1500) return null;
  return trimmed;
}

const ALLOWED_LANGUAGES = new Set([
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
]);

const VALID_OBJECTIONS = new Set(["cost", "trust", "alternatives", "timeline", "general"]);

describe("Lead Validation & Sanitization", () => {
  it("should validate valid Indian mobile numbers", () => {
    assert.strictEqual(isValidPhone("9876543210"), true);
    assert.strictEqual(isValidPhone("+91 9876543210"), true);
    assert.strictEqual(isValidPhone("8123456789"), true);
    assert.strictEqual(isValidPhone("7000000000"), true);
    assert.strictEqual(isValidPhone("6999999999"), true);
  });

  it("should reject invalid mobile numbers", () => {
    assert.strictEqual(isValidPhone("12345"), false); // too short
    assert.strictEqual(isValidPhone("abc-123-def"), false); // non-digits
    assert.strictEqual(isValidPhone(""), false); // empty
    assert.strictEqual(isValidPhone(null), false); // null
  });

  it("should validate question length constraints", () => {
    assert.strictEqual(sanitizeQuestion(""), null);
    assert.strictEqual(sanitizeQuestion("a"), null); // < 2 chars
    assert.strictEqual(sanitizeQuestion("What is NIAT?"), "What is NIAT?");
    assert.strictEqual(sanitizeQuestion("x".repeat(1501)), null); // > 1500 chars
  });

  it("should enforce supported language whitelist", () => {
    assert.strictEqual(ALLOWED_LANGUAGES.has("English"), true);
    assert.strictEqual(ALLOWED_LANGUAGES.has("Telugu"), true);
    assert.strictEqual(ALLOWED_LANGUAGES.has("Hindi"), true);
    assert.strictEqual(ALLOWED_LANGUAGES.has("Spanish"), false);
    assert.strictEqual(ALLOWED_LANGUAGES.has("French"), false);
  });

  it("should enforce objection categories", () => {
    assert.strictEqual(VALID_OBJECTIONS.has("cost"), true);
    assert.strictEqual(VALID_OBJECTIONS.has("trust"), true);
    assert.strictEqual(VALID_OBJECTIONS.has("alternatives"), true);
    assert.strictEqual(VALID_OBJECTIONS.has("timeline"), true);
    assert.strictEqual(VALID_OBJECTIONS.has("general"), true);
    assert.strictEqual(VALID_OBJECTIONS.has("random_category"), false);
  });

  it("should clamp intent score between 1 and 5", () => {
    function clampScore(score) {
      const n = parseInt(score, 10);
      if (isNaN(n)) return 3;
      return Math.min(5, Math.max(1, n));
    }

    assert.strictEqual(clampScore(1), 1);
    assert.strictEqual(clampScore(5), 5);
    assert.strictEqual(clampScore(0), 1);
    assert.strictEqual(clampScore(10), 5);
    assert.strictEqual(clampScore("invalid"), 3);
  });
});
