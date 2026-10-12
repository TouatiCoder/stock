import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { db } from "@/lib/db";
import { subscriptionService } from "@/lib/subscription/subscription.service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("auth-token")?.value;
    if (!tokenCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(tokenCookie);
    if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await db.subscription.findFirst({
      where: { companyId: user.companyId },
    });

    if (existing) {
      return NextResponse.json({ message: "Subscription already exists", status: existing.status });
    }

    const trialEnabled =
      String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
      process.env.BILLING_TRIAL_ENABLED === "1";
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7");

    await subscriptionService.initializeCompanySubscription(user.companyId, {
      trialEnabled,
      trialDays: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7,
    });

    return NextResponse.json({ success: true, message: "Subscription initialized" });
  } catch (error) {
    console.error("Fix subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
