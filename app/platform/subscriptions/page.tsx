"use client";

import { useEffect, useState } from "react";
import { SubscriptionOverview } from "@/components/platform-admin/subscription-overview";
import { getPlatformSubscriptionsOverview } from "@/lib/platform-admin/client";
import type { PlatformSubscriptionsOverviewDto } from "@/lib/platform-admin/types";

export default function PlatformSubscriptionsPage() {
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
        setError(err.message || "Failed to load subscriptions overview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Subscription Overview</h2>
        <p className="text-sm text-gray-600">Platform-wide subscription and payment health.</p>
      </div>
      <SubscriptionOverview data={data} loading={loading} error={error} />
    </div>
  );
}

