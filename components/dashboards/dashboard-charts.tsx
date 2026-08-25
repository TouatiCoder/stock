"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { dashboardCache } from "@/lib/cache"
import { AlertCircle } from "lucide-react"
import { useCommonTranslations, useProjectTranslations } from "@/components/LocaleProvider"
import dynamic from "next/dynamic"

const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => <div className="h-[380px] bg-gray-100 animate-pulse rounded-lg" />,
})
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
  loading: () => <div className="h-[380px] bg-gray-100 animate-pulse rounded-lg" />,
})
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false })

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

function ProjectNameTick({ x, y, payload }: any) {
  const name = String(payload?.value || "")
  const words = name.split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > 22 && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }

  if (current) lines.push(current)
  const visibleLines = lines.slice(0, 2)
  if (lines.length > 2) visibleLines[1] = `${visibleLines[1].slice(0, 19)}…`

  return (
    <text x={x} y={y} textAnchor="end" fill="#374151" fontSize={12}>
      {visibleLines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 15}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

export default function DashboardCharts({ companyId }: DashboardChartsProps) {
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
        const cached = await dashboardCache.get<ChartData[]>(cacheKey)

        if (cached && Array.isArray(cached)) {
          setChartData(cached)
          setLoading(false)
          return
        }

        const res = await fetch("/api/projects?limit=8", { cache: "no-store" })
        if (!res.ok) throw new Error(tCommon("chartsLoadError"))

        const json = await res.json()
        const projects = Array.isArray(json?.projects) ? json.projects : []

        const rows: ChartData[] = projects.map((project: any) => {
          const budget = project?.totalBudget == null ? 0 : Number(project.totalBudget) || 0
          const actual = project?.currentCost == null ? 0 : Number(project.currentCost) || 0
          const difference = budget - actual

          return {
            id: String(project?.id || project?.name || ""),
            name: String(project?.name || tProject("unnamedProject")),
            budget,
            actual,
            difference,
            consumption: budget > 0 ? (actual / budget) * 100 : 0,
            isOverBudget: difference < 0,
          }
        })

        setChartData(rows)
        await dashboardCache.set(cacheKey, rows)
      } catch (error: any) {
        console.error("Error loading dashboard charts:", error)
        setError(error?.message || tCommon("chartsLoadError"))
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    void loadCharts()
  }, [companyId, tCommon, tProject])

  const formatCurrency = (value: number) =>
    value.toLocaleString("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

  const preparedData = useMemo(
    () => [...chartData].sort((a, b) => b.budget - a.budget).slice(0, 8),
    [chartData],
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[tCommon("chartsBudgetVsActualTitle"), tCommon("performanceTitle")].map((title) => (
          <Card key={title}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
              <div className="h-[380px] bg-gray-100 animate-pulse rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle size={20} />
              <h3 className="text-lg font-bold">{tCommon("loadingErrorTitle")}</h3>
            </div>
            <div className="min-h-[300px] flex items-center justify-center">
              <p className="text-gray-500 text-center">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (preparedData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("chartsBudgetVsActualTitle")}</h3>
            <div className="h-[380px] flex flex-col items-center justify-center text-gray-500 text-center">
              <p className="mb-2">{tProject("noProjectFound")}</p>
              <p className="text-sm">{tProject("createFirstProjectHint")}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("varianceBudgetActualTitle")}</h3>
            <div className="h-[380px] flex items-center justify-center text-gray-500">
              {tCommon("noDataAvailable")}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {tCommon("chartsBudgetVsActualTitle")}
          </h3>
          <p className="text-xs text-gray-500 mb-5">Budget prévu vs coût réel par projet</p>

          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={preparedData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                stroke="#6b7280"
                fontSize={11}
                tickFormatter={(value) => `${Number(value) / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={175}
                stroke="#374151"
                tick={<ProjectNameTick />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                labelFormatter={(label) => `Projet : ${label}`}
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value)),
                  name === "budget" ? tCommon("budgetLabel") : tCommon("actualLabel"),
                ]}
              />
              <Legend />
              <Bar dataKey="budget" fill="#1e40af" name={tCommon("budgetLabel")} radius={[0, 5, 5, 0]} />
              <Bar dataKey="actual" fill="#ef4444" name={tCommon("actualLabel")} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {tCommon("varianceBudgetActualTitle")}
          </h3>
          <p className="text-xs text-gray-500 mb-5">Écart entre budget et coût réel</p>

          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={preparedData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                stroke="#6b7280"
                fontSize={11}
                tickFormatter={(value) => `${Number(value) / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={175}
                stroke="#374151"
                tick={<ProjectNameTick />}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                labelFormatter={(label) => `Projet : ${label}`}
                formatter={(value: any) => [formatCurrency(Number(value)), tCommon("varianceLabel")]}
              />
              <Bar
                dataKey="difference"
                fill="#10b981"
                name={tCommon("varianceLabel")}
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
