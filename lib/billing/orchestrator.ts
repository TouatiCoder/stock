import type Stripe from "stripe";
import { db } from "@/lib/db";
import { logBilling } from "@/lib/billing/logger";
import { resolvePlanPriceMappingByPriceId } from "@/lib/billing/plan-mapper";
import { getStripeClient } from "@/lib/billing/stripe";
import type { OrchestratorOutcome } from "@/lib/billing/types";
import { PLAN_CODES, SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/lib/subscription/constants";
import { subscriptionTransitionService } from "@/lib/subscription/transition.service";

const SUPPORTED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "invoice.payment_failed",
  "invoice.paid",
  "customer.subscription.deleted",
]);

const mapStripeSubStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  if (status === "trialing") return SUBSCRIPTION_STATUS.TRIALING;
  if (status === "active") return SUBSCRIPTION_STATUS.ACTIVE;
  if (status === "past_due" || status === "unpaid") return SUBSCRIPTION_STATUS.PAST_DUE;
  if (status === "canceled" || status === "incomplete_expired") return SUBSCRIPTION_STATUS.FREE;
  return SUBSCRIPTION_STATUS.PAST_DUE;
};

const toDateFromUnix = (ts?: number | null) => (ts ? new Date(ts * 1000) : null);
const getCurrentPeriodEndUnix = (subscription: Stripe.Subscription) =>
  (subscription as any)?.current_period_end as number | null | undefined;
const getInvoiceSubscriptionId = (invoice: Stripe.Invoice) => {
  const value = (invoice as any)?.subscription;
  return typeof value === "string" ? value : null;
};

const getSubscriptionPriceId = (subscription: Stripe.Subscription): string | null => {
  const line = subscription.items.data[0];
  return line?.price?.id ?? null;
};

const getMetadataCompanyId = (obj: any): string | null => {
  const value = obj?.metadata?.company_id;
  return typeof value === "string" && value.length > 0 ? value : null;
};

type ExternalSyncInput = {
  companyId: string;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  stripeStatus: Stripe.Subscription.Status;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  eventId: string;
  eventCreatedAt: Date;
  reason: string;
};

export class StripeEventOrchestrator {
  async applyStripeEventToSubscription(event: Stripe.Event): Promise<OrchestratorOutcome> {
    if (!SUPPORTED_EVENTS.has(event.type)) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "unsupported_event",
      };
    }

    switch (event.type) {
      case "checkout.session.completed":
        return this.handleCheckoutCompleted(event);
      case "customer.subscription.created":
      case "customer.subscription.updated":
        return this.handleCustomerSubscriptionEvent(event);
      case "invoice.payment_failed":
        return this.handleInvoicePaymentFailed(event);
      case "invoice.paid":
        return this.handleInvoicePaid(event);
      case "customer.subscription.deleted":
        return this.handleCustomerSubscriptionDeleted(event);
      default:
        return {
          eventId: event.id,
          eventType: event.type,
          transitioned: false,
          skipped: true,
          reason: "unsupported_event",
        };
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event): Promise<OrchestratorOutcome> {
    const session = event.data.object as Stripe.Checkout.Session;
    const companyId = getMetadataCompanyId(session);
    const customerId = typeof session.customer === "string" ? session.customer : null;

    if (!companyId || !customerId) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "missing_company_or_customer",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.billingCheckoutSession.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: {
          status: "completed",
          stripeCustomerId: customerId,
        },
      });

      await tx.billingAccount.upsert({
        where: { companyId },
        update: {
          stripeCustomerId: customerId,
        },
        create: {
          companyId,
          stripeCustomerId: customerId,
          defaultCurrency: (session.currency || "usd").toLowerCase(),
          updatedAt: new Date(),
        },
      });
    });

    if (typeof session.subscription === "string") {
      const stripe = await getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const result = await this.syncFromStripeSubscription({
        companyId,
        customerId,
        subscription,
        eventId: event.id,
        eventCreatedAt: new Date(event.created * 1000),
        reason: "checkout_session_completed",
      });

      return {
        ...result,
        eventType: event.type,
      };
    }

    return {
      eventId: event.id,
      eventType: event.type,
      companyId,
      transitioned: false,
      skipped: false,
      reason: "checkout_linked",
    };
  }

  private async handleCustomerSubscriptionEvent(event: Stripe.Event): Promise<OrchestratorOutcome> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
    if (!customerId) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "missing_customer",
      };
    }

    const account = await db.billingAccount.findUnique({ where: { stripeCustomerId: customerId } });
    if (!account) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "billing_account_not_found",
      };
    }

    const result = await this.syncFromStripeSubscription({
      companyId: account.companyId,
      customerId,
      subscription,
      eventId: event.id,
      eventCreatedAt: new Date(event.created * 1000),
      reason: event.type === "customer.subscription.created" ? "stripe_subscription_created" : "stripe_subscription_updated",
    });

    return {
      ...result,
      eventType: event.type,
    };
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<OrchestratorOutcome> {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
    if (!customerId) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "missing_customer",
      };
    }

    const account = await db.billingAccount.findUnique({ where: { stripeCustomerId: customerId } });
    if (!account) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "billing_account_not_found",
      };
    }

    const subscriptionId = getInvoiceSubscriptionId(invoice);
    if (!subscriptionId) {
      return {
        eventId: event.id,
        eventType: event.type,
        companyId: account.companyId,
        transitioned: false,
        skipped: true,
        reason: "missing_subscription_id",
      };
    }

    const external = await db.billingExternalSubscription.findFirst({
      where: {
        companyId: account.companyId,
        stripeSubscriptionId: subscriptionId,
      },
    });

    if (external && this.isStaleEvent(external, event.id, new Date(event.created * 1000))) {
      return {
        eventId: event.id,
        eventType: event.type,
        companyId: account.companyId,
        transitioned: false,
        skipped: true,
        reason: "stale_event",
      };
    }

    const transition = await db.$transaction((tx) =>
      subscriptionTransitionService.transitionSubscription(
        account.companyId,
        SUBSCRIPTION_STATUS.PAST_DUE,
        "system",
        {
          eventId: event.id,
          correlationId: `stripe_evt_${event.id}`,
        },
        tx,
      ),
    );

    await db.billingExternalSubscription.upsert({
      where: { companyId: account.companyId },
      update: {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: "past_due",
        lastEventCreatedAt: new Date(event.created * 1000),
        lastEventId: event.id,
      },
      create: {
        companyId: account.companyId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: "past_due",
        lastEventCreatedAt: new Date(event.created * 1000),
        lastEventId: event.id,
        updatedAt: new Date(),
      },
    });

    return {
      eventId: event.id,
      eventType: event.type,
      companyId: account.companyId,
      transitioned: transition.changed,
      skipped: false,
      reason: "invoice_payment_failed",
    };
  }

  private async handleInvoicePaid(event: Stripe.Event): Promise<OrchestratorOutcome> {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
    const subscriptionId = getInvoiceSubscriptionId(invoice);

    if (!customerId || !subscriptionId) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "missing_customer_or_subscription",
      };
    }

    const account = await db.billingAccount.findUnique({ where: { stripeCustomerId: customerId } });
    if (!account) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "billing_account_not_found",
      };
    }

    const stripe = await getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const result = await this.syncFromStripeSubscription({
      companyId: account.companyId,
      customerId,
      subscription,
      eventId: event.id,
      eventCreatedAt: new Date(event.created * 1000),
      reason: "invoice_paid",
    });

    return {
      ...result,
      eventType: event.type,
    };
  }

  private async handleCustomerSubscriptionDeleted(event: Stripe.Event): Promise<OrchestratorOutcome> {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
    if (!customerId) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "missing_customer",
      };
    }

    const account = await db.billingAccount.findUnique({ where: { stripeCustomerId: customerId } });
    if (!account) {
      return {
        eventId: event.id,
        eventType: event.type,
        transitioned: false,
        skipped: true,
        reason: "billing_account_not_found",
      };
    }

    const transition = await db.$transaction((tx) =>
      subscriptionTransitionService.transitionSubscription(
        account.companyId,
        SUBSCRIPTION_STATUS.FREE,
        "system",
        {
          eventId: event.id,
          correlationId: `stripe_evt_${event.id}`,
        },
        tx,
      ),
    );

    await db.billingExternalSubscription.upsert({
      where: { companyId: account.companyId },
      update: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: getSubscriptionPriceId(subscription),
        status: "canceled",
        currentPeriodEnd: toDateFromUnix(getCurrentPeriodEndUnix(subscription)),
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        lastEventCreatedAt: new Date(event.created * 1000),
        lastEventId: event.id,
      },
      create: {
        companyId: account.companyId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: getSubscriptionPriceId(subscription),
        status: "canceled",
        currentPeriodEnd: toDateFromUnix(getCurrentPeriodEndUnix(subscription)),
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        lastEventCreatedAt: new Date(event.created * 1000),
        lastEventId: event.id,
        updatedAt: new Date(),
      },
    });

    return {
      eventId: event.id,
      eventType: event.type,
      companyId: account.companyId,
      transitioned: transition.changed,
      skipped: false,
      reason: "stripe_subscription_deleted",
    };
  }

  async syncFromStripeSubscription(input: {
    companyId: string;
    customerId: string;
    subscription: Stripe.Subscription;
    eventId: string;
    eventCreatedAt: Date;
    reason: string;
  }): Promise<OrchestratorOutcome> {
    const priceId = getSubscriptionPriceId(input.subscription);
    const internalStatus = mapStripeSubStatus(input.subscription.status);

    const existing = await db.billingExternalSubscription.findUnique({
      where: { companyId: input.companyId },
    });

    if (existing && this.isStaleEvent(existing, input.eventId, input.eventCreatedAt)) {
      return {
        eventId: input.eventId,
        eventType: "customer.subscription.updated",
        companyId: input.companyId,
        transitioned: false,
        skipped: true,
        reason: "stale_event",
      };
    }

    const planMapping = priceId ? await resolvePlanPriceMappingByPriceId(priceId) : null;
    const targetPlanCode = planMapping?.planCode;

    const requiresMappedPaidPlan =
      internalStatus === SUBSCRIPTION_STATUS.ACTIVE ||
      internalStatus === SUBSCRIPTION_STATUS.PAST_DUE ||
      internalStatus === SUBSCRIPTION_STATUS.TRIALING;

    if (requiresMappedPaidPlan && !targetPlanCode) {
      throw new Error(`No billing_plan_prices mapping found for price ${priceId || "unknown"}`);
    }

    const transition = await db.$transaction(async (tx) => {
      const tr = await subscriptionTransitionService.transitionSubscription(
        input.companyId,
        internalStatus,
        "system",
        {
          targetPlanCode,
          eventId: input.eventId,
          correlationId: `stripe_evt_${input.eventId}`,
        },
        tx,
      );

      await tx.billingExternalSubscription.upsert({
        where: { companyId: input.companyId },
        update: {
          stripeSubscriptionId: input.subscription.id,
          stripeCustomerId: input.customerId,
          stripePriceId: priceId,
          status: input.subscription.status,
          currentPeriodEnd: toDateFromUnix(getCurrentPeriodEndUnix(input.subscription)),
          cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
          lastEventCreatedAt: input.eventCreatedAt,
          lastEventId: input.eventId,
        },
        create: {
          companyId: input.companyId,
          stripeSubscriptionId: input.subscription.id,
          stripeCustomerId: input.customerId,
          stripePriceId: priceId,
          status: input.subscription.status,
          currentPeriodEnd: toDateFromUnix(getCurrentPeriodEndUnix(input.subscription)),
          cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
          lastEventCreatedAt: input.eventCreatedAt,
          lastEventId: input.eventId,
          updatedAt: new Date(),
        },
      });

      return tr;
    });

    logBilling("info", "Stripe subscription synchronized", {
      companyId: input.companyId,
      stripeSubscriptionId: input.subscription.id,
      stripeStatus: input.subscription.status,
      internalStatus,
      transitioned: transition.changed,
      reason: input.reason,
      eventId: input.eventId,
    });

    return {
      eventId: input.eventId,
      eventType: "customer.subscription.updated",
      companyId: input.companyId,
      transitioned: transition.changed,
      skipped: false,
      reason: input.reason,
    };
  }

  private isStaleEvent(
    snapshot: { lastEventCreatedAt: Date | null; lastEventId: string | null },
    eventId: string,
    eventCreatedAt: Date,
  ) {
    if (!snapshot.lastEventCreatedAt) return false;
    if (eventCreatedAt.getTime() < snapshot.lastEventCreatedAt.getTime()) return true;
    return eventCreatedAt.getTime() === snapshot.lastEventCreatedAt.getTime() && snapshot.lastEventId === eventId;
  }
}

export const stripeEventOrchestrator = new StripeEventOrchestrator();

export const applyStripeEventToSubscription = (event: Stripe.Event) =>
  stripeEventOrchestrator.applyStripeEventToSubscription(event);
