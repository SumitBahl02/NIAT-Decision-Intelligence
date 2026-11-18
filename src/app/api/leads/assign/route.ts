import { NextResponse } from "next/server";
import { queryServerDb } from "@/lib/db";
import { isUserAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const isAuth = await isUserAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Origin check
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }

    const { leadId, counsellorName = "Regional Admissions Desk" } = await request.json().catch(() => ({}));

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json({ error: "Valid leadId is required" }, { status: 400 });
    }

    await queryServerDb(
      `UPDATE public.leads 
       SET status = 'assigned', counsellor_assigned = $1 
       WHERE id = $2;`,
      [counsellorName.slice(0, 100), leadId]
    );

    return NextResponse.json({ success: true, leadId, counsellorName });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json(
      { error: "Failed to assign lead in database. Check server logs." },
      { status: 500 }
    );
  }
}
