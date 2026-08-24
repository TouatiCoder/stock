"use client";

import { useEffect, useState } from "react";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import { StripeOpsTable } from "@/components/platform-admin/stripe-ops-table";
import {
  getPlatformStripeCheckoutSessions,
  getPlatformStripeOverview,
  getPlatformStripeSubscriptions,
  getPlatformStripeWebhooks,
} from "@/lib/platform-admin/client";
import type {
  PlatformStripeCheckoutSessionsListDto,
  PlatformStripeOverviewDto,
  PlatformStripeSubscriptionsListDto,
  PlatformStripeWebhooksListDto,
  StripeCheckoutStatusFilter,
  StripeWebhookStatusFilter,
} from "@/lib/platform-admin/types";

const maskId = (value: string | null | undefined) => {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const statusBadgeClass = (status: string) => {
  if (status === "active" || status === "processed" || status === "completed") {
    return "bg-green-100 text-green-700";
  }
  if (status === "failed" || status === "dead_letter" || status === "past_due") {
    return "bg-red-100 text-red-700";
  }
  if (status === "pending" || status === "created" || status === "trialing") {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-gray-100 text-gray-700";
};

function Pager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const t = usePlatformTranslations();

  return (
    <div className="flex items-center justify-between text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        {t("stripe.pagination.previous")}
      </button>
      <span>{t("stripe.pagination.pageOf").replace("{page}", String(page)).replace("{total}", String(totalPages))}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        {t("stripe.pagination.next")}
      </button>
    </div>
  );
}

export default function StripeOperationsPage() {
  const t = usePlatformTranslations();
  const { locale } = useLocale();
  const [overview, setOverview] = useState<PlatformStripeOverviewDto | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [subs, setSubs] = useState<PlatformStripeSubscriptionsListDto | null>(null);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subsPage, setSubsPage] = useState(1);
  const [subsSearch, setSubsSearch] = useState("");

  const [webhooks, setWebhooks] = useState<PlatformStripeWebhooksListDto | null>(null);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [webhooksError, setWebhooksError] = useState<string | null>(null);
  const [webhooksPage, setWebhooksPage] = useState(1);
  const [webhooksSearch, setWebhooksSearch] = useState("");
  const [webhooksStatus, setWebhooksStatus] = useState<StripeWebhookStatusFilter>("all");

  const [sessions, setSessions] = useState<PlatformStripeCheckoutSessionsListDto | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsSearch, setSessionsSearch] = useState("");
  const [sessionsStatus, setSessionsStatus] = useState<StripeCheckoutStatusFilter>("all");

  const formatDateTime = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString(locale) : t("shared.notAvailable");

  const translateStatus = (value: string) => {
    const key = `status.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);
        const data = await getPlatformStripeOverview();
        setOverview(data);
      } catch (error: any) {
        setOverviewError(error.message || t("stripe.errors.loadOverview"));
      } finally {
        setOverviewLoading(false);
      }
    };
    loadOverview();
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setSubsLoading(true);
        setSubsError(null);
        const data = await getPlatformStripeSubscriptions({
          page: subsPage,
          page_size: 20,
          search: subsSearch,
        });
        setSubs(data);
      } catch (error: any) {
        setSubsError(error.message || t("stripe.errors.loadExternalSubscriptions"));
      } finally {
        setSubsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [subsPage, subsSearch, t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setWebhooksLoading(true);
        setWebhooksError(null);
        const data = await getPlatformStripeWebhooks({
          page: webhooksPage,
          page_size: 20,
          search: webhooksSearch,
          status: webhooksStatus,
        });
        setWebhooks(data);
      } catch (error: any) {
        setWebhooksError(error.message || t("stripe.errors.loadWebhookInbox"));
      } finally {
        setWebhooksLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [webhooksPage, webhooksSearch, webhooksStatus, t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const data = await getPlatformStripeCheckoutSessions({
          page: sessionsPage,
          page_size: 20,
          search: sessionsSearch,
          status: sessionsStatus,
        });
        setSessions(data);
      } catch (error: any) {
        setSessionsError(error.message || t("stripe.errors.loadCheckoutSessions"));
      } finally {
        setSessionsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [sessionsPage, sessionsSearch, sessionsStatus, t]);

  const overviewCards = [
    { label: t("stripe.overview.totalCustomers"), value: overview?.total_customers ?? "..." },
    { label: t("stripe.overview.externalSubscriptions"), value: overview?.total_external_subscriptions ?? "..." },
    { label: t("stripe.overview.deadLetterWebhooks"), value: overview?.dead_letter_count ?? "..." },
    { label: t("stripe.overview.webhookFailures24h"), value: overview?.failed_webhooks_last_24h ?? "..." },
    { label: t("stripe.overview.lastWebhookReceived"), value: formatDateTime(overview?.last_webhook_received_at) },
    { label: t("stripe.overview.lastWebhookProcessed"), value: formatDateTime(overview?.last_webhook_processed_at) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t("stripe.title")}</h2>
        <p className="text-sm text-gray-600">{t("stripe.subtitle")}</p>
      </div>

      {overviewError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{overviewError}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{overviewLoading ? "..." : card.value}</p>
          </div>
        ))}
      </div>

      <StripeOpsTable
        title={t("stripe.tables.externalSubscriptions.title")}
        loading={subsLoading}
        error={subsError}
        headers={[
          t("stripe.tables.externalSubscriptions.headers.company"),
          t("stripe.tables.externalSubscriptions.headers.customerId"),
          t("stripe.tables.externalSubscriptions.headers.subscriptionId"),
          t("stripe.tables.externalSubscriptions.headers.priceId"),
          t("stripe.tables.externalSubscriptions.headers.status"),
          t("stripe.tables.externalSubscriptions.headers.currentPeriodEnd"),
          t("stripe.tables.externalSubscriptions.headers.cancelAtPeriodEnd"),
          t("stripe.tables.externalSubscriptions.headers.lastEvent"),
        ]}
        colSpan={8}
        emptyLabel={t("stripe.tables.externalSubscriptions.empty")}
        controls={
          <input
            value={subsSearch}
            onChange={(e) => {
              setSubsPage(1);
              setSubsSearch(e.target.value);
            }}
            placeholder={t("stripe.tables.externalSubscriptions.searchPlaceholder")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        }
        footer={<Pager page={subs?.page || subsPage} totalPages={subs?.total_pages || 1} onPageChange={setSubsPage} />}
      >
        {(subs?.items || []).length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
              {t("stripe.tables.externalSubscriptions.empty")}
            </td>
          </tr>
        ) : (
          (subs?.items || []).map((item) => (
            <tr key={`${item.stripe_subscription_id}-${item.company_name}`} className="border-t border-gray-100">
              <td className="px-4 py-3">{item.company_name}</td>
              <td className="px-4 py-3 font-mono text-xs">{maskId(item.stripe_customer_id)}</td>
              <td className="px-4 py-3 font-mono text-xs">{maskId(item.stripe_subscription_id)}</td>
              <td className="px-4 py-3 font-mono text-xs">{maskId(item.stripe_price_id)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.external_status)}`}>
                  {translateStatus(item.external_status)}
                </span>
              </td>
              <td className="px-4 py-3">{formatDateTime(item.current_period_end)}</td>
              <td className="px-4 py-3">{item.cancel_at_period_end ? t("shared.yes") : t("shared.no")}</td>
              <td className="px-4 py-3">{formatDateTime(item.last_event_created_at)}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>

      <StripeOpsTable
        title={t("stripe.tables.webhooks.title")}
        loading={webhooksLoading}
        error={webhooksError}
        headers={[
          t("stripe.tables.webhooks.headers.eventId"),
          t("stripe.tables.webhooks.headers.eventType"),
          t("stripe.tables.webhooks.headers.status"),
          t("stripe.tables.webhooks.headers.attemptCount"),
          t("stripe.tables.webhooks.headers.lastError"),
          t("stripe.tables.webhooks.headers.receivedAt"),
        ]}
        colSpan={6}
        emptyLabel={t("stripe.tables.webhooks.empty")}
        controls={
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={webhooksSearch}
              onChange={(e) => {
                setWebhooksPage(1);
                setWebhooksSearch(e.target.value);
              }}
              placeholder={t("stripe.tables.webhooks.searchPlaceholder")}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={webhooksStatus}
              onChange={(e) => {
                setWebhooksPage(1);
                setWebhooksStatus(e.target.value as StripeWebhookStatusFilter);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">{t("stripe.filters.allStatuses")}</option>
              <option value="failed">{translateStatus("failed")}</option>
              <option value="dead_letter">{translateStatus("dead_letter")}</option>
              <option value="pending">{translateStatus("pending")}</option>
              <option value="processed">{translateStatus("processed")}</option>
            </select>
          </div>
        }
        footer={<Pager page={webhooks?.page || webhooksPage} totalPages={webhooks?.total_pages || 1} onPageChange={setWebhooksPage} />}
      >
        {(webhooks?.items || []).length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
              {t("stripe.tables.webhooks.empty")}
            </td>
          </tr>
        ) : (
          (webhooks?.items || []).map((item) => (
            <tr key={item.event_id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-mono text-xs">{maskId(item.event_id)}</td>
              <td className="px-4 py-3">{item.event_type}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.processing_status)}`}>
                  {translateStatus(item.processing_status)}
                </span>
              </td>
              <td className="px-4 py-3">{item.attempt_count}</td>
              <td className="max-w-[300px] truncate px-4 py-3" title={item.last_error || ""}>
                {item.last_error || t("shared.notAvailable")}
              </td>
              <td className="px-4 py-3">{formatDateTime(item.received_at)}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>

      <StripeOpsTable
        title={t("stripe.tables.checkoutSessions.title")}
        loading={sessionsLoading}
        error={sessionsError}
        headers={[
          t("stripe.tables.checkoutSessions.headers.company"),
          t("stripe.tables.checkoutSessions.headers.plan"),
          t("stripe.tables.checkoutSessions.headers.interval"),
          t("stripe.tables.checkoutSessions.headers.status"),
          t("stripe.tables.checkoutSessions.headers.createdAt"),
          t("stripe.tables.checkoutSessions.headers.expiresAt"),
        ]}
        colSpan={6}
        emptyLabel={t("stripe.tables.checkoutSessions.empty")}
        controls={
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={sessionsSearch}
              onChange={(e) => {
                setSessionsPage(1);
                setSessionsSearch(e.target.value);
              }}
              placeholder={t("stripe.tables.checkoutSessions.searchPlaceholder")}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={sessionsStatus}
              onChange={(e) => {
                setSessionsPage(1);
                setSessionsStatus(e.target.value as StripeCheckoutStatusFilter);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">{t("stripe.filters.allStatuses")}</option>
              <option value="created">{translateStatus("created")}</option>
              <option value="completed">{translateStatus("completed")}</option>
              <option value="expired">{translateStatus("expired")}</option>
            </select>
          </div>
        }
        footer={<Pager page={sessions?.page || sessionsPage} totalPages={sessions?.total_pages || 1} onPageChange={setSessionsPage} />}
      >
        {(sessions?.items || []).length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
              {t("stripe.tables.checkoutSessions.empty")}
            </td>
          </tr>
        ) : (
          (sessions?.items || []).map((item, index) => (
            <tr key={`${item.company_name}-${item.created_at}-${index}`} className="border-t border-gray-100">
              <td className="px-4 py-3">{item.company_name}</td>
              <td className="px-4 py-3">{item.target_plan_code}</td>
              <td className="px-4 py-3">{item.interval}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                  {translateStatus(item.status)}
                </span>
              </td>
              <td className="px-4 py-3">{formatDateTime(item.created_at)}</td>
              <td className="px-4 py-3">{formatDateTime(item.expires_at)}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>
    </div>
  );
}
