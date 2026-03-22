"use client";

import type { PlatformSubscriptionsOverviewDto } from "@/lib/platform-admin/types";

export function SubscriptionOverview({
  data,
  loading,
  error,
}: {
  data: PlatformSubscriptionsOverviewDto | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading subscriptions...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">No data available</div>;
  }

  const cards = [
    { label: "Total subscriptions", value: data.total_subscriptions },
    { label: "Active", value: data.active_subscriptions },
    { label: "Trialing", value: data.trialing_subscriptions },
    { label: "Past due", value: data.past_due_subscriptions },
    { label: "Canceled", value: data.canceled_subscriptions },
    { label: "Failed payments", value: data.failed_payments_count },
    { label: "MRR", value: `${data.monthly_recurring_revenue.toLocaleString()} MAD` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

