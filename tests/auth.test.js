const { describe, it } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");

const TEST_SECRET = "test_super_secret_key_32_characters_long_123456";

function createSessionToken(secret) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

function verifySessionToken(token, secret) {
  if (!token || !token.includes(".")) return false;

  const [timestamp, signature] = token.split(".");
  const timeNum = parseInt(timestamp, 10);
  if (isNaN(timeNum)) return false;

  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - timeNum > maxAgeMs) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

describe("Dashboard Authentication & Session Security", () => {
  it("should create and verify valid HMAC session token", () => {
    const token = createSessionToken(TEST_SECRET);
    assert.strictEqual(verifySessionToken(token, TEST_SECRET), true);
  });

  it("should reject tampered signature in session token", () => {
    const token = createSessionToken(TEST_SECRET);
    const [timestamp] = token.split(".");
    const fakeToken = `${timestamp}.deadbeef1234567890abcdef`;
    assert.strictEqual(verifySessionToken(fakeToken, TEST_SECRET), false);
  });

  it("should reject token signed with different secret", () => {
    const token = createSessionToken("wrong_secret_key_abcdef1234567890");
    assert.strictEqual(verifySessionToken(token, TEST_SECRET), false);
  });

  it("should reject expired token", () => {
    const expiredTimestamp = (Date.now() - 25 * 60 * 60 * 1000).toString();
    const signature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(expiredTimestamp)
      .digest("hex");
    const expiredToken = `${expiredTimestamp}.${signature}`;
    assert.strictEqual(verifySessionToken(expiredToken, TEST_SECRET), false);
  });
});
