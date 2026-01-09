"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  ShoppingCart,
  Clock,
  Package
} from "lucide-react"
import { inventoryService } from "@/lib/services/inventoryService"
import { useAuth } from "@/lib/auth-context"
export function CriticalThresholds() {
  const { user } = useAuth()
  const [criticalMaterials, setCriticalMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.company_id) {
      fetchCriticalMaterials()
    }
  }, [user?.company_id])

  const fetchCriticalMaterials = async () => {
    try {
      setLoading(true)
      
      const companyId = user?.company_id
      if (!companyId) return

      // Récupérer tous les matériaux
      const allMaterials = await inventoryService.getAllMaterials(companyId)
      
      // Filtrer les matériaux critiques
      const critical = allMaterials.filter(material => 
        material.current_stock <= material.critical_threshold
      ).slice(0, 3) // Limiter à 3 pour garder le design original
      
      setCriticalMaterials(critical)
    } catch (error) {
      console.error("Error fetching critical materials:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysLeft = (material: any) => {
    // Estimation simple basée sur le seuil critique
    const days = Math.floor(material.current_stock / 10) // 10 unités/jour comme estimation
    return Math.max(days, 0)
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (criticalMaterials.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Seuils Critiques</h3>
          </div>
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun seuil critique</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">Seuils Critiques</h3>
        </div>
        
        <div className="space-y-3">
          {criticalMaterials.map((material, i) => {
            const daysLeft = getDaysLeft(material)
            const unitText = material.unit_of_measure === 'kg' ? 'kg' : 
                            material.unit_of_measure === 'm3' ? 'm³' : 
                            material.unit_of_measure === 'unit' ? 'unité' : 
                            material.unit_of_measure
            
            return (
              <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-xs text-gray-600">
                      {material.category?.name || 'Non catégorisé'}
                    </p>
                  </div>
                  {daysLeft > 0 ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-red-600">
                      <Clock size={12} />
                      {daysLeft}j
                    </div>
                  ) : (
                    <Badge className="bg-red-600 text-white text-xs">URGENT</Badge>
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Stock actuel</span>
                    <span className="font-bold text-red-600">
                      {material.current_stock}/{material.critical_threshold} {unitText}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ 
                        width: `${Math.min((material.current_stock / material.critical_threshold) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full text-xs flex items-center justify-center gap-1"
                  onClick={() => {
                    // Rediriger vers la commande
                    window.location.href = `/purchase-orders/new?material=${material.id}`
                  }}
                >
                  <ShoppingCart size={12} />
                  Commander
                </Button>
              </div>
            )
          })}
        </div>

        {/* Résumé */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {criticalMaterials.length} alerte{criticalMaterials.length > 1 ? 's' : ''} critique{criticalMaterials.length > 1 ? 's' : ''}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-red-600"
              onClick={() => {
                window.location.href = '/inventory?filter=critical'
              }}
            >
              Voir tout
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}