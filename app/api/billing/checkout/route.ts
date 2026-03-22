import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getStripeClient } from "@/lib/billing/stripe";
import { resolvePlanPriceMapping } from "@/lib/billing/plan-mapper";
import { PLAN_CODES, type PlanCode } from "@/lib/subscription/constants";
import type { BillingInterval } from "@/lib/billing/types";

const ALLOWED_INTERVALS: BillingInterval[] = ["month", "year"];

const isPlanCode = (value: string): value is PlanCode => {
  return Object.values(PLAN_CODES).includes(value as PlanCode);
};

const isInterval = (value: string): value is BillingInterval => {
  return ALLOWED_INTERVALS.includes(value as BillingInterval);
};

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const planCode = String(body.plan_code || "").toLowerCase();
    const interval = String(body.interval || "").toLowerCase();
    const idempotencyKey =
      String(body.idempotency_key || "").trim() ||
      req.headers.get("x-idempotency-key") ||
      randomUUID();

    if (!isPlanCode(planCode)) {
      return NextResponse.json({ error: "Invalid plan_code" }, { status: 400 });
    }

    if (!isInterval(interval)) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    if (planCode === PLAN_CODES.FREE) {
      return NextResponse.json({ error: "Free plan does not require checkout" }, { status: 400 });
    }

    const company = await db.company.findUnique({ where: { id: user.companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const currency = (company.currency || "usd").toLowerCase();
    const mapping = await resolvePlanPriceMapping(planCode, interval, currency);

    if (!mapping) {
      return NextResponse.json({ error: "No active Stripe price mapping for selected plan" }, { status: 404 });
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
        defaultCurrency: currency,
      },
      create: {
        companyId: user.companyId,
        stripeCustomerId: customerId,
        defaultCurrency: currency,
        updatedAt: new Date(),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = process.env.STRIPE_CHECKOUT_SUCCESS_URL || `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL || `${appUrl}/billing/cancel`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: mapping.stripePriceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          company_id: user.companyId,
          plan_code: planCode,
          interval,
          idempotency_key: idempotencyKey,
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
        targetInterval: interval,
        idempotencyKey,
        status: "created",
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
        updatedAt: new Date(),
      },
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
