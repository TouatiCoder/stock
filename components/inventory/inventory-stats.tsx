"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Package, TrendingDown, AlertTriangle, ShoppingCart, DollarSign } from "lucide-react"
import { inventoryService } from "@/lib/services/inventoryService"
import { useAuth } from "@/lib/auth-context"
import { useInventoryTranslations, useLocale } from "@/components/LocaleProvider"

export function InventoryStats() {
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const { locale } = useLocale()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [user?.companyId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const companyId = user?.companyId
      if (!companyId) return

      const data = await inventoryService.getInventoryStats(companyId)
      setStats(data)
    } catch (error) {
      console.error("Error fetching inventory stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    const localeMap: Record<string, string> = { fr: "fr-MA", en: "en-US", ar: "ar-MA" }
    return value.toLocaleString(localeMap[locale] || "fr-MA", {
      style: "currency",
      currency: "MAD",
    })
  }

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
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: tInventory("statsValue"), value: tInventory("statsNA"), icon: Package, color: "blue", change: tInventory("statsNA") },
          {
            label: tInventory("statsTotalQuantity"),
            value: tInventory("statsNA"),
            icon: TrendingDown,
            color: "green",
            change: tInventory("statsNA"),
          },
          {
            label: tInventory("statsCritical"),
            value: tInventory("statsNA"),
            icon: AlertTriangle,
            color: "red",
            change: tInventory("statsNA"),
          },
          {
            label: tInventory("statsOpenOrders"),
            value: tInventory("statsNA"),
            icon: ShoppingCart,
            color: "orange",
            change: tInventory("statsNA"),
          },
        ].map((stat, i) => (
          <Card key={i}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <div
                  className={`p-2 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "green"
                        ? "bg-green-50 text-green-600"
                        : stat.color === "red"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {stat.color === "blue" ? (
                    <Package size={18} />
                  ) : stat.color === "green" ? (
                    <TrendingDown size={18} />
                  ) : stat.color === "red" ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: tInventory("statsValue"),
      value: formatCurrency(stats.totalValue || 0),
      icon: DollarSign,
      color: "blue",
      change: tInventory("statsNA"),
    },
    {
      label: tInventory("statsTotalMaterials"),
      value: `${stats.totalMaterials} ${tInventory("materials")}`,
      icon: Package,
      color: "green",
      change: stats.totalMaterials > 0 ? tInventory("statsAvailable") : tInventory("statsNone"),
    },
    {
      label: tInventory("statsCritical"),
      value: `${stats.criticalStockCount} ${tInventory("materials")}`,
      icon: AlertTriangle,
      color: "red",
      change: stats.criticalStockCount > 0 ? tInventory("statsUrgent") : tInventory("statsOk"),
    },
    {
      label: tInventory("statsRecentMovements"),
      value: `${stats.recentMovements} ${tInventory("statsOperations")}`,
      icon: ShoppingCart,
      color: "orange",
      change: stats.recentMovements > 0 ? tInventory("statsActive") : tInventory("statsCalm"),
    },
  ]

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <div className={`p-2 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p
                className={`text-xs font-medium mt-2 ${
                  stat.change === tInventory("statsUrgent")
                    ? "text-red-600"
                    : stat.change.includes("+")
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
            /dashboard    {stat.change}
              </p>
              {stat.label === tInventory("statsCritical") && stats.criticalStockCount > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.criticalStockCount / stats.totalMaterials) * 100)}% {tInventory("ofMaterials")}
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
