import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logBilling } from "@/lib/billing/logger";

const RETRYABLE_STATUSES = ["pending", "failed"];

const getStripeObjectId = (event: Stripe.Event): string | null => {
  const obj = event.data?.object as any;
  if (obj && typeof obj.id === "string") return obj.id;
  return null;
};

const getCompanyIdFromMetadata = (event: Stripe.Event): string | null => {
  const obj = event.data?.object as any;
  const companyId = obj?.metadata?.company_id;
  return typeof companyId === "string" && companyId.length > 0 ? companyId : null;
};

export class StripeWebhookInboxService {
  async persistEvent(event: Stripe.Event) {
    const companyId = getCompanyIdFromMetadata(event);

    try {
      await db.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: String(event.type),
          stripeObjectId: getStripeObjectId(event),
          companyId: companyId ?? null,
          payloadJson: event as unknown as Prisma.InputJsonValue,
          processingStatus: "pending",
          attemptCount: 0,
          nextRetryAt: null,
          lastError: null,
          updatedAt: new Date(),
        },
      });
      return { duplicate: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        logBilling("info", "Duplicate stripe webhook ignored", { eventId: event.id });
        return { duplicate: true };
      }
      throw error;
    }
  }

  async fetchPendingBatch(limit: number) {
    return db.stripeWebhookEvent.findMany({
      where: {
        processingStatus: {
          in: RETRYABLE_STATUSES,
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      orderBy: [{ receivedAt: "asc" }],
      take: limit,
    });
  }

  async claimEvent(id: string) {
    const claimed = await db.stripeWebhookEvent.updateMany({
      where: {
        id,
        processingStatus: {
          in: RETRYABLE_STATUSES,
        },
      },
      data: {
        processingStatus: "processing",
        attemptCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    if (claimed.count === 0) return null;

    return db.stripeWebhookEvent.findUnique({ where: { id } });
  }

  async markProcessed(id: string) {
    await db.stripeWebhookEvent.update({
      where: { id },
      data: {
        processingStatus: "processed",
        processedAt: new Date(),
        nextRetryAt: null,
        lastError: null,
      },
    });
  }

  async markFailed(id: string, attemptCount: number, maxAttempts: number, message: string) {
    const deadLetter = attemptCount >= maxAttempts;
    const nextRetryAt = deadLetter ? null : new Date(Date.now() + this.getBackoffMs(attemptCount));

    await db.stripeWebhookEvent.update({
      where: { id },
      data: {
        processingStatus: deadLetter ? "dead_letter" : "failed",
        nextRetryAt,
        lastError: message.slice(0, 1000),
      },
    });

    return { deadLetter };
  }

  private getBackoffMs(attempt: number) {
    const base = Number(process.env.STRIPE_WEBHOOK_RETRY_BASE_MS || "60000");
    const cappedAttempt = Math.min(10, Math.max(1, attempt));
    return base * Math.pow(2, cappedAttempt - 1);
  }
}

export const stripeWebhookInboxService = new StripeWebhookInboxService();
