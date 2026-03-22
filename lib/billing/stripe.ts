import Stripe from "stripe";
import { paymentProvidersService } from "@/lib/payment-providers/service";

const clientsByKey = new Map<string, Stripe>();

const resolveStripeRuntime = async () => {
  const dbConfig = await paymentProvidersService.getStripeRuntimeConfig().catch(() => null);

  const apiKey = dbConfig?.secretKey || process.env.STRIPE_SECRET_KEY || "";
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const webhookSecret = dbConfig?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";
  return { apiKey, webhookSecret };
};

export async function getStripeClient() {
  const runtime = await resolveStripeRuntime();
  const key = runtime.apiKey;
  const cached = clientsByKey.get(key);
  if (cached) return cached;

  const stripe = new Stripe(runtime.apiKey, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
  clientsByKey.set(key, stripe);
  return stripe;
}

export async function getStripeWebhookSecret() {
  const runtime = await resolveStripeRuntime();
  const secret = runtime.webhookSecret;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}
