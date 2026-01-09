"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { 
  Briefcase, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  LucideIcon
} from "lucide-react"
import { statsService } from "@/lib/services/statsService"

interface ProjectStatsProps {
  refreshTrigger?: number // Pour forcer le rafraîchissement
  showAllStats?: boolean // Pour afficher plus de stats
  stats?: {
    total: number
    active: number
    planning: number
    completed: number
    paused: number
    cancelled: number
    totalBudget: number
    totalCost: number
    overBudgetCount: number
    budgetUsage: number
    activePercentage?: number
  }
}

// Définir un type pour les éléments de statistiques
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
  isCurrency?: boolean
}

export function ProjectStats({ 
  refreshTrigger = 0, 
  showAllStats = false,
  stats: externalStats
}: ProjectStatsProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(!externalStats) // Si des stats sont fournies, pas de loading
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    // Si aucune statistique externe n'est fournie, chargez-les
    if (!externalStats) {
      fetchStats()
    } else {
      setStats(externalStats)
      setLoading(false)
    }
  }, [refreshTrigger, externalStats])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await statsService.getProjectStats()
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Données par défaut
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
    budgetUsage: 0
  }

  const displayStats = externalStats || stats || defaultStats

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Statistiques principales - avec le type StatItem
  const mainStatItems: StatItem[] = [
    {
      label: "Total Projets",
      value: displayStats.total.toString(),
      icon: Briefcase,
      color: "blue",
      description: "Projets actifs",
      subValue: displayStats.active > 0 ? `${displayStats.active} actifs` : undefined,
      percentage: displayStats.total > 0 ? Math.round((displayStats.active / displayStats.total) * 100) : 0,
      showProgress: true
    },
    {
      label: "En Planification",
      value: displayStats.planning.toString(),
      icon: Clock,
      color: "orange",
      description: "Préparation",
      subValue: displayStats.planning > 0 ? `${displayStats.planning} en attente` : undefined,
      percentage: displayStats.total > 0 ? Math.round((displayStats.planning / displayStats.total) * 100) : 0,
      showProgress: true
    },
    {
      label: "Budget Utilisé",
      value: `${Math.round(displayStats.budgetUsage || 0)}%`,
      icon: DollarSign,
      color: "purple",
      description: "vs Budget total",
      subValue: displayStats.totalBudget > 0 
        ? `${Math.round(displayStats.totalCost || 0).toLocaleString()} / ${Math.round(displayStats.totalBudget).toLocaleString()} MAD`
        : undefined,
      percentage: Math.min(displayStats.budgetUsage || 0, 100),
      showProgress: true,
      isBudget: true
    },
    {
      label: "Hors Budget",
      value: displayStats.overBudgetCount.toString(),
      icon: AlertCircle,
      color: "red",
      description: "Attention",
      subValue: displayStats.overBudgetCount > 0 ? `${displayStats.overBudgetCount} projets` : "Tout est OK",
      percentage: displayStats.total > 0 ? Math.round((displayStats.overBudgetCount / displayStats.total) * 100) : 0,
      showProgress: true
    }
  ]

  // Statistiques supplémentaires (si showAllStats = true)
  const additionalStatItems: StatItem[] = [
    {
      label: "Complétés",
      value: displayStats.completed.toString(),
      icon: CheckCircle,
      color: "green",
      description: "Projets terminés",
      percentage: displayStats.total > 0 ? Math.round((displayStats.completed / displayStats.total) * 100) : 0,
      showProgress: false
    },
    {
      label: "En Pause",
      value: displayStats.paused.toString(),
      icon: Clock,
      color: "yellow",
      description: "Projets suspendus",
      percentage: displayStats.total > 0 ? Math.round((displayStats.paused / displayStats.total) * 100) : 0,
      showProgress: false
    },
    {
      label: "Annulés",
      value: displayStats.cancelled.toString(),
      icon: AlertCircle,
      color: "gray",
      description: "Projets annulés",
      percentage: displayStats.total > 0 ? Math.round((displayStats.cancelled / displayStats.total) * 100) : 0,
      showProgress: false
    },
    {
      label: "Coût Total",
      value: Math.round(displayStats.totalCost || 0).toLocaleString() + " MAD",
      icon: TrendingUp,
      color: "indigo",
      description: "Coût cumulé",
      percentage: 0,
      showProgress: false,
      isCurrency: true
    }
  ]

  const statItemsToShow = showAllStats 
    ? [...mainStatItems, ...additionalStatItems] 
    : mainStatItems

  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
    gray: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" }
  } as const

  const progressColorMap = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500",
    indigo: "bg-indigo-500"
  } as const

  return (
    <div>
      {/* Dernière mise à jour - seulement si on charge les stats */}
      {!externalStats && (
        <div className="text-xs text-gray-500 mb-3 text-right">
          Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}

      {/* Statistiques */}
      <div className={`grid gap-4 ${showAllStats ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {statItemsToShow.map((stat: StatItem, i: number) => {
          const Icon = stat.icon
          const color = colorMap[stat.color as keyof typeof colorMap]
          const progressColor = progressColorMap[stat.color as keyof typeof colorMap]

          return (
            <Card 
              key={i} 
              className={`hover:shadow-md transition-shadow ${color.border}`}
            >
              <div className="p-5">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    {stat.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-lg ${color.bg} ${color.text}`}>
                    <Icon size={18} />
                  </div>
                </div>

                {/* Valeur principale */}
                <div className="mb-3">
                  <p className={`text-2xl font-bold ${stat.isBudget && stat.percentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  
                  {/* Sous-valeur */}
                  {stat.subValue && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                  )}
                </div>

                {/* Barre de progression */}
                {stat.showProgress && stat.percentage > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span className="font-medium">{stat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${progressColor} ${
                          stat.isBudget && stat.percentage > 100 ? 'animate-pulse' : ''
                        }`}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      ></div>
                    </div>
                    {stat.isBudget && stat.percentage > 100 && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        ⚠️ Dépassement de {stat.percentage - 100}%
                      </p>
                    )}
                  </div>
                )}

                {/* Pourcentage (si pas de barre) */}
                {!stat.showProgress && stat.percentage > 0 && (
                  <div className="text-xs text-gray-500">
                    {stat.percentage}% des projets
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Résumé rapide */}
      {!showAllStats && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Budget Total</div>
            <div className="text-sm font-semibold">
              {Math.round(displayStats.totalBudget || 0).toLocaleString()} MAD
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Coût Actuel</div>
            <div className="text-sm font-semibold">
              {Math.round(displayStats.totalCost || 0).toLocaleString()} MAD
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Terminés</div>
            <div className="text-sm font-semibold">{displayStats.completed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">En Pause</div>
            <div className="text-sm font-semibold">{displayStats.paused}</div>
          </div>
        </div>
      )}
    </div>
  )
}