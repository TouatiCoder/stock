import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePlatformAdminWithRateLimit } from "@/lib/platform-admin/admin-guard";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import { isPaidPlanCode, isBillingCadence, CADENCE_PERIOD_DAYS } from "@/lib/subscription/pricing";
import { SUBSCRIPTION_STATUS } from "@/lib/subscription/constants";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdminWithRateLimit(req, "platform_manual_payments_confirm");
  if (auth.error || !auth.user) return auth.error;

  const payment = await db.planPayment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment request is not pending" }, { status: 400 });
  }
  if (!isPaidPlanCode(payment.planCode) || !isBillingCadence(payment.cadence)) {
    return NextResponse.json({ error: "Invalid payment request data" }, { status: 400 });
  }

  const planCode = payment.planCode;
  const periodDays = CADENCE_PERIOD_DAYS[payment.cadence];

  await db.$transaction(async (tx) => {
    await subscriptionService.changePlan(payment.companyId, planCode, SUBSCRIPTION_STATUS.ACTIVE, tx, periodDays);

    await tx.planPayment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        confirmedById: auth.user!.id,
        paidAt: new Date(),
      },
    });
  });

  return NextResponse.json({ success: true });
}
