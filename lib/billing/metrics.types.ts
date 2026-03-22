export interface WebhookMonitoringDto {
  pending: number;
  failed: number;
  dead_letter: number;
  avg_processing_time_ms: number;
  retry_rate: number;
}

export interface BillingMetricsDto {
  total_mrr: number;
  active_subscriptions: number;
  past_due_count: number;
  grace_period_count: number;
  dead_letter_webhooks: number;
  webhook_failures_last_24h: number;
  last_reconciliation_at: string | null;
  webhook_monitoring: WebhookMonitoringDto;
}
