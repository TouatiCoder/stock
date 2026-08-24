import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getStripeClient } from "@/lib/billing/stripe";
import { PLAN_MONTHLY_MAD, computeCadencePrice, isBillingCadence, isPaidPlanCode, type BillingCadence } from "@/lib/subscription/pricing";

const CADENCE_TO_STRIPE_RECURRING: Record<BillingCadence, { interval: "month" | "year"; interval_count: number }> = {
  monthly: { interval: "month", interval_count: 1 },
  quarterly: { interval: "month", interval_count: 3 },
  annual: { interval: "year", interval_count: 1 },
};

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const planCode = String(body.plan_code || "").toLowerCase();
    const cadence = String(body.cadence || "").toLowerCase();
    const idempotencyKey =
      String(body.idempotency_key || "").trim() ||
      req.headers.get("x-idempotency-key") ||
      randomUUID();

    if (!isPaidPlanCode(planCode)) {
      return NextResponse.json({ error: "Invalid plan_code" }, { status: 400 });
    }

    if (!isBillingCadence(cadence)) {
      return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
    }

    const company = await db.company.findUnique({ where: { id: user.companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const existingSession = await db.billingCheckoutSession.findFirst({
      where: {
        companyId: user.companyId,
        idempotencyKey,
        status: "created",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingSession) {
      return NextResponse.json({
        checkout_url: null,
        stripe_checkout_session_id: existingSession.stripeCheckoutSessionId,
        reused: true,
      });
    }

    const existingPending = await db.planPayment.findFirst({
      where: { companyId: user.companyId, status: "pending" },
    });
    if (existingPending) {
      return NextResponse.json({ error: "A payment request is already pending for this company" }, { status: 409 });
    }

    const { totalMad } = computeCadencePrice(PLAN_MONTHLY_MAD[planCode], cadence);

    const stripe = await getStripeClient();

    const account = await db.billingAccount.findUnique({ where: { companyId: user.companyId } });

    const customerId = account?.stripeCustomerId
      ? account.stripeCustomerId
      : (
          await stripe.customers.create({
            name: company.name,
            email: company.email || undefined,
            metadata: {
              company_id: company.id,
            },
          })
        ).id;

    await db.billingAccount.upsert({
      where: { companyId: user.companyId },
      update: {
        stripeCustomerId: customerId,
        defaultCurrency: "mad",
      },
      create: {
        companyId: user.companyId,
        stripeCustomerId: customerId,
        defaultCurrency: "mad",
        updatedAt: new Date(),
      },
    });

    const planPayment = await db.planPayment.create({
      data: {
        companyId: user.companyId,
        requestedById: user.id,
        planCode,
        cadence,
        amountMad: totalMad,
        method: "stripe",
        status: "pending",
        updatedAt: new Date(),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl =
      process.env.STRIPE_CHECKOUT_SUCCESS_URL || `${appUrl}/settings?tab=billing&payment=success`;
    const cancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL || `${appUrl}/settings?tab=billing&payment=cancelled`;

    const metadata = {
      company_id: user.companyId,
      plan_code: planCode,
      cadence,
      plan_payment_id: planPayment.id,
      idempotency_key: idempotencyKey,
    };

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "mad",
              unit_amount: totalMad * 100,
              recurring: CADENCE_TO_STRIPE_RECURRING[cadence],
              product_data: {
                name: `BuildStock Pro - ${planCode} (${cadence})`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          metadata,
        },
      },
      {
        idempotencyKey,
      },
    );

    await db.billingCheckoutSession.create({
      data: {
        companyId: user.companyId,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customerId,
        targetPlanCode: String(planCode),
        targetInterval: cadence,
        idempotencyKey,
        status: "created",
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
        updatedAt: new Date(),
      },
    });

    await db.planPayment.update({
      where: { id: planPayment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({
      checkout_url: session.url,
      stripe_checkout_session_id: session.id,
      reused: false,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
