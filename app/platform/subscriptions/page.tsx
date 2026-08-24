"use client";

import { useEffect, useState } from "react";
import { usePlatformTranslations } from "@/components/LocaleProvider";
import { SubscriptionOverview } from "@/components/platform-admin/subscription-overview";
import { getPlatformSubscriptionsOverview } from "@/lib/platform-admin/client";
import type { PlatformSubscriptionsOverviewDto } from "@/lib/platform-admin/types";

export default function PlatformSubscriptionsPage() {
  const t = usePlatformTranslations();
  const [data, setData] = useState<PlatformSubscriptionsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPlatformSubscriptionsOverview();
        setData(response);
      } catch (err: any) {
        setError(err.message || t("subscriptions.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t("subscriptions.title")}</h2>
        <p className="text-sm text-gray-600">{t("subscriptions.subtitle")}</p>
      </div>
      <SubscriptionOverview data={data} loading={loading} error={error} />
    </div>
  );
}
