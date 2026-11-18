import { NextResponse } from "next/server";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  peekRateLimitStatus,
  checkPersistentRateLimit,
  clearRateLimit,
} from "@/lib/rateLimit";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || expectedPassword.trim().length === 0) {
      console.error("ADMIN_PASSWORD environment variable is not configured.");
      return NextResponse.json(
        { error: "Server authentication configuration error. ADMIN_PASSWORD is not set." },
        { status: 500 }
      );
    }

    // 1. Origin / Referer validation for CSRF defense
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin header." }, { status: 403 });
      }
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const lockoutKey = `login_failed_attempts:${ip}`;

    // 2. Check if IP is currently locked out WITHOUT incrementing on valid logins
    const status = await peekRateLimitStatus(lockoutKey, 5);
    if (status.isLocked) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. IP temporarily locked out for ${Math.ceil(
            status.retryAfterSeconds / 60
          )} minute(s).`,
        },
        { status: 429, headers: { "Retry-After": String(status.retryAfterSeconds) } }
      );
    }

    const { password } = await request.json().catch(() => ({ password: "" }));

    // 3. Timing-safe password comparison
    const passwordBuffer = Buffer.from(password || "");
    const expectedBuffer = Buffer.from(expectedPassword);

    const isMatch =
      passwordBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, expectedBuffer);

    if (!isMatch) {
      // ONLY increment rate limit counter when the attempt actually FAILS
      const rateCheck = await checkPersistentRateLimit(lockoutKey, 5, 900); // 15 mins window
      const remaining = Math.max(0, rateCheck.remaining);

      if (!rateCheck.success) {
        return NextResponse.json(
          {
            error: `Maximum attempts exceeded. IP temporarily locked out for ${Math.ceil(
              rateCheck.retryAfterSeconds / 60
            )} minute(s).`,
          },
          { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSeconds) } }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid credentials. (${remaining} attempt(s) remaining before temporary lockout)`,
        },
        { status: 401 }
      );
    }

    // 4. Successful login: Clear failed attempts for this IP immediately
    await clearRateLimit(lockoutKey);

    const sessionToken = createSessionToken();
    const response = NextResponse.json({ success: true, message: "Authenticated successfully" });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Auth login fatal error:", error);
    return NextResponse.json({ error: "Authentication system error" }, { status: 500 });
  }
}
