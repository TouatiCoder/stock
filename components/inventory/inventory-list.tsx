"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Edit2, 
  Trash2, 
  Eye,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { inventoryService } from "@/lib/services/inventoryService"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface InventoryListProps {
  searchTerm: string
  filterCategory: string
}

export function InventoryList({ searchTerm, filterCategory }: InventoryListProps) {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.company_id) {
      fetchMaterials()
    }
  }, [user?.company_id, searchTerm, filterCategory])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      
      const companyId = user?.company_id
      if (!companyId) return

      const data = await inventoryService.getAllMaterials(companyId, {
        search: searchTerm || undefined,
        categoryId: filterCategory !== 'all' ? filterCategory : undefined
      })
      
      // Limiter à 5 matériaux pour garder le design original
      setMaterials(data.slice(0, 5) || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (material: any) => {
    if (material.current_stock <= material.critical_threshold) {
      return {
        label: 'Critique',
        color: 'bg-red-100 text-red-700'
      }
    }
    if (material.current_stock <= material.min_stock_level) {
      return {
        label: 'Faible',
        color: 'bg-yellow-100 text-yellow-700'
      }
    }
    return {
      label: 'Normal',
      color: 'bg-green-100 text-green-700'
    }
  }

  const getUnitText = (unit: string) => {
    const units: Record<string, string> = {
      'kg': 'kg',
      'ton': 'tonne',
      'm3': 'm³',
      'm2': 'm²',
      'm': 'm',
      'unit': 'unité',
      'bag': 'sac',
      'pallet': 'palette',
      'other': 'unité'
    }
    return units[unit] || unit
  }

  if (loading) {
    return (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Matériau</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Disponible</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Minimum</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valeur Unitaire</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">État</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
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
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Matériau</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Disponible</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Minimum</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valeur Unitaire</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">État</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {materials.map((material) => {
              const status = getStockStatus(material)
              const unitText = getUnitText(material.unit_of_measure)
              
              return (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{material.name}</p>
                      <p className="text-xs text-gray-500">
                        {material.category?.name || 'Non catégorisé'} • {unitText}
                      </p>
                      {material.sku && (
                        <p className="text-xs text-gray-400 mt-1">SKU: {material.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {material.current_stock || 0}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {material.min_stock_level || 0}
                    <div className="text-xs text-gray-500 mt-1">
                      Critique: {material.critical_threshold || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {material.unit_price?.toLocaleString('fr-MA', {
                      style: 'currency',
                      currency: 'MAD'
                    }) || '0 MAD'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {status.label === 'Critique' ? 
                        <AlertTriangle size={14} className="text-red-600" /> : 
                        <CheckCircle size={14} className="text-green-600" />
                      }
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link 
                        href={`/inventory/materials/${material.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </Link>
                      <Link
                        href={`/inventory/materials/${material.id}/edit`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </Link>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => {
                          if (confirm("Êtes-vous sûr de vouloir supprimer ce matériau ?")) {
                            // Logique de suppression
                          }
                        }}
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