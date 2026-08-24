"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Edit2, Eye, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useInventoryTranslations, useLocale } from "@/components/LocaleProvider"
import { getLocalizedUnitLabel } from "@/lib/utils/units"

interface InventoryListProps {
  searchTerm: string
}

type StockStatus = {
  key: "critical" | "low" | "normal" | "overstocked"
  label: string
  color: string
  iconColor: string
}

export function InventoryList({ searchTerm }: InventoryListProps) {
  const tInventory = useInventoryTranslations()
  const { locale } = useLocale()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/inventory/materials")
      if (!response.ok) {
        throw new Error("Failed to fetch materials")
      }

      const data = await response.json()
      setMaterials(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalStock = (material: any): number => {
    if (!Array.isArray(material.inventory)) return 0
    return material.inventory.reduce((sum: number, inv: any) => sum + Number(inv.quantity ?? 0), 0)
  }

  const getMinThreshold = (material: any): number => {
    if (!Array.isArray(material.inventory)) return 0
    return material.inventory.reduce((sum: number, inv: any) => sum + Number(inv.minThreshold ?? 0), 0)
  }

  const getMaxThreshold = (material: any): number | null => {
    if (!Array.isArray(material.inventory)) return null
    const total = material.inventory.reduce((sum: number, inv: any) => {
      const val = inv.maxThreshold != null ? Number(inv.maxThreshold) : 0
      return sum + val
    }, 0)
    const hasMax = material.inventory.some((inv: any) => inv.maxThreshold != null && Number(inv.maxThreshold) > 0)
    return hasMax ? total : null
  }

  const getStockStatus = (material: any): StockStatus => {
    const currentStock = getTotalStock(material)
    const minStockLevel = getMinThreshold(material)
    const maxStockLevel = getMaxThreshold(material)

    if (currentStock <= 0) {
      return {
        key: "critical",
        label: tInventory("statusCritical"),
        color: "bg-red-100 text-red-700",
        iconColor: "text-red-600",
      }
    }

    if (minStockLevel > 0 && currentStock <= minStockLevel) {
      return {
        key: "low",
        label: tInventory("statusLow"),
        color: "bg-yellow-100 text-yellow-700",
        iconColor: "text-yellow-600",
      }
    }

    if (maxStockLevel !== null && currentStock > maxStockLevel) {
      return {
        key: "overstocked",
        label: tInventory("statusOverstocked"),
        color: "bg-blue-100 text-blue-700",
        iconColor: "text-blue-600",
      }
    }

    return {
      key: "normal",
      label: tInventory("statusNormal"),
      color: "bg-green-100 text-green-700",
      iconColor: "text-green-600",
    }
  }

  const getUnitText = (unit: string) => {
    return getLocalizedUnitLabel(unit, locale)
  }

  const formatCurrency = (value: number) => {
    const localeMap: Record<string, string> = { fr: "fr-MA", en: "en-US", ar: "ar-MA" }
    return value.toLocaleString(localeMap[locale] || "fr-MA", {
      style: "currency",
      currency: "MAD",
    })
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm(tInventory("deleteMaterialConfirm"))) return

    try {
      setDeletingId(materialId)
      const response = await fetch(`/api/materials/${materialId}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete material")
      }

      setMaterials((prev) => prev.filter((m) => m.id !== materialId))
    } catch (error: any) {
      alert(error?.message || "Failed to delete material")
    } finally {
      setDeletingId(null)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredMaterials = materials.filter((material) => {
    if (!normalizedSearch) return true

    const searchableValues = [
      material.name,
      material.description,
      material.category,
      material.supplier?.name,
      material.unit,
    ]

    return searchableValues.some((value) =>
      typeof value === "string" && value.toLowerCase().includes(normalizedSearch),
    )
  })

  const renderHeader = () => (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableMaterial")}</th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableAvailable")}</th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableMinimum")}</th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableUnitValue")}</th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableStatus")}</th>
        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{tInventory("tableActions")}</th>
      </tr>
    </thead>
  )

  const getWarehouseBreakdown = (material: any) => {
    if (!Array.isArray(material.inventory)) return []
    return material.inventory
      .filter((inv: any) => Number(inv.quantity ?? 0) > 0 && inv.warehouse?.name)
      .map((inv: any) => `${inv.warehouse.name}: ${Number(inv.quantity ?? 0)} ${getUnitText(material.unit)}`)
  }

  if (loading) {
    return (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            {renderHeader()}
            <tbody className="divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          {renderHeader()}
          <tbody className="divide-y divide-gray-200">
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  {tInventory("noMaterialsFound")}
                </td>
              </tr>
            )}
            {filteredMaterials.map((material) => {
              const status = getStockStatus(material)
              const unitText = getUnitText(material.unit)
              const totalStock = getTotalStock(material)
              const minThreshold = getMinThreshold(material)

              return (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{material.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {totalStock} {unitText}
                      </p>
                      {getWarehouseBreakdown(material).length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {getWarehouseBreakdown(material).join(" • ")}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {minThreshold > 0 ? minThreshold : tInventory("statsNA")}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {material.unitPrice == null ? tInventory("statsNA") : formatCurrency(Number(material.unitPrice))}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {status.key === "normal" ? (
                        <CheckCircle size={14} className={status.iconColor} />
                      ) : status.key === "overstocked" ? (
                        <TrendingUp size={14} className={status.iconColor} />
                      ) : (
                        <AlertTriangle size={14} className={status.iconColor} />
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/inventory/materials/${material.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label={tInventory("actionView")}>
                        <Eye size={16} className="text-gray-600" />
                      </Link>
                      <Link
                        href={`/inventory/materials/${material.id}/edit`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={tInventory("actionEdit")}
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </Link>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={tInventory("actionDelete")}
                        onClick={() => handleDelete(material.id)}
                        disabled={deletingId === material.id}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
