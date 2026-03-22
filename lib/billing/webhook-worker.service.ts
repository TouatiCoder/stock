import type Stripe from "stripe";
import { logBilling } from "@/lib/billing/logger";
import { applyStripeEventToSubscription } from "@/lib/billing/orchestrator";
import { billingJobRunService } from "@/lib/billing/job-run.service";
import { billingWorkerMetricsCollector } from "@/lib/billing/metrics-collector.service";
import { billingSlackNotifier } from "@/lib/billing/slack-notifier.service";
import type { WorkerSummary } from "@/lib/billing/types";
import { stripeWebhookInboxService } from "@/lib/billing/webhook-inbox.service";

const parseMaxAttempts = () => {
  const parsed = Number(process.env.STRIPE_WEBHOOK_MAX_ATTEMPTS || "12");
  if (!Number.isFinite(parsed) || parsed < 1) return 12;
  return Math.floor(parsed);
};

const parseBatchSize = () => {
  const parsed = Number(process.env.STRIPE_WEBHOOK_BATCH_SIZE || "50");
  if (!Number.isFinite(parsed) || parsed < 1) return 50;
  return Math.min(500, Math.floor(parsed));
};

export class StripeWebhookWorkerService {
  async processPending(): Promise<WorkerSummary> {
    const startedAt = new Date();
    const batchSize = parseBatchSize();
    const maxAttempts = parseMaxAttempts();

    const pending = await stripeWebhookInboxService.fetchPendingBatch(batchSize);
    let claimed = 0;
    let processed = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const eventRow of pending) {
      const claimedEvent = await stripeWebhookInboxService.claimEvent(eventRow.id);
      if (!claimedEvent) continue;
      claimed += 1;

      try {
        const event = claimedEvent.payloadJson as unknown as Stripe.Event;
        const outcome = await applyStripeEventToSubscription(event);

        await stripeWebhookInboxService.markProcessed(claimedEvent.id);
        processed += 1;

        logBilling("info", "Stripe event processed", {
          correlation_id: `stripe_evt_${claimedEvent.eventId}`,
          eventId: claimedEvent.eventId,
          eventType: claimedEvent.eventType,
          companyId: outcome.companyId,
          transitioned: outcome.transitioned,
          skipped: outcome.skipped,
          reason: outcome.reason,
        });
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Unknown processing error";

        const result = await stripeWebhookInboxService.markFailed(
          claimedEvent.id,
          claimedEvent.attemptCount,
          maxAttempts,
          message,
        );

        if (result.deadLetter) {
          deadLettered += 1;
        }

        logBilling("error", "Stripe event processing failed", {
          correlation_id: `stripe_evt_${claimedEvent.eventId}`,
          eventId: claimedEvent.eventId,
          eventType: claimedEvent.eventType,
          attemptCount: claimedEvent.attemptCount,
          deadLetter: result.deadLetter,
          error: message,
        });

        if (claimedEvent.attemptCount >= 3 || result.deadLetter) {
          await billingSlackNotifier.notify("Billing webhook processing failure", {
            event_id: claimedEvent.eventId,
            event_type: claimedEvent.eventType,
            attempt_count: claimedEvent.attemptCount,
            dead_letter: result.deadLetter,
            error: message,
          });
        }
      }
    }

    const summary = {
      claimed,
      processed,
      failed,
      deadLettered,
    };

    await billingJobRunService.recordRun({
      jobName: "stripe_webhook_worker",
      startedAt,
      status: summary.failed > 0 || summary.deadLettered > 0 ? "failed" : "success",
      summary,
      errorMessage:
        summary.failed > 0 || summary.deadLettered > 0
          ? `failed=${summary.failed}, dead_lettered=${summary.deadLettered}`
          : undefined,
    });

    const currentMetrics = await billingWorkerMetricsCollector.collectWebhookMetrics();
    if (currentMetrics.dead_letter > 0) {
      await billingSlackNotifier.notify("Billing dead-letter webhooks detected", {
        dead_letter: currentMetrics.dead_letter,
        claimed: summary.claimed,
        processed: summary.processed,
        failed: summary.failed,
      });
    }

    return summary;
  }
}

export const stripeWebhookWorkerService = new StripeWebhookWorkerService();
