import type Stripe from "stripe";

export type BillingInterval = "month" | "year";

export type StripeWebhookProcessingStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed"
  | "dead_letter";

export type StripeRelevantEventType =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "invoice.payment_failed"
  | "invoice.paid"
  | "customer.subscription.deleted";

export type StripeEventEnvelope = {
  id: string;
  type: StripeRelevantEventType | string;
  created: number;
  data: Stripe.Event.Data;
};

export type OrchestratorOutcome = {
  eventId: string;
  eventType: string;
  companyId?: string;
  transitioned: boolean;
  skipped: boolean;
  reason: string;
};

export type WorkerSummary = {
  claimed: number;
  processed: number;
  failed: number;
  deadLettered: number;
};
