"use client";

import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
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
  const t = usePlatformTranslations();
  const { locale } = useLocale();

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{t("subscriptionOverview.loading")}</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{t("subscriptionOverview.empty")}</div>;
  }

  const cards = [
    { label: t("subscriptionOverview.cards.totalSubscriptions"), value: data.total_subscriptions },
    { label: t("subscriptionOverview.cards.active"), value: data.active_subscriptions },
    { label: t("subscriptionOverview.cards.trialing"), value: data.trialing_subscriptions },
    { label: t("subscriptionOverview.cards.pastDue"), value: data.past_due_subscriptions },
    { label: t("subscriptionOverview.cards.canceled"), value: data.canceled_subscriptions },
    { label: t("subscriptionOverview.cards.failedPayments"), value: data.failed_payments_count },
    {
      label: t("subscriptionOverview.cards.mrr"),
      value: data.monthly_recurring_revenue.toLocaleString(locale === "fr" ? "fr-MA" : locale, {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 0,
      }),
    },
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
