"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Plus,
  ShoppingCart,
  BarChart3,
  Calendar,
  ClipboardCheck,
  Users,
  Truck,
  Bell,
  RefreshCw
} from "lucide-react"
import { useAuth } from '@/lib/mysql/auth-context'
import { useCommonTranslations, useInventoryTranslations, useProjectTranslations } from "@/components/LocaleProvider"

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const tCommon = useCommonTranslations()
  const tInventory = useInventoryTranslations()
  const tProject = useProjectTranslations()
  const noDataLabel = "N/A"

  useEffect(() => {
    fetchSupervisorData()
  }, [])

  const fetchSupervisorData = async () => {
    try {
      setDashboardData(null);
      setStockAlerts([]);
      setPendingOrders([]);
      setRecentMovements([]);
      setProjects([]);

    } catch (error) {
      console.error('Error fetching supervisor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordConsumption = async () => {
    // Logique pour enregistrer une consommation
    window.location.href = '/inventory/entry/new'
  }

  const handleCreateOrder = async () => {
    // Logique pour créer une commande
    window.location.href = '/costs/orders/new'
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchSupervisorData()
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <Plus size={14} className="text-green-600" />
      case 'out': return <TrendingDown size={14} className="text-red-600" />
      case 'transfer': return <RefreshCw size={14} className="text-blue-600" />
      default: return <Package size={14} className="text-gray-600" />
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in': return tInventory("movementIn")
      case 'out': return tInventory("movementOut")
      case 'transfer': return tCommon("transfer")
      case 'consumption': return tInventory("locationConsumptionOnly")
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton rafraîchir */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{tCommon("siteDashboardTitle")}</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {tCommon("refresh")}
        </Button>
      </div>

      {/* KPIs Opérationnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">{tCommon("totalStock")}</p>
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_stock != null ? `${dashboardData.total_stock.toLocaleString()} ${tInventory("units")}` : noDataLabel}
            </p>
            <p className="text-xs text-gray-500 mt-2">{tInventory("allMaterials")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("criticalAlerts")}</p>
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.critical_alerts ?? noDataLabel}</p>
            <p className="text-xs text-red-600 mt-2 font-medium">{tCommon("materialsAtRisk")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("pendingOrders")}</p>
              <ShoppingCart size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.pending_orders ?? noDataLabel}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("deliveriesExpected")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tProject("activeProjects")}</p>
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_projects ?? noDataLabel}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("inProgress")}</p>
          </div>
        </Card>
      </div>

      {/* Actions Rapides et Matériaux Critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saisie Rapide */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("quickActions")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                onClick={handleRecordConsumption}
              >
                <Plus size={18} />
                {tCommon("recordOutflow")}
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={handleCreateOrder}
              >
                <ShoppingCart size={18} />
                {tCommon("newOrder")}
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => window.location.href = '/inventory'}
              >
                <ClipboardCheck size={18} />
                {tCommon("inventory")}
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => window.location.href = '/reports'}
              >
                <BarChart3 size={18} />
                {tCommon("reports")}
              </Button>
            </div>
          </div>
        </Card>

        {/* Matériaux Critiques */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("underThresholdMaterials")}</h3>
              <Bell size={18} className="text-red-600" />
            </div>
            <div className="space-y-3">
              {stockAlerts.length > 0 ? (
                stockAlerts.slice(0, 4).map((alert: any) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {alert.materials?.name || tInventory("unknownMaterial")}
                        </p>
                        <p className="text-xs text-gray-600">
                          {alert.materials?.unit_of_measure || tInventory("unit")}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {alert.severity === 'critical' ? tCommon("criticalLabel") : tCommon("alertLabel")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {tCommon("stockLabel")}: {alert.current_level} / {tCommon("minLabel")}: {alert.threshold}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/costs/orders/new?material=${alert.material_id}`}
                      >
                        {tCommon("order")}
                      </Button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ 
                          width: `${Math.min((alert.current_level / alert.threshold) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tInventory("noStockAlerts")}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Commandes en attente et Mouvements récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes en Attente */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("pendingOrdersTitle")}</h3>
              <Calendar size={18} className="text-orange-600" />
            </div>
            <div className="space-y-3">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order: any) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-gray-600">
                          {tInventory("supplier")}: {order.suppliers?.name || tCommon("notSpecified")}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        order.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : order.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? tCommon("pendingLabel") : 
                         order.status === 'approved' ? tCommon("approvedLabel") : 
                         order.status === 'ordered' ? tCommon("orderedLabel") : order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {order.total_amount?.toLocaleString('fr-MA', {
                          style: 'currency',
                          currency: 'MAD'
                        })}
                      </span>
                      <span>
                        {tCommon("delivery")}: {order.expected_delivery_date 
                          ? new Date(order.expected_delivery_date).toLocaleDateString()
                          : tCommon("notDefined")
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <ShoppingCart size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tCommon("noPendingOrders")}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCreateOrder}
                  >
                    {tCommon("createOrder")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Mouvements Récents */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("recentMovementsTitle")}</h3>
              <RefreshCw size={18} className="text-blue-600" />
            </div>
            <div className="space-y-3">
              {recentMovements.length > 0 ? (
                recentMovements.map((movement: any) => (
                  <div key={movement.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {movement.materials?.name || tInventory("unknownMaterial")}
                          </p>
                          <p className="text-xs text-gray-600">
                            {movement.projects?.name || tCommon("general")}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${
                        movement.movement_type === 'in' 
                          ? 'text-green-600' 
                          : movement.movement_type === 'out'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {movement.quantity} {movement.materials?.unit_of_measure || tInventory("unit")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium">
                        {getMovementLabel(movement.movement_type)}
                      </span>
                      <span>
                        {new Date(movement.movement_date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tCommon("recentMovementsNone")}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Projets Actifs */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{tProject("activeProjects")}</h3>
            <Users size={18} className="text-purple-600" />
          </div>
          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.map((project: any) => (
                <div 
                  key={project.id} 
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer"
                  onClick={() => window.location.href = `/projects/${project.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-600 capitalize">{project.status}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {project.current_cost && (
                        <span className="text-xs font-medium">
                          {project.current_cost.toLocaleString('fr-MA', {
                            style: 'currency',
                            currency: 'MAD'
                          })}
                        </span>
                      )}
                      {project.progress_percentage && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${project.progress_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{project.progress_percentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Users size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{tProject("activeProjectNone")}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
