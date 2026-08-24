"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useLocale, useProjectTranslations } from "@/components/LocaleProvider"
import {
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  LucideIcon,
} from "lucide-react"

interface ProjectStatsProps {
  refreshTrigger?: number
  showAllStats?: boolean
  stats?: {
    total: number
    active: number
    planning: number
    completed: number
    paused: number
    cancelled: number
    totalBudget: number
    totalCost: number
    overBudgetCount?: number
    budgetUsage?: number
    activePercentage?: number
  }
}

interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  description: string
  subValue?: string
  percentage: number
  showProgress?: boolean
  isBudget?: boolean
}

export function ProjectStats({
  refreshTrigger = 0,
  showAllStats = false,
  stats: externalStats,
}: ProjectStatsProps) {
  const tProject = useProjectTranslations()
  const { locale } = useLocale()
  const [stats, setStats] = useState<any>(externalStats || null)
  const [loading, setLoading] = useState(!externalStats)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    if (externalStats) {
      setStats(externalStats)
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [externalStats, refreshTrigger])

  const defaultStats = {
    total: 0,
    active: 0,
    planning: 0,
    completed: 0,
    paused: 0,
    cancelled: 0,
    overBudgetCount: 0,
    totalBudget: 0,
    totalCost: 0,
    budgetUsage: 0,
  }

  const displayStats = externalStats || stats || defaultStats
  const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
  const numberLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-200"></div>
                <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
              </div>
              <div className="h-8 w-16 rounded bg-gray-200"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const mainStatItems: StatItem[] = [
    {
      label: tProject("totalProjects"),
      value: displayStats.total.toString(),
      icon: Briefcase,
      color: "blue",
      description: tProject("activeProjects"),
      subValue: displayStats.active > 0 ? `${displayStats.active} ${tProject("active")}` : undefined,
      percentage: displayStats.total > 0 ? Math.round((displayStats.active / displayStats.total) * 100) : 0,
      showProgress: true,
    },
    {
      label: tProject("inPlanning"),
      value: displayStats.planning.toString(),
      icon: Clock,
      color: "orange",
      description: tProject("preparation"),
      subValue: displayStats.planning > 0 ? `${displayStats.planning} ${tProject("pending")}` : undefined,
      percentage: displayStats.total > 0 ? Math.round((displayStats.planning / displayStats.total) * 100) : 0,
      showProgress: true,
    },
    {
      label: tProject("budgetUsed"),
      value: `${Math.round(displayStats.budgetUsage || 0)}%`,
      icon: DollarSign,
      color: "purple",
      description: tProject("vsTotalBudget"),
      subValue:
        displayStats.totalBudget > 0
          ? `${Math.round(displayStats.totalCost || 0).toLocaleString(numberLocale)} / ${Math.round(displayStats.totalBudget).toLocaleString(numberLocale)} MAD`
          : undefined,
      percentage: Math.min(displayStats.budgetUsage || 0, 100),
      showProgress: true,
      isBudget: true,
    },
    {
      label: tProject("overBudget"),
      value: displayStats.overBudgetCount.toString(),
      icon: AlertCircle,
      color: "red",
      description: tProject("attention"),
      subValue: displayStats.overBudgetCount > 0 ? `${displayStats.overBudgetCount} ${tProject("projects")}` : tProject("allGood"),
      percentage: displayStats.total > 0 ? Math.round((displayStats.overBudgetCount / displayStats.total) * 100) : 0,
      showProgress: true,
    },
  ]

  const additionalStatItems: StatItem[] = [
    {
      label: tProject("completedLabel"),
      value: displayStats.completed.toString(),
      icon: CheckCircle,
      color: "green",
      description: tProject("completedProjects"),
      percentage: displayStats.total > 0 ? Math.round((displayStats.completed / displayStats.total) * 100) : 0,
      showProgress: false,
    },
    {
      label: tProject("pausedLabel"),
      value: displayStats.paused.toString(),
      icon: Clock,
      color: "yellow",
      description: tProject("pausedProjects"),
      percentage: displayStats.total > 0 ? Math.round((displayStats.paused / displayStats.total) * 100) : 0,
      showProgress: false,
    },
    {
      label: tProject("cancelledLabel"),
      value: displayStats.cancelled.toString(),
      icon: AlertCircle,
      color: "gray",
      description: tProject("cancelledProjects"),
      percentage: displayStats.total > 0 ? Math.round((displayStats.cancelled / displayStats.total) * 100) : 0,
      showProgress: false,
    },
    {
      label: tProject("totalCostLabel"),
      value: `${Math.round(displayStats.totalCost || 0).toLocaleString(numberLocale)} MAD`,
      icon: TrendingUp,
      color: "indigo",
      description: tProject("cumulativeCost"),
      percentage: 0,
      showProgress: false,
    },
  ]

  const statItemsToShow = showAllStats ? [...mainStatItems, ...additionalStatItems] : mainStatItems

  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
    gray: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  } as const

  const progressColorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500",
    indigo: "bg-indigo-500",
  } as const

  return (
    <div>
      {!externalStats && (
        <div className="mb-3 text-right text-xs text-gray-500">
          {tProject("updatedAt")} {lastUpdated.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      <div className={`grid gap-4 ${showAllStats ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
        {statItemsToShow.map((stat, i) => {
          const Icon = stat.icon
          const color = colorMap[stat.color as keyof typeof colorMap]
          const progressColor = progressColorMap[stat.color as keyof typeof progressColorMap]

          return (
            <Card key={i} className={`transition-shadow hover:shadow-md ${color.border}`}>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    {stat.description && <p className="mt-0.5 text-xs text-gray-400">{stat.description}</p>}
                  </div>
                  <div className={`rounded-lg p-2.5 ${color.bg} ${color.text}`}>
                    <Icon size={18} />
                  </div>
                </div>

                <div className="mb-3">
                  <p className={`text-2xl font-bold ${stat.isBudget && stat.percentage > 100 ? "text-red-600" : "text-gray-900"}`}>
                    {stat.value}
                  </p>
                  {stat.subValue && <p className="mt-1 text-xs text-gray-500">{stat.subValue}</p>}
                </div>

                {stat.showProgress && stat.percentage > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{tProject("progress")}</span>
                      <span className="font-medium">{stat.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-1.5 rounded-full ${progressColor} ${stat.isBudget && stat.percentage > 100 ? "animate-pulse" : ""}`}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      ></div>
                    </div>
                    {stat.isBudget && stat.percentage > 100 && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {tProject("overrunWarning")} {stat.percentage - 100}%
                      </p>
                    )}
                  </div>
                )}

                {!stat.showProgress && stat.percentage > 0 && (
                  <div className="text-xs text-gray-500">
                    {stat.percentage}% {tProject("ofProjects")}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {!showAllStats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">{tProject("budgetTotal")}</div>
            <div className="text-sm font-semibold">{Math.round(displayStats.totalBudget || 0).toLocaleString(numberLocale)} MAD</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">{tProject("currentCost")}</div>
            <div className="text-sm font-semibold">{Math.round(displayStats.totalCost || 0).toLocaleString(numberLocale)} MAD</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">{tProject("completedLabel")}</div>
            <div className="text-sm font-semibold">{displayStats.completed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">{tProject("pausedLabel")}</div>
            <div className="text-sm font-semibold">{displayStats.paused}</div>
          </div>
        </div>
      )}
    </div>
  )
}
