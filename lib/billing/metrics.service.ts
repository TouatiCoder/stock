import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { billingJobRunService } from "@/lib/billing/job-run.service";
import { billingWorkerMetricsCollector } from "@/lib/billing/metrics-collector.service";
import type { BillingMetricsDto } from "@/lib/billing/metrics.types";

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type CoreCountsRow = {
  active_subscriptions: bigint | number;
  past_due_count: bigint | number;
  grace_period_count: bigint | number;
};

type WebhookRow = {
  dead_letter_webhooks: bigint | number;
  webhook_failures_last_24h: bigint | number;
};

type MrrRow = {
  total_mrr_cents: Prisma.Decimal | number | null;
};

export class BillingMetricsService {
  async getPlatformMetrics(): Promise<BillingMetricsDto> {
    const graceDaysRaw = Number(process.env.GRACE_PERIOD_DAYS || "0");
    const graceDays = Number.isFinite(graceDaysRaw) && graceDaysRaw >= 0 ? Math.floor(graceDaysRaw) : 0;

    const [countsRows, webhookRows, mrrRows, webhookMonitoring, lastReconciliation] = await Promise.all([
      db.$queryRaw<CoreCountsRow[]>(Prisma.sql`
        SELECT
          SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
          SUM(CASE WHEN s.status = 'past_due' THEN 1 ELSE 0 END) AS past_due_count,
          SUM(
            CASE
              WHEN s.status = 'past_due'
                AND s.current_period_end IS NOT NULL
                AND DATE_ADD(s.current_period_end, INTERVAL ${graceDays} DAY) > UTC_TIMESTAMP()
              THEN 1
              ELSE 0
            END
          ) AS grace_period_count
        FROM subscriptions s
      `),
      db.$queryRaw<WebhookRow[]>(Prisma.sql`
        SELECT
          SUM(CASE WHEN processing_status = 'dead_letter' THEN 1 ELSE 0 END) AS dead_letter_webhooks,
          SUM(
            CASE
              WHEN processing_status IN ('failed', 'dead_letter')
                AND updated_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)
              THEN 1
              ELSE 0
            END
          ) AS webhook_failures_last_24h
        FROM stripe_webhook_events
      `),
      db.$queryRaw<MrrRow[]>(Prisma.sql`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN p.billing_interval = 'year' THEN p.unit_amount_cents / 12.0
                ELSE p.unit_amount_cents
              END
            ),
            0
          ) AS total_mrr_cents
        FROM billing_subscriptions_external e
        JOIN billing_plan_prices p ON p.stripe_price_id = e.stripe_price_id AND p.is_active = 1
        WHERE e.status = 'active'
      `),
      billingWorkerMetricsCollector.collectWebhookMetrics(),
      billingJobRunService.getLastSuccessfulRun("stripe_reconciliation"),
    ]);

    const counts = countsRows[0];
    const webhook = webhookRows[0];
    const mrr = mrrRows[0];

    return {
      total_mrr: Number((toNumber(mrr?.total_mrr_cents) / 100).toFixed(2)),
      active_subscriptions: toNumber(counts?.active_subscriptions),
      past_due_count: toNumber(counts?.past_due_count),
      grace_period_count: toNumber(counts?.grace_period_count),
      dead_letter_webhooks: toNumber(webhook?.dead_letter_webhooks),
      webhook_failures_last_24h: toNumber(webhook?.webhook_failures_last_24h),
      last_reconciliation_at: lastReconciliation?.finishedAt?.toISOString() || null,
      webhook_monitoring: webhookMonitoring,
    };
  }
}

export const billingMetricsService = new BillingMetricsService();
