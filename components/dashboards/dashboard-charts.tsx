"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { dashboardCache } from "@/lib/cache"
import { AlertCircle } from "lucide-react"
import { useCommonTranslations, useProjectTranslations } from "@/components/LocaleProvider"

// Chargement dynamique de recharts
import dynamic from 'next/dynamic'

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded" />
  }
)

const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { 
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded" />
})

const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })

interface DashboardChartsProps {
  companyId: string
}

interface ChartData {
  name: string
  budget: number
  actual: number
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
        
        if (cached) {
          setChartData(cached)
          setLoading(false)
          return
        }

        const res = await fetch("/api/projects?limit=8", { cache: "no-store" })
        if (!res.ok) {
          throw new Error(tCommon("chartsLoadError"))
        }
        const json = await res.json()
        const projects = Array.isArray(json?.projects) ? json.projects : []
        const chartRows: ChartData[] = projects
          .map((project: any) => ({
            name: String(project?.name || tProject("unnamedProject")),
            budget: project?.totalBudget == null ? Number.NaN : Number(project.totalBudget),
            actual: project?.currentCost == null ? Number.NaN : Number(project.currentCost),
          }))
          .filter((item: ChartData) => Number.isFinite(item.budget) && Number.isFinite(item.actual))

        setChartData(chartRows)
        await dashboardCache.set(cacheKey, chartRows)

      } catch (error: any) {
        console.error('Error loading charts:', error)
        setError(error.message || tCommon("chartsLoadError"))
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    loadCharts()
  }, [companyId, tCommon, tProject])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("chartsBudgetVsActualTitle")}</h3>
            <div className="h-[300px] bg-gray-100 animate-pulse rounded"></div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("performanceTitle")}</h3>
            <div className="h-[300px] bg-gray-100 animate-pulse rounded"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle size={20} />
              <h3 className="text-lg font-bold">{tCommon("loadingErrorTitle")}</h3>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("chartsBudgetVsActualTitle")}</h3>
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
              <p className="mb-2">{tProject("noProjectFound")}</p>
              <p className="text-sm">{tProject("createFirstProjectHint")}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("performanceTitle")}</h3>
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              {tCommon("noDataAvailable")}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("chartsBudgetVsActualTitle")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(Number(value)), tCommon("amountLabel")]}
                labelFormatter={(label) => `${tProject("projectLabel")}: ${label}`}
              />
              <Legend />
              <Bar dataKey="budget" fill="#1e40af" name={tCommon("budgetLabel")} radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#ef4444" name={tCommon("actualLabel")} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("varianceBudgetActualTitle")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData.map(item => ({
                ...item,
                difference: item.budget - item.actual
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(Number(value)), tCommon("amountLabel")]}
                labelFormatter={(label) => `${tProject("projectLabel")}: ${label}`}
              />
              <Bar 
                dataKey="difference" 
                fill="#10b981" 
                name={tCommon("varianceLabel")}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
