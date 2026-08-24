"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Printer, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  convertToCSV,
  downloadCSV,
  generateFilename,
} from "@/lib/utils/export";

import { useReportsTranslations } from "@/components/LocaleProvider";

type ReportRow = {
  project_id: string;
  project_name?: string;
  budget?: number | string;
  expenses?: number | string;
  actual?: number | string;
  variance?: number | string;
};

type ApiItemsResponse = {
  items?: ReportRow[];
  error?: string;
};

/**
 * Convert any value to a safe number.
 */
const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);

  return Number.isFinite(n) ? n : 0;
};

/**
 * Format amount in Moroccan Dirham.
 *
 * Example:
 * 5000000 -> 5 000 000 MAD
 */
const formatAmount = (value: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Format values displayed on chart axis.
 *
 * Examples:
 * 5000000 -> 5.0M
 * 1500000 -> 1.5M
 * 500000 -> 500K
 * 25000 -> 25K
 */
const formatChartValue = (value: number): string => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "0";
  }

  const abs = Math.abs(n);

  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }

  return String(n);
};

/**
 * Prevent Excel from automatically converting
 * numbers into scientific notation/date formats.
 */
const toSpreadsheetNumber = (value: number): string => {
  const normalized = Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)));

  return `="${normalized}"`;
};

/**
 * Safe JSON fetch helper.
 */
async function fetchJsonSafe(url: string): Promise<ApiItemsResponse> {
  try {
    const response = await fetch(url, {
      credentials: "include",
    });

    const text = await response.text();

    let payload: ApiItemsResponse = {};

    if (text) {
      try {
        payload = JSON.parse(text) as ApiItemsResponse;
      } catch {
        payload = {
          error: "Invalid server response",
        };
      }
    }

    if (!response.ok) {
      return {
        items: [],
        error:
          payload?.error ||
          `Request failed (${response.status})`,
      };
    }

    return payload;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);

    return {
      items: [],
      error: "Network error",
    };
  }
}

export default function ReportsPage() {
  const t = useReportsTranslations();

  const [projectSummary, setProjectSummary] =
    useState<ReportRow[]>([]);

  const [budgetActual, setBudgetActual] =
    useState<ReportRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Print report.
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Export report to CSV.
   */
  const handleExportCSV = (
    data: ReportRow[],
    filename: string,
  ) => {
    if (!data || data.length === 0) {
      return;
    }

    try {
      const exportRows = data.map((row) => ({
        project_name: row.project_name || "",

        budget: toSpreadsheetNumber(
          toNumber(row.budget),
        ),

        expenses: toSpreadsheetNumber(
          toNumber(row.expenses),
        ),

        actual: toSpreadsheetNumber(
          toNumber(row.actual),
        ),

        variance: toSpreadsheetNumber(
          toNumber(row.variance),
        ),
      }));

      const csv = convertToCSV(exportRows, {
        headers: {
          project_name: t("csvProjectName"),
          budget: t("csvBudget"),
          expenses: t("csvExpenses"),
          actual: t("csvActual"),
          variance: t("csvVariance"),
        },

        excludeKeys: ["project_id"],
      });

      const generatedFilename =
        generateFilename(filename);

      downloadCSV(csv, generatedFilename);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  /**
   * Load reports.
   */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          projectRes,
          budgetRes,
        ] = await Promise.all([
          fetchJsonSafe(
            "/api/reports/project-summary",
          ),

          fetchJsonSafe(
            "/api/reports/budget-vs-actual",
          ),
        ]);

        if (
          projectRes.error ||
          budgetRes.error
        ) {
          setError(
            projectRes.error ||
              budgetRes.error ||
              t("loadError"),
          );
        }

        setProjectSummary(
          projectRes.items || [],
        );

        setBudgetActual(
          budgetRes.items || [],
        );
      } catch (error) {
        console.error(
          "Reports loading error:",
          error,
        );

        setError(t("loadError"));

        setProjectSummary([]);

        setBudgetActual([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t]);

  /**
   * Calculate global totals.
   */
  const summaryTotals = useMemo(() => {
    const totalBudget =
      projectSummary.reduce(
        (acc, row) =>
          acc + toNumber(row.budget),
        0,
      );

    const totalExpenses =
      projectSummary.reduce(
        (acc, row) =>
          acc + toNumber(row.expenses),
        0,
      );

    const totalActual =
      budgetActual.reduce(
        (acc, row) =>
          acc + toNumber(row.actual),
        0,
      );

    const totalVariance =
      budgetActual.reduce(
        (acc, row) =>
          acc + toNumber(row.variance),
        0,
      );

    return {
      totalBudget,
      totalExpenses,
      totalActual,
      totalVariance,
    };
  }, [
    projectSummary,
    budgetActual,
  ]);

  /**
   * First chart:
   * Budget vs Expenses.
   */
  const projectSummaryChart = useMemo(
    () =>
      projectSummary.map((row) => ({
        name:
          row.project_name ||
          row.project_id.slice(0, 8),

        budget: toNumber(row.budget),

        expenses: toNumber(row.expenses),
      })),
    [projectSummary],
  );

  /**
   * Second chart:
   * Budget vs Actual vs Variance.
   */
  const budgetVsActualChart = useMemo(
    () =>
      budgetActual.map((row) => ({
        name:
          row.project_name ||
          row.project_id.slice(0, 8),

        budget: toNumber(row.budget),

        actual: toNumber(row.actual),

        variance: toNumber(row.variance),
      })),
    [budgetActual],
  );

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Title */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">

          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("subtitle")}
          </p>

        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 print:hidden">

          {/* Print */}
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <Printer className="h-4 w-4" />

            {t("print")}
          </Button>

          {/* Export */}
          <Button
            onClick={() =>
              handleExportCSV(
                budgetActual,
                "rapport_budget",
              )
            }
            variant="outline"
            className="flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <Download className="h-4 w-4" />

            {t("exportCsv")}
          </Button>

        </div>
      </div>


      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
          {t("loading")}
        </div>
      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* =====================================================
          CONTENT
      ====================================================== */}

      {!loading && !error && (
        <>

          {/* =================================================
    SUMMARY CARDS
================================================== */}

<div className="w-full print:block">

  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

    {/* Total Budget */}
    <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      
      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("totalBudget")}
      </p>

      <p className="mt-2 break-words text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
        {formatAmount(summaryTotals.totalBudget)}
      </p>

    </div>


    {/* Total Expenses */}
    <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      
      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("totalExpenses")}
      </p>

      <p className="mt-2 break-words text-lg font-semibold leading-tight text-orange-600 sm:text-xl">
        {formatAmount(summaryTotals.totalExpenses)}
      </p>

    </div>


    {/* Actual Expenses */}
    <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      
      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("actualExpenses")}
      </p>

      <p className="mt-2 break-words text-lg font-semibold leading-tight text-red-600 sm:text-xl">
        {formatAmount(summaryTotals.totalActual)}
      </p>

    </div>


    {/* Global Variance */}
    <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      
      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
        {t("globalVariance")}
      </p>

      <p
        className={`mt-2 break-words text-lg font-semibold leading-tight sm:text-xl ${
          summaryTotals.totalVariance >= 0
            ? "text-emerald-600"
            : "text-rose-600"
        }`}
      >
        {formatAmount(summaryTotals.totalVariance)}
      </p>

    </div>

  </div>

</div>


          {/* =================================================
              CHARTS
          ================================================== */}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print:block">


            {/* =================================================
                CHART 1
                BUDGET VS EXPENSES
            ================================================== */}

            <div className="rounded-2xl border bg-white p-4 shadow-sm print:mb-6 print:break-inside-avoid sm:p-5">

              <h2 className="mb-4 text-base font-semibold text-slate-900">
                {t("budgetVsExpenses")}
              </h2>


              <div className="h-[360px] w-full sm:h-[420px]">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={projectSummaryChart}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 30,
                      left: 10,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />


                    {/* X AXIS */}
                    <XAxis
                      type="number"
                      tick={{
                        fontSize: 11,
                      }}
                      tickFormatter={(value) =>
                        formatChartValue(
                          Number(value),
                        )
                      }
                      tickMargin={8}
                    />


                    {/* PROJECT NAMES */}
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{
                        fontSize: 11,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />


                    {/* TOOLTIP */}
                    <Tooltip
                      formatter={(
                        value,
                        name,
                      ) => [
                        formatAmount(
                          Number(value),
                        ),

                        name === "budget"
                          ? t("csvBudget")
                          : t("csvExpenses"),
                      ]}
                      labelFormatter={(label) =>
                        `Projet : ${label}`
                      }
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow:
                          "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />


                    {/* LEGEND */}
                    <Legend
                      verticalAlign="top"
                      height={36}
                    />


                    {/* BUDGET */}
                    <Bar
                      dataKey="budget"
                      name={t("csvBudget")}
                      fill="#2563eb"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      barSize={18}
                    />


                    {/* EXPENSES */}
                    <Bar
                      dataKey="expenses"
                      name={t("csvExpenses")}
                      fill="#f97316"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      barSize={18}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* =================================================
                CHART 2
                BUDGET / ACTUAL / VARIANCE
            ================================================== */}

            <div className="rounded-2xl border bg-white p-4 shadow-sm print:break-inside-avoid sm:p-5">

              <h2 className="mb-4 text-base font-semibold text-slate-900">
                {t("budgetActualVariance")}
              </h2>


              <div className="h-[360px] w-full sm:h-[420px]">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={budgetVsActualChart}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 30,
                      left: 10,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />


                    {/* X AXIS */}
                    <XAxis
                      type="number"
                      tick={{
                        fontSize: 11,
                      }}
                      tickFormatter={(value) =>
                        formatChartValue(
                          Number(value),
                        )
                      }
                      tickMargin={8}
                    />


                    {/* PROJECT NAMES */}
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{
                        fontSize: 11,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />


                    {/* TOOLTIP */}
                    <Tooltip
                      formatter={(
                        value,
                        name,
                      ) => {

                        const labels: Record<
                          string,
                          string
                        > = {
                          actual: "Réel",
                          budget: "Budget",
                          variance: "Écart",
                        };

                        return [
                          formatAmount(
                            Number(value),
                          ),

                          labels[
                            String(name)
                          ] ||
                            String(name),
                        ];
                      }}
                      labelFormatter={(label) =>
                        `Projet : ${label}`
                      }
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow:
                          "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />


                    {/* LEGEND */}
                    <Legend
                      verticalAlign="top"
                      height={36}
                    />


                    {/* ACTUAL */}
                    <Bar
                      dataKey="actual"
                      name="Réel"
                      fill="#dc2626"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      barSize={14}
                    />


                    {/* BUDGET */}
                    <Bar
                      dataKey="budget"
                      name="Budget"
                      fill="#16a34a"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      barSize={14}
                    />


                    {/* VARIANCE */}
                    <Bar
                      dataKey="variance"
                      name="Écart"
                      fill="#7c3aed"
                      radius={[
                        0,
                        4,
                        4,
                        0,
                      ]}
                      barSize={14}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
}