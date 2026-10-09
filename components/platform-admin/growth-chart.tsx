"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale, usePlatformTranslations } from "@/components/LocaleProvider";
import { getPlatformGrowth } from "@/lib/platform-admin/client";
import type { PlatformGrowthSeriesDto } from "@/lib/platform-admin/types";

const LOCALE_MAP = { ar: "ar-MA", en: "en-US", fr: "fr-FR" } as const;

/**
 * Monthly signups and the revenue actually collected, for the last 12 months.
 * Both series come from real rows (companies.created_at and paid platform
 * payments) - nothing here is projected.
 */
export function PlatformGrowthChart() {
  const t = usePlatformTranslations();
  const { locale, dir } = useLocale();
  const resolvedLocale = LOCALE_MAP[locale];

  const [series, setSeries] = useState<PlatformGrowthSeriesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlatformGrowth(12);
        if (active) setSeries(data);
      } catch (err: any) {
        if (active) setError(err?.message || t("growth.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [t]);

  const formatMonth = (month: string) => {
    const [year, monthPart] = month.split("-");
    const date = new Date(Date.UTC(Number(year), Number(monthPart) - 1, 1));
    return new Intl.DateTimeFormat(resolvedLocale, { month: "short", year: "2-digit", timeZone: "UTC" }).format(date);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: series?.currency || "MAD",
      maximumFractionDigits: 0,
    }).format(value);

  const points = (series?.points || []).map((point) => ({
    ...point,
    label: formatMonth(point.month),
  }));

  const hasData = points.some((point) => point.new_companies > 0 || point.collected_revenue > 0);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">{t("growth.title")}</h2>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : loading ? (
        <div className="mt-4 h-72 animate-pulse rounded-md bg-gray-100" aria-label={t("growth.loading")} />
      ) : !hasData ? (
        <p className="mt-4 text-sm text-gray-500">{t("growth.empty")}</p>
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} reversed={dir === "rtl"} />
              <YAxis
                yAxisId="companies"
                orientation={dir === "rtl" ? "right" : "left"}
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="revenue"
                orientation={dir === "rtl" ? "left" : "right"}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === t("growth.collectedRevenue") ? formatCurrency(Number(value)) : String(value),
                  String(name),
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="companies"
                dataKey="new_companies"
                name={t("growth.newCompanies")}
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Line
                yAxisId="companies"
                type="monotone"
                dataKey="total_companies"
                name={t("growth.totalCompanies")}
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="collected_revenue"
                name={t("growth.collectedRevenue")}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
