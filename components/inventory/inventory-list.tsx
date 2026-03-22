"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Edit2, Eye, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useInventoryTranslations, useLocale } from "@/components/LocaleProvider"

interface InventoryListProps {
  searchTerm: string
  filterCategory: string
}

export function InventoryList({ searchTerm, filterCategory }: InventoryListProps) {
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const { locale } = useLocale()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.companyId) {
      fetchMaterials()
    }
  }, [user?.companyId, searchTerm, filterCategory])

  const fetchMaterials = async () => {
    try {
      setLoading(true)

      const companyId = user?.companyId
      if (!companyId) return

      const searchParams = new URLSearchParams()
      searchParams.set("companyId", companyId)
      if (searchTerm) {
        searchParams.set("search", searchTerm)
      }
      if (filterCategory && filterCategory !== "all") {
        searchParams.set("categoryId", filterCategory)
      }

      const response = await fetch(`/api/materials?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch materials")
      }

      const data = await response.json()
      setMaterials(data?.slice(0, 5) || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (material: any) => {
    const currentStock = Number(material.current_stock)
    const criticalThreshold = Number(material.critical_threshold)
    const minStockLevel = Number(material.min_stock_level)

    if (!Number.isFinite(currentStock) || !Number.isFinite(criticalThreshold) || !Number.isFinite(minStockLevel)) {
      return {
        label: tInventory("statsNA"),
        color: "bg-gray-100 text-gray-700",
      }
    }

    if (currentStock <= criticalThreshold) {
      return {
        label: tInventory("statusCritical"),
        color: "bg-red-100 text-red-700",
      }
    }
    if (currentStock <= minStockLevel) {
      return {
        label: tInventory("statusLow"),
        color: "bg-yellow-100 text-yellow-700",
      }
    }
    return {
      label: tInventory("statusNormal"),
      color: "bg-green-100 text-green-700",
    }
  }

  const getUnitText = (unit: string) => {
    const units: Record<string, string> = {
      kg: "kg",
      ton: tInventory("unitTon"),
      m3: tInventory("unitM3"),
      m2: tInventory("unitM2"),
      m: "m",
      unit: tInventory("unitSingle"),
      bag: tInventory("unitBag"),
      pallet: tInventory("unitPallet"),
      other: tInventory("unitSingle"),
    }
    return units[unit] || unit
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
            {materials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  {tInventory("noMaterialsFound")}
                </td>
              </tr>
            )}
            {materials.map((material) => {
              const status = getStockStatus(material)
              const unitText = getUnitText(material.unit_of_measure)

              return (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{material.name}</p>
                      <p className="text-xs text-gray-500">
                        {material.category?.name || tInventory("uncategorized")} • {unitText}
                      </p>
                      {material.sku && <p className="text-xs text-gray-400 mt-1">{tInventory("sku")} : {material.sku}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {material.current_stock == null ? tInventory("statsNA") : material.current_stock}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {material.min_stock_level == null ? tInventory("statsNA") : material.min_stock_level}
                    <div className="text-xs text-gray-500 mt-1">
                      {tInventory("criticalThreshold")}: {material.critical_threshold == null ? tInventory("statsNA") : material.critical_threshold}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {material.unit_price == null ? tInventory("statsNA") : formatCurrency(material.unit_price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {status.label === tInventory("statusCritical") ? (
                        <AlertTriangle size={14} className="text-red-600" />
                      ) : (
                        <CheckCircle size={14} className="text-green-600" />
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
