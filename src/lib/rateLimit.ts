import { queryServerDb } from "./db";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Atomic, single-query PostgreSQL rate limiter.
 * Concurrency-safe, race-condition free, and fails CLOSED.
 */
export async function checkPersistentRateLimit(
  key: string,
  maxRequests = 10,
  windowSeconds = 60
): Promise<RateLimitResult> {
  try {
    const rows = await queryServerDb<{ count: number; retry_after: number }>(
      `INSERT INTO public.rate_limits (key, count, reset_at)
       VALUES ($1, 1, NOW() + ($2 || ' seconds')::interval)
       ON CONFLICT (key) DO UPDATE
       SET count = CASE
             WHEN public.rate_limits.reset_at < NOW() THEN 1
             ELSE public.rate_limits.count + 1
           END,
           reset_at = CASE
             WHEN public.rate_limits.reset_at < NOW() THEN NOW() + ($2 || ' seconds')::interval
             ELSE public.rate_limits.reset_at
           END
       RETURNING count, GREATEST(1, EXTRACT(EPOCH FROM (reset_at - NOW()))::int) AS retry_after;`,
      [key, String(windowSeconds)]
    );

    if (rows.length === 0) {
      // Fail closed
      return { success: false, remaining: 0, retryAfterSeconds: 60 };
    }

    const { count, retry_after } = rows[0];

    if (count > maxRequests) {
      return {
        success: false,
        remaining: 0,
        retryAfterSeconds: retry_after,
      };
    }

    return {
      success: true,
      remaining: Math.max(0, maxRequests - count),
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error("Critical rate limiting check failure:", err);
    // FAIL CLOSED: Block requests if security rate limiter storage fails
    return { success: false, remaining: 0, retryAfterSeconds: 60 };
  }
}

/**
 * Check if a key is currently locked out WITHOUT incrementing the counter.
 */
export async function peekRateLimitStatus(
  key: string,
  maxRequests = 5
): Promise<{ isLocked: boolean; retryAfterSeconds: number }> {
  try {
    const rows = await queryServerDb<{ count: number; retry_after: number }>(
      `SELECT count, GREATEST(1, EXTRACT(EPOCH FROM (reset_at - NOW()))::int) AS retry_after
       FROM public.rate_limits
       WHERE key = $1 AND reset_at > NOW();`,
      [key]
    );

    if (rows.length > 0 && rows[0].count >= maxRequests) {
      return { isLocked: true, retryAfterSeconds: rows[0].retry_after };
    }

    return { isLocked: false, retryAfterSeconds: 0 };
  } catch {
    return { isLocked: false, retryAfterSeconds: 0 };
  }
}

/**
 * Clear rate limit for a key (e.g. after successful admin login).
 */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await queryServerDb("DELETE FROM public.rate_limits WHERE key = $1;", [key]);
  } catch (err) {
    console.warn("Could not clear rate limit key:", err);
  }
}
