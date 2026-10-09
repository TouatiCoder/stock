import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";
import { subscriptionService } from "@/lib/subscription/subscription.service";

/**
 * POST /api/admin/fix-subscription
 *
 * Recovery tool: creates the missing subscription row for a company that ended
 * up without one. Platform admins only - it used to accept any signed-in user,
 * which let anyone grant their own company a trial.
 *
 * Body: { companyId?: string } - defaults to the caller's own company.
 */
export async function POST(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error || !auth.user) return auth.error;

    const body = await req.json().catch(() => ({}));
    const requestedCompanyId = typeof body?.companyId === "string" ? body.companyId.trim() : "";
    const companyId = requestedCompanyId || auth.user.companyId;

    const company = await db.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const existing = await db.subscription.findFirst({
      where: { companyId },
    });

    if (existing) {
      return NextResponse.json({ message: "Subscription already exists", status: existing.status });
    }

    const trialEnabled =
      String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
      process.env.BILLING_TRIAL_ENABLED === "1";
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7");

    await subscriptionService.initializeCompanySubscription(companyId, {
      trialEnabled,
      trialDays: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7,
    });

    return NextResponse.json({ success: true, message: "Subscription initialized", companyId });
  } catch (error) {
    console.error("Fix subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
