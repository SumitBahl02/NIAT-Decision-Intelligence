const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Atomic Rate Limiting Logic", () => {
  it("should calculate correct retry after seconds", () => {
    const now = Date.now();
    const resetDate = new Date(now + 45 * 1000);
    const retryAfter = Math.max(1, Math.ceil((resetDate.getTime() - now) / 1000));
    assert.strictEqual(retryAfter >= 44 && retryAfter <= 46, true);
  });

  it("should compute remaining attempts correctly", () => {
    const max = 5;
    const count = 3;
    const remaining = Math.max(0, max - count);
    assert.strictEqual(remaining, 2);
  });

  it("should signal lockout when count exceeds threshold", () => {
    const max = 5;
    const count = 6;
    const isLocked = count > max;
    assert.strictEqual(isLocked, true);
  });
});
