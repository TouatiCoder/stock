"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ReportRow = {
  project_id: string;
  project_name?: string;
  budget?: number | string;
  expenses?: number | string;
  actual?: number | string;
  variance?: number | string;
};

type ApiItemsResponse = { items?: ReportRow[]; error?: string };

const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatAmount = (value: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);

async function fetchJsonSafe(url: string): Promise<ApiItemsResponse> {
  const response = await fetch(url, { credentials: "include" });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiItemsResponse) : {};

  if (!response.ok) {
    return { items: [], error: payload?.error || `Request failed (${response.status})` };
  }

  return payload;
}

export default function ReportsPage() {
  const [projectSummary, setProjectSummary] = useState<ReportRow[]>([]);
  const [budgetActual, setBudgetActual] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectRes, budgetRes] = await Promise.all([
          fetchJsonSafe("/api/reports/project-summary"),
          fetchJsonSafe("/api/reports/budget-vs-actual"),
        ]);

        if (projectRes.error || budgetRes.error) {
          setError(projectRes.error || budgetRes.error || "Failed to load reports");
        }

        setProjectSummary(projectRes.items || []);
        setBudgetActual(budgetRes.items || []);
      } catch {
        setError("Failed to load reports");
        setProjectSummary([]);
        setBudgetActual([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summaryTotals = useMemo(() => {
    const totalBudget = projectSummary.reduce((acc, row) => acc + toNumber(row.budget), 0);
    const totalExpenses = projectSummary.reduce((acc, row) => acc + toNumber(row.expenses), 0);
    const totalActual = budgetActual.reduce((acc, row) => acc + toNumber(row.actual), 0);
    const totalVariance = budgetActual.reduce((acc, row) => acc + toNumber(row.variance), 0);
    return { totalBudget, totalExpenses, totalActual, totalVariance };
  }, [projectSummary, budgetActual]);

  const projectSummaryChart = useMemo(
    () =>
      projectSummary.map((row) => ({
        name: row.project_name || row.project_id.slice(0, 8),
        budget: toNumber(row.budget),
        expenses: toNumber(row.expenses),
      })),
    [projectSummary],
  );

  const budgetVsActualChart = useMemo(
    () =>
      budgetActual.map((row) => ({
        name: row.project_id.slice(0, 8),
        budget: toNumber(row.budget),
        actual: toNumber(row.actual),
        variance: toNumber(row.variance),
      })),
    [budgetActual],
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Rapports</h1>
        <p className="text-sm text-slate-500 mt-1">Vue analytique des budgets et des coûts projet.</p>
      </div>

      {loading && <div className="rounded-xl border bg-white p-4 text-sm">Chargement des rapports...</div>}
      {error && <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Budget total</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{formatAmount(summaryTotals.totalBudget)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dépenses (summary)</p>
              <p className="mt-2 text-xl font-semibold text-orange-600">{formatAmount(summaryTotals.totalExpenses)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dépenses réelles</p>
              <p className="mt-2 text-xl font-semibold text-red-600">{formatAmount(summaryTotals.totalActual)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Variance globale</p>
              <p className={`mt-2 text-xl font-semibold ${summaryTotals.totalVariance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatAmount(summaryTotals.totalVariance)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Budget vs dépenses par projet</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectSummaryChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Budget / réel / variance</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsActualChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="variance" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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
