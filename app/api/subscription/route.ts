import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import { planService } from "@/lib/subscription/plan.service";
import { PLAN_CODES, SUBSCRIPTION_STATUS } from "@/lib/subscription/constants";

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 300,
  enterprise: 500,
};

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let subscription = await subscriptionService.getCurrentSubscription(user.companyId);

    // Auto-init if no subscription exists
    if (!subscription) {
      const trialEnabled =
        String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
        process.env.BILLING_TRIAL_ENABLED === "1";
      const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7");
      subscription = await subscriptionService.initializeCompanySubscription(user.companyId, {
        trialEnabled,
        trialDays: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7,
      });
    }

    const now = new Date();
    const trialEndsAt = subscription.trialEndsAt;
    const isTrialing = subscription.status === SUBSCRIPTION_STATUS.TRIALING;
    const trialDaysLeft = isTrialing && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;
    const trialExpired = isTrialing && trialEndsAt ? trialEndsAt < now : false;

    const planCode = subscription.plan?.code || PLAN_CODES.FREE;
    const features = subscription.plan?.features || [];

    const maxProjectsFeature = features.find((f: any) => f.featureCode === "max_projects");
    const maxUsersFeature = features.find((f: any) => f.featureCode === "max_users");
    const advancedAnalyticsFeature = features.find((f: any) => f.featureCode === "advanced_analytics");

    // Load all plans for the upgrade comparison
    await planService.ensureDefaultPlans();
    const allPlans = await db.plan.findMany({
      where: { isActive: true },
      include: { features: true },
      orderBy: { code: "asc" },
    });

    const plans = allPlans.map((p: any) => ({
      code: p.code,
      name: p.name,
      price: PLAN_PRICES[p.code] ?? 0,
      features: p.features || [],
      isCurrent: p.code === planCode,
    }));

    const [lastPayment, pendingPayment] = await Promise.all([
      db.planPayment.findFirst({
        where: { companyId: user.companyId, status: "completed" },
        orderBy: { paidAt: "desc" },
      }),
      db.planPayment.findFirst({
        where: { companyId: user.companyId, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planCode,
        planName: subscription.plan?.name || "Free",
        price: PLAN_PRICES[planCode] ?? 0,
        isTrialing,
        trialDaysLeft,
        trialExpired,
        trialEndsAt: trialEndsAt?.toISOString() || null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        features: {
          maxProjects: maxProjectsFeature?.limitValue ?? null,
          maxUsers: maxUsersFeature?.limitValue ?? null,
          advancedAnalytics: advancedAnalyticsFeature?.enabled ?? false,
        },
      },
      plans,
      lastPayment: lastPayment
        ? {
            planCode: lastPayment.planCode,
            cadence: lastPayment.cadence,
            amountMad: lastPayment.amountMad,
            method: lastPayment.method,
            paidAt: lastPayment.paidAt?.toISOString() || null,
          }
        : null,
      pendingPayment: pendingPayment
        ? {
            planCode: pendingPayment.planCode,
            cadence: pendingPayment.cadence,
            amountMad: pendingPayment.amountMad,
            method: pendingPayment.method,
            createdAt: pendingPayment.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { planCode } = body;

    const validCodes = Object.values(PLAN_CODES);
    if (!planCode || !validCodes.includes(planCode)) {
      return NextResponse.json({ error: "Invalid plan code" }, { status: 400 });
    }

    const updated = await subscriptionService.changePlan(user.companyId, planCode);

    return NextResponse.json({
      success: true,
      planCode: updated.plan?.code,
      planName: updated.plan?.name,
      status: updated.status,
    });
  } catch (error) {
    console.error("Subscription POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
