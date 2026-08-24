"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowLeftRight, ArrowUp, RotateCcw, Package, Clock, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useInventoryTranslations, useLocale } from "@/components/LocaleProvider"

export function StockMovements() {
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const { locale } = useLocale()
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.companyId) {
      fetchMovements()
    }
  }, [user?.companyId])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const companyId = user?.companyId
      if (!companyId) return

      const res = await fetch("/api/inventory/movements?limit=5", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch movements")
      const data = await res.json()
      setMovements(data || [])
    } catch (error) {
      console.error("Error fetching stock movements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "out":
        return ArrowDown
      case "in":
        return ArrowUp
      case "return":
        return RotateCcw
      case "transfer":
        return ArrowLeftRight
      default:
        return Package
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "out":
        return "text-red-600 bg-red-50"
      case "in":
        return "text-green-600 bg-green-50"
      case "return":
        return "text-blue-600 bg-blue-50"
      case "transfer":
        return "text-sky-600 bg-sky-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "out":
        return tInventory("movementOut")
      case "in":
        return tInventory("movementIn")
      case "return":
        return tInventory("movementReturn")
      case "transfer":
        return tInventory("movementTransfer")
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return tInventory("today")
    if (diffDays === 1) return tInventory("yesterday")
    if (diffDays < 7) return `${tInventory("daysAgoPrefix")} ${diffDays} ${tInventory("daysAgoSuffix")}`

    const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-MA" }
    return date.toLocaleDateString(localeMap[locale] || "fr-FR", {
      day: "numeric",
      month: "short",
    })
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{tInventory("statsRecentMovements")}</h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{tInventory("statsRecentMovements")}</h3>
          <Link href="/inventory/movements" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            {tInventory("viewAll")}
            <ExternalLink size={12} />
          </Link>
        </div>

        {movements.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{tInventory("noRecentMovements")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {movements.slice(0, 3).map((movement) => {
              const IconComponent = getMovementIcon(movement.movement_type)
              const colorClass = getMovementColor(movement.movement_type)
              const movementLabel = getMovementLabel(movement.movement_type)
              const formattedDate = formatDate(movement.movement_date)

              let location = ""
              if (movement.source_type === "supplier" && movement.destination_type === "warehouse") {
                location = movement.destination_warehouse?.name
                  ? `${tInventory("locationSupplierToWarehouse")} ${movement.destination_warehouse.name}`
                  : tInventory("locationSupplierToWarehouse")
              } else if (movement.source_type === "warehouse" && movement.destination_type === "warehouse") {
                location =
                  movement.source_warehouse?.name && movement.destination_warehouse?.name
                    ? `${tInventory("locationFrom")} ${movement.source_warehouse.name} ${tInventory("locationTo")} ${movement.destination_warehouse.name}`
                    : tInventory("movementTransfer")
              } else if (movement.source_type === "warehouse" && movement.destination_type === "project") {
                location = movement.project?.name
                  ? `${tInventory("locationTo")} ${movement.project.name}`
                  : tInventory("locationToSite")
              } else if (movement.source_type === "project" && movement.destination_type === "warehouse") {
                location = movement.project?.name
                  ? `${tInventory("locationFrom")} ${movement.project.name}`
                  : tInventory("locationFromSite")
              } else if (movement.source_type === "project" && !movement.destination_type) {
                location = movement.project?.name
                  ? `${tInventory("locationConsumption")} ${movement.project.name}`
                  : tInventory("locationConsumptionOnly")
              }

              return (
                <div key={movement.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{movement.material?.name || tInventory("unknownMaterial")}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {movementLabel}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={10} />
                            {formattedDate}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {movement.quantity} {movement.material?.unit || tInventory("unitSingle")}
                        </p>
                      </div>
                    </div>

                    {location && <p className="text-xs text-gray-500 mt-1 truncate">{location}</p>}

                    {movement.user && (
                      <p className="text-xs text-gray-400 mt-1">
                        {tInventory("byUser")} {movement.user.first_name} {movement.user.last_name?.charAt(0)}.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {movements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {tInventory("movementIn")}: {movements.filter((m) => m.movement_type === "in").length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {tInventory("movementOut")}: {movements.filter((m) => m.movement_type === "out").length}
                  </span>
                </div>
              </div>
              <Link href="/inventory/entry/new" className="text-xs text-blue-600 hover:text-blue-800">
                + {tInventory("newEntryShort")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
