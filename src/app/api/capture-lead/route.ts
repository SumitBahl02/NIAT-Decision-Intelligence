import { NextResponse } from "next/server";
import { recordLeadServer } from "@/lib/leads";
import { checkPersistentRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateResult = await checkPersistentRateLimit(`capture_lead:${ip}`, 15, 60);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: "Too many inquiries from this connection. Please wait a minute." },
        { status: 429, headers: { "Retry-After": String(rateResult.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await recordLeadServer(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to process lead" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Capture lead API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
