"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Package,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface MaterialsListProps {
  projectId: string
}

export function MaterialsList({ projectId }: MaterialsListProps) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaterials()
  }, [projectId])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/materials`)
      if (!response.ok) throw new Error('Failed to fetch materials')
      const data = await response.json()
      // Limiter à 4 matériaux pour garder le design original
      setMaterials(data?.slice(0, 4) || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 w-2/3 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (materials.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Matériaux Standardisés</h2>
          </div>
          <div className="text-center py-8 text-gray-500">
            Aucun matériau dans ce projet
          </div>
        </div>
      </Card>
    )
  }

  const getStockStatusIcon = (material: any) => {
    const stock = material.current_stock || 0
    const minLevel = material.min_stock_level || 0
    const critical = material.critical_threshold || 0
    
    if (stock <= critical) {
      return <AlertTriangle size={12} className="text-red-600" />
    } else if (stock <= minLevel) {
      return <AlertTriangle size={12} className="text-orange-600" />
    } else {
      return <CheckCircle size={12} className="text-green-600" />
    }
  }

  const getStockStatusText = (material: any) => {
    const stock = material.current_stock || 0
    const minLevel = material.min_stock_level || 0
    const critical = material.critical_threshold || 0
    
    if (stock <= critical) return 'CRITIQUE'
    if (stock <= minLevel) return 'FAIBLE'
    return 'DISPONIBLE'
  }

  const getStockStatusColor = (material: any) => {
    const stock = material.current_stock || 0
    const minLevel = material.min_stock_level || 0
    const critical = material.critical_threshold || 0
    
    if (stock <= critical) return 'bg-red-100 text-red-800'
    if (stock <= minLevel) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
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

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Matériaux du Projet</h2>
          </div>
          <Badge variant="outline">
            {materials.length} matériau{materials.length > 1 ? 'x' : ''}
          </Badge>
        </div>

        <div className="space-y-3">
          {materials.map((item, i) => {
            const material = item.material
            const unitText = getUnitText(material?.unit_of_measure || 'unit')
            const category = material?.category?.name || 'Non catégorisé'
            
            return (
              <div key={i} className="p-3 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{material?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{category}</span>
                      <div className="flex items-center gap-1">
                        {getStockStatusIcon(material)}
                        <span className={`text-xs font-medium ${getStockStatusColor(material).split(' ')[1]}`}>
                          {getStockStatusText(material)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {material?.sku && (
                    <Badge variant="outline" className="text-xs">
                      {material.sku}
                    </Badge>
                  )}
                </div>

                {/* Spécifications */}
                <div className="text-xs text-gray-600 mt-2">
                  {material?.description && (
                    <p className="mb-1">{material.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-gray-500">Stock projet: </span>
                      <span className="font-semibold">
                        {item.quantity || 0} {unitText}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock global: </span>
                      <span className="font-semibold">
                        {material?.current_stock || 0} {unitText}
                      </span>
                    </div>
                    {material?.unit_price && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Prix unitaire: </span>
                        <span className="font-semibold text-orange-600">
                          {material.unit_price.toLocaleString('fr-MA', {
                            style: 'currency',
                            currency: 'MAD'
                          })} / {unitText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Valeur totale */}
                {material?.unit_price && item.quantity && (
                  <div className="mt-3 pt-3 border-t border-orange-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valeur totale:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {(material.unit_price * item.quantity).toLocaleString('fr-MA', {
                          style: 'currency',
                          currency: 'MAD'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Note sur les matériaux standardisés */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package size={14} />
            <span>Les matériaux sont liés au catalogue global de l'entreprise</span>
          </div>
        </div>
      </div>
    </Card>
  )
}