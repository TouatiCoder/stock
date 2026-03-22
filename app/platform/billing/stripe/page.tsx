"use client";

import { useEffect, useMemo, useState } from "react";
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
  return (
    <div className="flex items-center justify-between text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        Previous
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default function StripeOperationsPage() {
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

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);
        const data = await getPlatformStripeOverview();
        setOverview(data);
      } catch (error: any) {
        setOverviewError(error.message || "Failed to load Stripe overview");
      } finally {
        setOverviewLoading(false);
      }
    };
    loadOverview();
  }, []);

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
        setSubsError(error.message || "Failed to load external subscriptions");
      } finally {
        setSubsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [subsPage, subsSearch]);

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
        setWebhooksError(error.message || "Failed to load webhook inbox");
      } finally {
        setWebhooksLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [webhooksPage, webhooksSearch, webhooksStatus]);

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
        setSessionsError(error.message || "Failed to load checkout sessions");
      } finally {
        setSessionsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [sessionsPage, sessionsSearch, sessionsStatus]);

  const overviewCards = useMemo(
    () => [
      { label: "Total customers", value: overview?.total_customers ?? "..." },
      { label: "External subscriptions", value: overview?.total_external_subscriptions ?? "..." },
      { label: "Dead-letter webhooks", value: overview?.dead_letter_count ?? "..." },
      { label: "Webhook failures (24h)", value: overview?.failed_webhooks_last_24h ?? "..." },
      {
        label: "Last webhook received",
        value: overview?.last_webhook_received_at
          ? new Date(overview.last_webhook_received_at).toLocaleString()
          : "-",
      },
      {
        label: "Last webhook processed",
        value: overview?.last_webhook_processed_at
          ? new Date(overview.last_webhook_processed_at).toLocaleString()
          : "-",
      },
    ],
    [overview],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Stripe Operations</h2>
        <p className="text-sm text-gray-600">Read-only operational visibility for Stripe billing pipeline.</p>
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
        title="External Subscriptions"
        loading={subsLoading}
        error={subsError}
        headers={["Company", "Customer ID", "Subscription ID", "Price ID", "Status", "Current period end", "Cancel at period end", "Last event"]}
        colSpan={8}
        controls={
          <input
            value={subsSearch}
            onChange={(e) => {
              setSubsPage(1);
              setSubsSearch(e.target.value);
            }}
            placeholder="Search company/customer/subscription"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        }
        footer={<Pager page={subs?.page || subsPage} totalPages={subs?.total_pages || 1} onPageChange={setSubsPage} />}
      >
        {(subs?.items || []).length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
              No external subscriptions found
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
                  {item.external_status}
                </span>
              </td>
              <td className="px-4 py-3">{item.current_period_end ? new Date(item.current_period_end).toLocaleString() : "-"}</td>
              <td className="px-4 py-3">{item.cancel_at_period_end ? "Yes" : "No"}</td>
              <td className="px-4 py-3">{item.last_event_created_at ? new Date(item.last_event_created_at).toLocaleString() : "-"}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>

      <StripeOpsTable
        title="Webhook Inbox"
        loading={webhooksLoading}
        error={webhooksError}
        headers={["Event ID", "Event type", "Status", "Attempt count", "Last error", "Received at"]}
        colSpan={6}
        controls={
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={webhooksSearch}
              onChange={(e) => {
                setWebhooksPage(1);
                setWebhooksSearch(e.target.value);
              }}
              placeholder="Search event id/type"
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
              <option value="all">All statuses</option>
              <option value="failed">Failed</option>
              <option value="dead_letter">Dead-letter</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
            </select>
          </div>
        }
        footer={
          <Pager
            page={webhooks?.page || webhooksPage}
            totalPages={webhooks?.total_pages || 1}
            onPageChange={setWebhooksPage}
          />
        }
      >
        {(webhooks?.items || []).length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
              No webhook events found
            </td>
          </tr>
        ) : (
          (webhooks?.items || []).map((item) => (
            <tr key={item.event_id} className="border-t border-gray-100">
              <td className="px-4 py-3 font-mono text-xs">{maskId(item.event_id)}</td>
              <td className="px-4 py-3">{item.event_type}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(item.processing_status)}`}>
                  {item.processing_status}
                </span>
              </td>
              <td className="px-4 py-3">{item.attempt_count}</td>
              <td className="max-w-[300px] truncate px-4 py-3" title={item.last_error || ""}>
                {item.last_error || "-"}
              </td>
              <td className="px-4 py-3">{new Date(item.received_at).toLocaleString()}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>

      <StripeOpsTable
        title="Checkout Sessions"
        loading={sessionsLoading}
        error={sessionsError}
        headers={["Company", "Plan", "Interval", "Status", "Created at", "Expires at"]}
        colSpan={6}
        controls={
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={sessionsSearch}
              onChange={(e) => {
                setSessionsPage(1);
                setSessionsSearch(e.target.value);
              }}
              placeholder="Search company/plan/interval"
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
              <option value="all">All statuses</option>
              <option value="created">Created</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        }
        footer={
          <Pager
            page={sessions?.page || sessionsPage}
            totalPages={sessions?.total_pages || 1}
            onPageChange={setSessionsPage}
          />
        }
      >
        {(sessions?.items || []).length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
              No checkout sessions found
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
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{item.expires_at ? new Date(item.expires_at).toLocaleString() : "-"}</td>
            </tr>
          ))
        )}
      </StripeOpsTable>
    </div>
  );
}
