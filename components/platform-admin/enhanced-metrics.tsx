"use client";

import { useMemo } from "react";
import { usePlatformTranslations } from "@/components/LocaleProvider";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

type PlanDistribution = {
  free: number;
  pro: number;
  enterprise: number;
};

type SubscriptionTrend = {
  month: string;
  companies: number;
  revenue: number;
};

type Props = {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  trialCompanies: number;
  mrr: number;
  locale: Locale;
  planDistribution?: PlanDistribution;
  subscriptionTrend?: SubscriptionTrend[];
};

export function EnhancedPlatformMetrics({
  totalCompanies,
  activeCompanies,
  suspendedCompanies,
  trialCompanies,
  mrr,
  locale,
  planDistribution,
  subscriptionTrend,
}: Props) {
  const t = usePlatformTranslations();

  const growthRate = useMemo(() => {
    if (!subscriptionTrend || subscriptionTrend.length < 2) return 0;
    const last = subscriptionTrend[subscriptionTrend.length - 1];
    const prev = subscriptionTrend[subscriptionTrend.length - 2];
    if (prev.companies === 0) return 0;
    return Math.round(((last.companies - prev.companies) / prev.companies) * 100);
  }, [subscriptionTrend]);

  const formatMessage = (key: string, values: Record<string, string>) => {
    let message = t(key);
    Object.entries(values).forEach(([name, value]) => {
      message = message.replace(`{${name}}`, value);
    });
    return message;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString(locale === "fr" ? "fr-MA" : locale, {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{t("metrics.totalCompanies")}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{totalCompanies}</p>
                <div className="mt-2 flex items-center gap-1">
                  {growthRate > 0 ? (
                    <ArrowUpRight size={16} className="text-green-600" />
                  ) : growthRate < 0 ? (
                    <ArrowDownRight size={16} className="text-red-600" />
                  ) : null}
                  <span className={`text-xs font-medium ${growthRate > 0 ? "text-green-600" : growthRate < 0 ? "text-red-600" : "text-gray-500"}`}>
                    {formatMessage("metrics.growthThisMonth", { value: `${growthRate > 0 ? "+" : ""}${growthRate}` })}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-blue-100 p-3">
                <Building2 size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">{t("metrics.active")}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{activeCompanies}</p>
                <p className="mt-2 text-xs font-medium text-green-600">
                  {formatMessage("metrics.ofTotal", {
                    value: String(totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0),
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-3">
                <Activity size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-purple-700">{t("metrics.mrrEstimate")}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(mrr)}</p>
                <p className="mt-2 text-xs font-medium text-purple-600">{t("metrics.monthlyRecurringRevenue")}</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-orange-700">{t("metrics.onTrial")}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{trialCompanies}</p>
                <p className="mt-2 text-xs font-medium text-orange-600">
                  {formatMessage("metrics.conversionOpportunity", {
                    value: String(totalCompanies > 0 ? Math.round((trialCompanies / totalCompanies) * 100) : 0),
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-orange-100 p-3">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {planDistribution && (
          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">{t("metrics.planDistribution")}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t("metrics.freePlan")}</span>
                    <span className="text-sm font-bold text-gray-900">{formatMessage("metrics.companiesCount", { count: String(planDistribution.free) })}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${totalCompanies > 0 ? (planDistribution.free / totalCompanies) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t("metrics.proPlan")}</span>
                    <span className="text-sm font-bold text-gray-900">{formatMessage("metrics.companiesCount", { count: String(planDistribution.pro) })}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-green-500 transition-all"
                      style={{ width: `${totalCompanies > 0 ? (planDistribution.pro / totalCompanies) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t("metrics.enterprisePlan")}</span>
                    <span className="text-sm font-bold text-gray-900">{formatMessage("metrics.companiesCount", { count: String(planDistribution.enterprise) })}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-purple-500 transition-all"
                      style={{ width: `${totalCompanies > 0 ? (planDistribution.enterprise / totalCompanies) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {subscriptionTrend && subscriptionTrend.length > 0 && (
          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">{t("metrics.growthTrend")}</h3>
              </div>

              <div className="space-y-3">
                {subscriptionTrend.slice(-6).map((period, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="w-24 text-sm font-medium text-gray-600">{period.month}</span>
                    <div className="mx-4 flex-1">
                      <div className="h-2.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                          style={{ width: `${(period.companies / Math.max(...subscriptionTrend.map((trend) => trend.companies))) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-20 text-right text-sm font-bold text-gray-900">{period.companies}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">{t("metrics.platformHealth")}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("metrics.suspended")}</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{suspendedCompanies}</p>
              <p className="mt-1 text-xs text-gray-500">{t("metrics.companyCountLabel")}</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("metrics.activeRate")}</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0}%
              </p>
              <p className="mt-1 text-xs text-gray-500">{t("metrics.engagement")}</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("metrics.trialConversion")}</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {trialCompanies > 0 ? Math.round((trialCompanies / totalCompanies) * 100) : 0}%
              </p>
              <p className="mt-1 text-xs text-gray-500">{t("metrics.opportunity")}</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t("metrics.avgMrrPerCompany")}</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">{formatCurrency(activeCompanies > 0 ? mrr / activeCompanies : 0)}</p>
              <p className="mt-1 text-xs text-gray-500">{t("metrics.perCompany")}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
