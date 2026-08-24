import { db } from "@/lib/db";
import { billingJobRunService } from "@/lib/billing/job-run.service";
import { logBilling } from "@/lib/billing/logger";
import { getStripeClient } from "@/lib/billing/stripe";
import { stripeEventOrchestrator } from "@/lib/billing/orchestrator";
import { billingSlackNotifier } from "@/lib/billing/slack-notifier.service";

export type ReconciliationSummary = {
  scanned: number;
  repaired: number;
  skipped: number;
  errors: Array<{ companyId: string; message: string }>;
};

export class StripeReconciliationService {
  async runDailyReconciliation(): Promise<ReconciliationSummary> {
    const startedAt = new Date();
    const stripe = await getStripeClient();
    const externalSubs = await db.billingExternalSubscription.findMany();

    let repaired = 0;
    let skipped = 0;
    const errors: Array<{ companyId: string; message: string }> = [];

    for (const external of externalSubs) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(external.stripeSubscriptionId);

        const driftDetected =
          external.status !== stripeSubscription.status ||
          external.stripePriceId !== (stripeSubscription.items.data[0]?.price?.id ?? null) ||
          (external.currentPeriodEnd?.getTime() ?? 0) !== (((stripeSubscription as any).current_period_end || 0) * 1000);

        if (!driftDetected) {
          skipped += 1;
          continue;
        }

        const outcome = await stripeEventOrchestrator.syncFromStripeSubscription({
          companyId: external.companyId,
          customerId: external.stripeCustomerId,
          subscription: stripeSubscription,
          eventId: `reconcile_${Date.now()}_${external.companyId}`,
          eventCreatedAt: new Date(),
          reason: "reconciliation_drift_repair",
        });

        if (!outcome.skipped) {
          repaired += 1;
        }
      } catch (error) {
        errors.push({
          companyId: external.companyId,
          message: error instanceof Error ? error.message : "Unknown reconciliation error",
        });
      }
    }

    const summary = {
      scanned: externalSubs.length,
      repaired,
      skipped,
      errors,
    };

    await billingJobRunService.recordRun({
      jobName: "stripe_reconciliation",
      startedAt,
      status: errors.length > 0 ? "failed" : "success",
      summary,
      errorMessage: errors.length > 0 ? `Errors: ${errors.length}` : undefined,
    });

    if (repaired > 0) {
      await billingSlackNotifier.notify("Billing reconciliation drift detected", {
        repaired,
        scanned: summary.scanned,
        skipped: summary.skipped,
        errors: summary.errors.length,
      });
    }

    logBilling("info", "Stripe reconciliation completed", summary);
    return summary;
  }
}

export const stripeReconciliationService = new StripeReconciliationService();
