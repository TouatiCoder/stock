import { NextResponse } from "next/server";
import { evaluateRequireActiveSubscription } from "@/lib/platform-access/guard";

const INTERNAL_KEY = process.env.INTERNAL_PLATFORM_ACCESS_KEY || "local-platform-access-key";

export async function POST(req: Request) {
  try {
    const key = req.headers.get("x-platform-access-key") || "";
    if (key !== INTERNAL_KEY) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const companyId = typeof body?.companyId === "string" ? body.companyId : null;
    const isPlatformAdmin = Boolean(body?.isPlatformAdmin);

    const decision = await evaluateRequireActiveSubscription({
      companyId,
      isPlatformAdmin,
    });

    return NextResponse.json(decision);
  } catch (error) {
    console.error("Internal platform access check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}