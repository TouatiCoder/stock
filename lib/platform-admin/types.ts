export type CompanyStatusFilter = "all" | "active" | "suspended" | "trialing";

export type PaymentStatus = "paid" | "failed" | "pending" | "none";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "none";

export interface PlatformDashboardDto {
  total_companies: number;
  active_companies: number;
  suspended_companies: number;
  companies_on_trial: number;
  monthly_revenue_estimate: number;
  failed_payments_count: number;
}

export interface PlatformCompanyListItemDto {
  id: string;
  name: string;
  status: "active" | "suspended";
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  last_payment_status: PaymentStatus;
  created_at: string;
}

export interface PlatformCompaniesListDto {
  items: PlatformCompanyListItemDto[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PlatformSubscriptionsOverviewDto {
  total_subscriptions: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  past_due_subscriptions: number;
  canceled_subscriptions: number;
  monthly_recurring_revenue: number;
  failed_payments_count: number;
}

export interface PlatformCompaniesQuery {
  page?: number;
  page_size?: number;
  search?: string;
  status?: CompanyStatusFilter;
}

export interface PlatformStripeOverviewDto {
  total_customers: number;
  total_external_subscriptions: number;
  dead_letter_count: number;
  failed_webhooks_last_24h: number;
  last_webhook_received_at: string | null;
  last_webhook_processed_at: string | null;
}

export interface PlatformPaginationDto {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PlatformStripeSubscriptionItemDto {
  company_name: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  external_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_event_created_at: string | null;
}

export interface PlatformStripeSubscriptionsListDto extends PlatformPaginationDto {
  items: PlatformStripeSubscriptionItemDto[];
}

export type StripeWebhookStatusFilter = "all" | "pending" | "failed" | "dead_letter" | "processed";

export interface PlatformStripeWebhookItemDto {
  event_id: string;
  event_type: string;
  processing_status: string;
  attempt_count: number;
  last_error: string | null;
  received_at: string;
}

export interface PlatformStripeWebhooksListDto extends PlatformPaginationDto {
  items: PlatformStripeWebhookItemDto[];
}

export type StripeCheckoutStatusFilter = "all" | "created" | "completed" | "expired";

export interface PlatformStripeCheckoutSessionItemDto {
  company_name: string;
  target_plan_code: string;
  interval: string;
  status: string;
  created_at: string;
  expires_at: string | null;
}

export interface PlatformStripeCheckoutSessionsListDto extends PlatformPaginationDto {
  items: PlatformStripeCheckoutSessionItemDto[];
}

export interface PlatformStripeListQuery {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}
