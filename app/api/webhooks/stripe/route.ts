import { NextResponse } from "next/server";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { stripeWebhookInboxService } from "@/lib/billing/webhook-inbox.service";
import { logBilling } from "@/lib/billing/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await req.text();

  try {
    const stripe = await getStripeClient();
    const webhookSecret = await getStripeWebhookSecret();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const persistResult = await stripeWebhookInboxService.persistEvent(event);

    return NextResponse.json({ received: true, duplicate: persistResult.duplicate }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    logBilling("error", "Stripe webhook ingestion failed", { error: message });
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
