import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { paymentProvidersService } from "@/lib/payment-providers/service";
import { PLAN_MONTHLY_MAD, computeCadencePrice, isBillingCadence, isPaidPlanCode } from "@/lib/subscription/pricing";

const MANUAL_METHODS = new Set(["cash", "paypal"]);

export async function POST(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const planCode = String(body?.planCode || "").toLowerCase();
  const cadence = String(body?.cadence || "").toLowerCase();
  const method = String(body?.method || "").toLowerCase();

  if (!isPaidPlanCode(planCode)) {
    return NextResponse.json({ error: "Invalid planCode" }, { status: 400 });
  }
  if (!isBillingCadence(cadence)) {
    return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
  }
  if (!MANUAL_METHODS.has(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const providers = await paymentProvidersService.listProviders();
  const provider = providers.find((p) => p.provider_code === method);
  if (!provider?.is_enabled) {
    return NextResponse.json({ error: "Payment method is not enabled" }, { status: 400 });
  }

  const { totalMad } = computeCadencePrice(PLAN_MONTHLY_MAD[planCode], cadence);

  const existingPending = await db.planPayment.findFirst({
    where: { companyId: user.companyId, status: "pending" },
  });
  if (existingPending) {
    return NextResponse.json({ error: "A payment request is already pending for this company" }, { status: 409 });
  }

  const created = await db.planPayment.create({
    data: {
      companyId: user.companyId,
      requestedById: user.id,
      planCode,
      cadence,
      amountMad: totalMad,
      method,
      status: "pending",
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
