import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { randomUUID } from "crypto";

/**
 * POST /api/platform/companies/[id]/plan
 * Change company subscription plan (Super Admin only)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify super admin
    const user = await checkAuth();
    if (!user || !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planCode, reason } = body;

    // Validate plan code
    const validPlans = ["free", "pro", "enterprise"];
    if (!planCode || !validPlans.includes(planCode.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid plan code. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await db.company.findUnique({
      where: { id: params.id },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get or create subscription
    const existingSubscription = await db.subscription.findFirst({
      where: { companyId: params.id },
    });

    const now = new Date();
    
    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: planCode.toLowerCase(),
          status: "active",
          updatedAt: now,
          ...(planCode.toLowerCase() !== "free" && {
            currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          }),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          subscription: updatedSubscription,
          message: `Company plan changed to ${planCode.toUpperCase()}`,
        },
      });
    } else {
      // Create new subscription
      const newSubscription = await db.subscription.create({
        data: {
          id: randomUUID(),
          companyId: params.id,
          planId: planCode.toLowerCase(),
          status: "active",
          currentPeriodEnd: planCode.toLowerCase() !== "free" 
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null,
          updatedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          subscription: newSubscription,
          message: `Subscription created with plan ${planCode.toUpperCase()}`,
        },
      });
    }

  } catch (error) {
    console.error("Platform change plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
