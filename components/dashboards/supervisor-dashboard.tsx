"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
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

export function SupervisorDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSupervisorData()
  }, [])

  const fetchSupervisorData = async () => {
    try {
      // Récupérer la session pour obtenir l'ID de l'utilisateur
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.session?.user?.id

      if (!userId) return

      // DÉBUT: Récupérer d'abord les données utilisateur séparément
      const { data: userData } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', userId)
        .single()

      if (!userData?.company_id) {
        console.error('Utilisateur ou compagnie non trouvé')
        return
      }
      // FIN

      // Récupérer les autres données en parallèle
      const [
        { data: stockAlertsData },
        { data: pendingOrdersData },
        { data: recentMovementsData },
        { data: projectsData },
        { data: materialsData },
        { data: suppliersData }
      ] = await Promise.all([
        // Alertes de stock critiques
        supabase
          .from('stock_alerts')
          .select(`
            id, 
            material_id, 
            alert_type, 
            current_level, 
            threshold, 
            severity,
            created_at,
            materials (name, unit_of_measure, min_stock_level)
          `)
          .eq('is_resolved', false)
          .order('severity', { ascending: false })
          .limit(10),
        
        // Commandes en attente
        supabase
          .from('purchase_orders')
          .select(`
            id,
            order_number,
            status,
            order_date,
            expected_delivery_date,
            total_amount,
            suppliers (name)
          `)
          .in('status', ['pending', 'approved', 'ordered'])
          .order('expected_delivery_date', { ascending: true })
          .limit(5),
        
        // Mouvements récents
        supabase
          .from('stock_movements')
          .select(`
            id,
            reference,
            movement_type,
            quantity,
            movement_date,
            materials (name),
            projects (name),
            user_id
          `)
          .order('movement_date', { ascending: false })
          .limit(8),
        
        // Projets actifs
        supabase
          .from('projects')
          .select('id, name, status, progress_percentage, current_cost')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Données matériaux pour calculs
        supabase
          .from('materials')
          .select('id, current_stock, min_stock_level, critical_threshold')
          .eq('company_id', userData.company_id),
        
        // Fournisseurs
        supabase
          .from('suppliers')
          .select('id, name, delivery_score')
          .eq('is_active', true)
          .limit(5)
      ])

      // Calculer les totaux
      const totalStockValue = materialsData?.reduce((sum: number, m: any) => 
        sum + (m.current_stock || 0), 0) || 0
      const criticalAlerts = stockAlertsData?.filter((a: any) => a.severity === 'critical').length || 0
      const pendingOrderCount = pendingOrdersData?.length || 0

      setDashboardData({
        total_stock: totalStockValue,
        critical_alerts: criticalAlerts,
        pending_orders: pendingOrderCount,
        total_projects: projectsData?.length || 0,
        recent_movements_count: recentMovementsData?.length || 0,
        company_id: userData.company_id
      })

      setStockAlerts(stockAlertsData || [])
      setPendingOrders(pendingOrdersData || [])
      setRecentMovements(recentMovementsData || [])
      setProjects(projectsData || [])

    } catch (error) {
      console.error('Error fetching supervisor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordConsumption = async () => {
    // Logique pour enregistrer une consommation
    window.location.href = '/stock/consumption/new'
  }

  const handleCreateOrder = async () => {
    // Logique pour créer une commande
    window.location.href = '/purchase-orders/new'
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
      case 'in': return 'Entrée'
      case 'out': return 'Sortie'
      case 'transfer': return 'Transfert'
      case 'consumption': return 'Consommation'
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Chantier</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Actualiser
        </Button>
      </div>

      {/* KPIs Opérationnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Stock Total</p>
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_stock?.toLocaleString() || '0'} unités
            </p>
            <p className="text-xs text-gray-500 mt-2">Tous les matériaux</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Alertes Critiques</p>
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.critical_alerts || 0}</p>
            <p className="text-xs text-red-600 mt-2 font-medium">Matériaux en danger</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Commandes En Cours</p>
              <ShoppingCart size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.pending_orders || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Livraisons attendues</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Projets Actifs</p>
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_projects || 0}</p>
            <p className="text-xs text-gray-500 mt-2">En cours de réalisation</p>
          </div>
        </Card>
      </div>

      {/* Actions Rapides et Matériaux Critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saisie Rapide */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                onClick={handleRecordConsumption}
              >
                <Plus size={18} />
                Enregistrer Sortie
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={handleCreateOrder}
              >
                <ShoppingCart size={18} />
                Nouvelle Commande
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => window.location.href = '/stock/inventory'}
              >
                <ClipboardCheck size={18} />
                Inventaire
              </Button>
              <Button 
                className="w-full h-12 flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => window.location.href = '/reports/stock'}
              >
                <BarChart3 size={18} />
                Rapports
              </Button>
            </div>
          </div>
        </Card>

        {/* Matériaux Critiques */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Matériaux Sous Seuil</h3>
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
                          {alert.materials?.name || 'Matériau inconnu'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {alert.materials?.unit_of_measure || 'unité'}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {alert.severity === 'critical' ? 'CRITIQUE' : 'ALERTE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Stock: {alert.current_level} / Min: {alert.threshold}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.location.href = `/purchase-orders/new?material=${alert.material_id}`}
                      >
                        Commander
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
                  <p className="text-sm text-gray-500">Aucune alerte de stock</p>
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
              <h3 className="text-lg font-bold text-gray-900">Commandes En Attente</h3>
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
                          Fournisseur: {order.suppliers?.name || 'Non spécifié'}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        order.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : order.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'En attente' : 
                         order.status === 'approved' ? 'Approuvé' : 
                         order.status === 'ordered' ? 'Commandé' : order.status}
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
                        Livraison: {order.expected_delivery_date 
                          ? new Date(order.expected_delivery_date).toLocaleDateString('fr-FR')
                          : 'Non définie'
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <ShoppingCart size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucune commande en attente</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCreateOrder}
                  >
                    Créer une commande
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
              <h3 className="text-lg font-bold text-gray-900">Mouvements Récents</h3>
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
                            {movement.materials?.name || 'Matériau inconnu'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {movement.projects?.name || 'Général'}
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
                        {movement.quantity} {movement.materials?.unit_of_measure || 'unité'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium">
                        {getMovementLabel(movement.movement_type)}
                      </span>
                      <span>
                        {new Date(movement.movement_date).toLocaleDateString('fr-FR', {
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
                  <p className="text-sm text-gray-500">Aucun mouvement récent</p>
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
            <h3 className="text-lg font-bold text-gray-900">Projets Actifs</h3>
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
                <p className="text-sm text-gray-500">Aucun projet actif</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}