import type {
  PlatformStripeCheckoutSessionsListDto,
  PlatformStripeListQuery,
  PlatformStripeOverviewDto,
  PlatformStripeSubscriptionsListDto,
  PlatformStripeWebhooksListDto,
  PlatformCompaniesListDto,
  PlatformCompaniesQuery,
  PlatformDashboardDto,
  PlatformSubscriptionsOverviewDto,
  PlatformCompanyDetailDto,
  PlatformGrowthSeriesDto,
} from "@/lib/platform-admin/types";
import type { PaymentProviderDto, ProviderCode, ProviderMode } from "@/lib/payment-providers/types";

const BASE = "/api/v1/platform";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
}

export async function getPlatformDashboard(): Promise<PlatformDashboardDto> {
  return apiFetch<PlatformDashboardDto>("/dashboard");
}

export async function getPlatformCompanyDetail(companyId: string): Promise<PlatformCompanyDetailDto> {
  return apiFetch<PlatformCompanyDetailDto>(`/companies/${encodeURIComponent(companyId)}`);
}

export async function getPlatformGrowth(months = 12): Promise<PlatformGrowthSeriesDto> {
  return apiFetch<PlatformGrowthSeriesDto>(`/growth?months=${months}`);
}

/**
 * URL of the CSV export for the filters currently applied to the table. The
 * column headers travel with the request so the file matches the UI language.
 */
export function buildCompaniesExportUrl(
  query: PlatformCompaniesQuery,
  headers: Record<"name" | "id" | "status" | "subscription" | "trial" | "payment" | "created", string>,
): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  params.set("h_name", headers.name);
  params.set("h_id", headers.id);
  params.set("h_status", headers.status);
  params.set("h_subscription", headers.subscription);
  params.set("h_trial", headers.trial);
  params.set("h_payment", headers.payment);
  params.set("h_created", headers.created);
  return `${BASE}/companies/export?${params.toString()}`;
}

export async function getPlatformCompanies(query: PlatformCompaniesQuery): Promise<PlatformCompaniesListDto> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  return apiFetch<PlatformCompaniesListDto>(`/companies?${params.toString()}`);
}

export async function suspendPlatformCompany(companyId: string, reason: string): Promise<void> {
  await apiFetch(`/companies/${companyId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function activatePlatformCompany(companyId: string): Promise<void> {
  await apiFetch(`/companies/${companyId}/activate`, { method: "PATCH" });
}

export async function getPlatformSubscriptionsOverview(): Promise<PlatformSubscriptionsOverviewDto> {
  return apiFetch<PlatformSubscriptionsOverviewDto>("/subscriptions");
}

async function billingApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/platform/billing${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
}

export async function getPlatformStripeOverview(): Promise<PlatformStripeOverviewDto> {
  return billingApiFetch<PlatformStripeOverviewDto>("/stripe-overview");
}

export async function getPlatformStripeSubscriptions(query: PlatformStripeListQuery): Promise<PlatformStripeSubscriptionsListDto> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  if (query.search) params.set("search", query.search);
  return billingApiFetch<PlatformStripeSubscriptionsListDto>(`/stripe-subscriptions?${params.toString()}`);
}

export async function getPlatformStripeWebhooks(query: PlatformStripeListQuery): Promise<PlatformStripeWebhooksListDto> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "all") params.set("status", query.status);
  return billingApiFetch<PlatformStripeWebhooksListDto>(`/webhooks?${params.toString()}`);
}

export async function getPlatformStripeCheckoutSessions(
  query: PlatformStripeListQuery,
): Promise<PlatformStripeCheckoutSessionsListDto> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "all") params.set("status", query.status);
  return billingApiFetch<PlatformStripeCheckoutSessionsListDto>(`/checkout-sessions?${params.toString()}`);
}

export type ManualPlanPaymentDto = {
  id: string;
  companyId: string;
  planCode: string;
  cadence: string;
  amountMad: number;
  method: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  rejectedReason: string | null;
  company: { id: string; name: string };
  requestedBy: { id: string; firstName: string; lastName: string; email: string };
  confirmedBy: { id: string; firstName: string; lastName: string } | null;
};

export async function getManualPayments(status?: string): Promise<{ items: ManualPlanPaymentDto[] }> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  return billingApiFetch<{ items: ManualPlanPaymentDto[] }>(`/manual-payments${params}`);
}

export async function confirmManualPayment(id: string): Promise<{ success: boolean }> {
  return billingApiFetch<{ success: boolean }>(`/manual-payments/${id}/confirm`, { method: "POST" });
}

export async function rejectManualPayment(id: string, reason: string): Promise<{ success: boolean }> {
  return billingApiFetch<{ success: boolean }>(`/manual-payments/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getPaymentProviders(): Promise<{ items: PaymentProviderDto[] }> {
  const response = await fetch("/api/platform/payment-providers", { credentials: "include" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as { items: PaymentProviderDto[] };
}

export async function updatePaymentProvider(input: {
  provider: ProviderCode;
  is_enabled: boolean;
  mode: ProviderMode;
  config: Record<string, string>;
}): Promise<PaymentProviderDto> {
  const response = await fetch(`/api/platform/payment-providers/${input.provider}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as PaymentProviderDto;
}

export async function testPaypalConnection(): Promise<{ success: boolean; mode: string }> {
  const response = await fetch("/api/platform/payment-providers/paypal/test", {
    method: "GET",
    credentials: "include",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as { success: boolean; mode: string };
}

export type PlatformAccessSettingsDto = {
  require_active_subscription: boolean;
  updated_at?: string;
};

export async function getPlatformAccessSettings(): Promise<PlatformAccessSettingsDto> {
  const response = await fetch("/api/platform/settings/access", {
    method: "GET",
    credentials: "include",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as PlatformAccessSettingsDto;
}

export async function updatePlatformAccessSettings(input: {
  require_active_subscription: boolean;
  confirm: boolean;
}): Promise<PlatformAccessSettingsDto> {
  const response = await fetch("/api/platform/settings/access", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as PlatformAccessSettingsDto;
}
