"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { dashboardCache } from "@/lib/cache"
import { AlertCircle } from "lucide-react"
import {
  useCommonTranslations,
  useProjectTranslations,
} from "@/components/LocaleProvider"

import dynamic from "next/dynamic"

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] bg-gray-100 animate-pulse rounded-lg" />
    ),
  }
)

const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] bg-gray-100 animate-pulse rounded-lg" />
    ),
  }
)

const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
)

const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
)

const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
)

const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
)

const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
)

const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
)

interface DashboardChartsProps {
  companyId: string
}

interface ChartData {
  id: string
  name: string
  budget: number
  actual: number
  difference: number
  consumption: number
  isOverBudget: boolean
}

export default function DashboardCharts({
  companyId,
}: DashboardChartsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tCommon = useCommonTranslations()
  const tProject = useProjectTranslations()

  useEffect(() => {
    if (!companyId) {
      setError(tCommon("noCompanySelected"))
      setLoading(false)
      return
    }

    const loadCharts = async () => {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = `chart-data-${companyId}`

        const cached = await dashboardCache.get<any[]>(cacheKey)

        if (cached && Array.isArray(cached)) {
          setChartData(
            cached.map((item) => ({
              id: String(item.id),
              name: String(item.name),
              budget: Number(item.budget) || 0,
              actual: Number(item.actual) || 0,
              difference: Number(item.difference) || 0,
              consumption: Number(item.consumption) || 0,
              isOverBudget: Boolean(item.isOverBudget),
            }))
          )

          setLoading(false)
          return
        }

        const res = await fetch("/api/projects?limit=8", {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error(tCommon("chartsLoadError"))
        }

        const json = await res.json()

        const projects = Array.isArray(json?.projects)
          ? json.projects
          : []

        const rows: ChartData[] = projects.map((project: any) => {
          const budget =
            project?.totalBudget == null
              ? 0
              : Number(project.totalBudget) || 0

          const actual =
            project?.currentCost == null
              ? 0
              : Number(project.currentCost) || 0

          const difference = budget - actual

          const consumption =
            budget > 0 ? (actual / budget) * 100 : 0

          return {
            id: String(project?.id || project?.name || Math.random()),
            name: String(
              project?.name || tProject("unnamedProject")
            ),
            budget,
            actual,
            difference,
            consumption,
            isOverBudget: difference < 0,
          }
        })

        setChartData(rows)

        await dashboardCache.set(cacheKey, rows)
      } catch (error: any) {
        console.error("Error loading dashboard charts:", error)

        setError(
          error?.message || tCommon("chartsLoadError")
        )

        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    void loadCharts()
  }, [companyId, tCommon, tProject])

  const formatCurrency = (value: number) => {
    return value.toLocaleString("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  /*
   * Préparation des données.
   *
   * On garde tous les projets.
   * On trie par coût réel décroissant pour que
   * les projets les plus importants apparaissent en premier.
   */
  const preparedData = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 8)
  }, [chartData])

  /*
   * Custom tooltip pour Budget / Réel.
   */
  const BudgetTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: any[]
  }) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const item = payload[0]?.payload as ChartData | undefined

    if (!item) {
      return null
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl min-w-[240px]">
        <p className="font-semibold text-gray-900 mb-3 break-words">
          {item.name}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              {tCommon("budgetLabel")}
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(item.budget)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              {tCommon("actualLabel")}
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(item.actual)}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-2 flex items-center justify-between gap-6">
            <span className="text-gray-500">
              {tCommon("varianceLabel")}
            </span>

            <span
              className={`font-bold ${
                item.isOverBudget
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {item.isOverBudget ? "-" : "+"}
              {formatCurrency(Math.abs(item.difference))}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              Consommation
            </span>

            <span
              className={`font-semibold ${
                item.isOverBudget
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {formatPercentage(item.consumption)}
            </span>
          </div>

          {item.isOverBudget && (
            <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              Dépassement du budget
            </div>
          )}
        </div>
      </div>
    )
  }

  /*
   * Custom tooltip pour le graphique Écart.
   */
  const VarianceTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: any[]
  }) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const item = payload[0]?.payload as ChartData | undefined

    if (!item) {
      return null
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl min-w-[240px]">
        <p className="font-semibold text-gray-900 mb-3 break-words">
          {item.name}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              Budget
            </span>
            <span className="font-semibold">
              {formatCurrency(item.budget)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              Coût réel
            </span>
            <span className="font-semibold">
              {formatCurrency(item.actual)}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between gap-6">
              <span className="text-gray-500">
                Écart
              </span>

              <span
                className={`font-bold ${
                  item.isOverBudget
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {item.isOverBudget ? "-" : "+"}
                {formatCurrency(Math.abs(item.difference))}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500">
              Consommation
            </span>

            <span className="font-semibold">
              {formatPercentage(item.consumption)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  /*
   * Custom label pour les projets.
   *
   * On limite uniquement le texte visuel.
   * Le nom complet reste disponible dans le tooltip.
   */
  const ProjectNameTick = ({
    x,
    y,
    payload,
  }: {
    x?: number
    y?: number
    payload?: { value?: string }
  }) => {
    const name = String(payload?.value || "")

    const shortName =
      name.length > 24
        ? `${name.substring(0, 24)}…`
        : name

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#374151"
        fontSize={12}
      >
        {shortName}
      </text>
    )
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tCommon("chartsBudgetVsActualTitle")}
            </h3>

            <div className="h-[340px] bg-gray-100 animate-pulse rounded-lg" />
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tCommon("performanceTitle")}
            </h3>

            <div className="h-[340px] bg-gray-100 animate-pulse rounded-lg" />
          </div>
        </Card>
      </div>
    )
  }

  /*
   * Error
   */
  if (error) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle size={20} />

              <h3 className="text-lg font-bold">
                {tCommon("loadingErrorTitle")}
              </h3>
            </div>

            <div className="min-h-[300px] flex items-center justify-center">
              <p className="text-gray-500 text-center">
                {error}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  /*
   * No data
   */
  if (preparedData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tCommon("chartsBudgetVsActualTitle")}
            </h3>

            <div className="h-[340px] flex flex-col items-center justify-center text-gray-500 text-center">
              <p className="mb-2">
                {tProject("noProjectFound")}
              </p>

              <p className="text-sm">
                {tProject("createFirstProjectHint")}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tCommon("varianceBudgetActualTitle")}
            </h3>

            <div className="h-[340px] flex items-center justify-center text-gray-500">
              {tCommon("noDataAvailable")}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* =========================================================
          BUDGET VS COÛT RÉEL
      ========================================================== */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {tCommon("chartsBudgetVsActualTitle")}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                Budget prévu vs coût réel par projet
              </p>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <BarChart
                data={preparedData}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 20,
                  left: 10,
                  bottom: 8,
                }}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) =>
                    `${Number(value) / 1000}k`
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  stroke="#374151"
                  fontSize={12}
                  tick={<ProjectNameTick />}
                  interval={0}
                />

                <Tooltip
                  content={<BudgetTooltip />}
                  cursor={{ fill: "#f9fafb" }}
                />

                <Legend />

                <Bar
                  dataKey="budget"
                  name={tCommon("budgetLabel")}
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />

                <Bar
                  dataKey="actual"
                  name={tCommon("actualLabel")}
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* =========================================================
          ÉCART BUDGET / RÉEL
      ========================================================== */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-900">
              {tCommon("varianceBudgetActualTitle")}
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Écart entre le budget prévu et le coût réel
            </p>
          </div>

          <div className="w-full overflow-hidden">
            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <BarChart
                data={preparedData}
                layout="vertical"
                margin={{
                  top: 8,
                  right: 20,
                  left: 10,
                  bottom: 8,
                }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#6b7280"
                  fontSize={11}
                  tickFormatter={(value) => {
                    const numericValue = Number(value)

                    if (Math.abs(numericValue) >= 1000) {
                      return `${Math.round(
                        numericValue / 1000
                      )}k`
                    }

                    return String(numericValue)
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  stroke="#374151"
                  fontSize={12}
                  tick={<ProjectNameTick />}
                  interval={0}
                />

                <Tooltip
                  content={<VarianceTooltip />}
                  cursor={{ fill: "#f9fafb" }}
                />

                <Bar
                  dataKey="difference"
                  name={tCommon("varianceLabel")}
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Légende métier */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2">
              <p className="text-xs font-semibold text-green-700">
                Écart positif
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Le projet est dans le budget.
              </p>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">
                Écart négatif
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Le coût réel dépasse le budget.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}