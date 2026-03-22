import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { WebhookMonitoringDto } from "@/lib/billing/metrics.types";

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type CountRow = {
  pending_count: bigint | number;
  failed_count: bigint | number;
  dead_letter_count: bigint | number;
};

type AvgRow = {
  avg_processing_ms: Prisma.Decimal | number | null;
  retried_processed_count: bigint | number;
  processed_count: bigint | number;
};

export class BillingWorkerMetricsCollector {
  async collectWebhookMetrics(): Promise<WebhookMonitoringDto> {
    const [countRows, avgRows] = await Promise.all([
      db.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT
          SUM(CASE WHEN processing_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
          SUM(CASE WHEN processing_status = 'dead_letter' THEN 1 ELSE 0 END) AS dead_letter_count
        FROM stripe_webhook_events
      `),
      db.$queryRaw<AvgRow[]>(Prisma.sql`
        SELECT
          AVG(TIMESTAMPDIFF(MICROSECOND, received_at, processed_at) / 1000.0) AS avg_processing_ms,
          SUM(CASE WHEN processing_status = 'processed' AND attempt_count > 1 THEN 1 ELSE 0 END) AS retried_processed_count,
          SUM(CASE WHEN processing_status = 'processed' THEN 1 ELSE 0 END) AS processed_count
        FROM stripe_webhook_events
        WHERE processed_at IS NOT NULL
          AND processed_at >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR)
      `),
    ]);

    const counts = countRows[0];
    const avg = avgRows[0];
    const processedCount = toNumber(avg?.processed_count);
    const retriedProcessedCount = toNumber(avg?.retried_processed_count);

    return {
      pending: toNumber(counts?.pending_count),
      failed: toNumber(counts?.failed_count),
      dead_letter: toNumber(counts?.dead_letter_count),
      avg_processing_time_ms: Math.round(toNumber(avg?.avg_processing_ms)),
      retry_rate: processedCount > 0 ? Number((retriedProcessedCount / processedCount).toFixed(4)) : 0,
    };
  }
}

export const billingWorkerMetricsCollector = new BillingWorkerMetricsCollector();
