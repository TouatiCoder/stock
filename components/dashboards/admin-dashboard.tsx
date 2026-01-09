"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Package, AlertTriangle, Users, FileText, Building } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [costData, setCostData] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [overBudgetProjects, setOverBudgetProjects] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Récupérer les données de base
      const [
        { data: companyData, error: companyError },
        { data: usersData, error: usersError },
        { data: projectsData, error: projectsError },
        { data: materialsData, error: materialsError },
        { data: alertsData, error: alertsError },
        { data: ordersData, error: ordersError },
      ] = await Promise.all([
        supabase.from('companies').select('id, name, currency').single(),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('projects').select('name, total_budget, current_cost, created_at'), // AJOUTÉ 'name' ici
        supabase.from('materials').select('category_id, total_value, current_stock'),
        supabase.from('stock_alerts').select('*').eq('is_resolved', false),
        supabase.from('purchase_orders').select('id, status').in('status', ['pending', 'approved']),
      ])

      // Gérer les erreurs
      if (companyError) console.error('Erreur company:', companyError)
      if (usersError) console.error('Erreur users:', usersError)
      if (projectsError) console.error('Erreur projects:', projectsError)
      if (materialsError) console.error('Erreur materials:', materialsError)
      if (alertsError) console.error('Erreur alerts:', alertsError)
      if (ordersError) console.error('Erreur orders:', ordersError)

      // Calculer les totaux
      const totalBudget = projectsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0
      const totalCurrentCost = projectsData?.reduce((sum, p) => sum + (p.current_cost || 0), 0) || 0
      const totalInventoryValue = materialsData?.reduce((sum, m) => sum + (m.total_value || 0), 0) || 0
      const totalUsers = usersData?.length || 0
      const pendingOrders = ordersData?.length || 0
      const activeAlerts = alertsData?.length || 0

      setDashboardData({
        company_id: companyData?.id,
        company_name: companyData?.name,
        total_users: totalUsers,
        total_projects: projectsData?.length || 0,
        total_current_cost: totalCurrentCost,
        total_budget: totalBudget,
        total_inventory_value: totalInventoryValue,
        active_stock_alerts: activeAlerts,
        pending_orders: pendingOrders,
        pending_invoices: 0,
        currency: companyData?.currency || 'MAD'
      })

      // Préparer les données de coût par mois
      if (projectsData && projectsData.length > 0) {
        const monthlyCosts = projectsData.reduce((acc: any, project) => {
          if (project.created_at) {
            const month = new Date(project.created_at).toLocaleString('fr-FR', { month: 'short' })
            
            if (!acc[month]) {
              acc[month] = {
                month: month,
                budget: 0,
                actual: 0
              }
            }
            acc[month].budget += project.total_budget || 0
            acc[month].actual += project.current_cost || 0
          }
          return acc
        }, {})

        setCostData(Object.values(monthlyCosts))
      } else {
        setCostData([])
      }

      // Préparer les données d'inventaire
      if (materialsData && materialsData.length > 0) {
        const inventoryByCategory = materialsData.reduce((acc: any, material) => {
          const category = material.category_id || 'unknown'
          if (!acc[category]) {
            acc[category] = {
              name: `Catégorie ${category.slice(0, 8)}`,
              value: 0
            }
          }
          acc[category].value += material.total_value || 0
          return acc
        }, {})

        setInventoryData(Object.values(inventoryByCategory).slice(0, 6))
      } else {
        setInventoryData([])
      }

      // Récupérer les alertes avec les noms de matériaux
      if (alertsData && alertsData.length > 0) {
        const alertsWithNames = await Promise.all(
          alertsData.map(async (alert) => {
            const { data: material } = await supabase
              .from('materials')
              .select('name')
              .eq('id', alert.material_id)
              .single()

            return {
              ...alert,
              material_name: material?.name || 'Matériau inconnu'
            }
          })
        )
        setAlerts(alertsWithNames.slice(0, 5))
      } else {
        setAlerts([])
      }

      // Projets hors budget
      if (projectsData && projectsData.length > 0) {
        const overBudget = projectsData
          .filter(project => {
            const cost = project.current_cost || 0
            const budget = project.total_budget || 0
            return cost > budget && budget > 0
          })
          .map(project => ({
            name: project.name || 'Projet sans nom',
            budget: project.total_budget || 0,
            actual: project.current_cost || 0,
            gap: (project.current_cost || 0) - (project.total_budget || 0)
          }))
          .slice(0, 5)

        setOverBudgetProjects(overBudget)
      } else {
        setOverBudgetProjects([])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Couleurs pour le graphique
  const COLORS = ["#1e40af", "#3b82f6", "#93c5fd", "#dbeafe", "#1e3a8a", "#2563eb"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
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
      {/* Section 1: KPIs de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Coût Total du Projet</p>
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_current_cost?.toLocaleString('fr-MA', {
                style: 'currency',
                currency: dashboardData?.currency || 'MAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }) || "0 MAD"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              vs Budget: {dashboardData?.total_budget?.toLocaleString('fr-MA', {
                style: 'currency',
                currency: dashboardData?.currency || 'MAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }) || "0 MAD"}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              {dashboardData?.total_budget && dashboardData?.total_current_cost && dashboardData.total_budget > 0 && (
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((dashboardData.total_current_cost / dashboardData.total_budget) * 100, 100)}%` 
                  }}
                ></div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Marge Estimée</p>
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_budget && dashboardData?.total_current_cost
                ? (dashboardData.total_budget - dashboardData.total_current_cost).toLocaleString('fr-MA', {
                    style: 'currency',
                    currency: dashboardData?.currency || 'MAD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })
                : "0 MAD"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {dashboardData?.total_budget && dashboardData?.total_current_cost && dashboardData.total_budget > 0
                ? `${Math.round(((dashboardData.total_budget - dashboardData.total_current_cost) / dashboardData.total_budget) * 100)}% de marge`
                : "Calcul en cours"}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Valeur Inventaire</p>
              <Package size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.total_inventory_value?.toLocaleString('fr-MA', {
                style: 'currency',
                currency: dashboardData?.currency || 'MAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }) || "0 MAD"}
            </p>
            <p className="text-xs text-gray-500 mt-2">Stock actuel valorisé</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <Users size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_users || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              {dashboardData?.pending_orders || 0} commandes en attente
            </p>
            <Button 
              className="w-full mt-3 text-xs bg-transparent" 
              variant="outline"
              onClick={() => window.location.href = '/settings/users'}
            >
              Gérer les utilisateurs
            </Button>
          </div>
        </Card>
      </div>

      {/* Section 2: Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coût vs Budget */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Coût vs Budget (par mois)</h3>
            {costData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis 
                    stroke="#6b7280" 
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `${Number(value).toLocaleString('fr-MA', { 
                        style: 'currency', 
                        currency: dashboardData?.currency || 'MAD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}`,
                      'Montant'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#1e40af" name="Budget" />
                  <Bar dataKey="actual" fill="#ef4444" name="Réel" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Aucune donnée de coût disponible
              </div>
            )}
          </div>
        </Card>

        {/* Répartition Inventaire */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition de l'Inventaire</h3>
            {inventoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toLocaleString('fr-MA', {
                      style: 'currency',
                      currency: dashboardData?.currency || 'MAD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [
                      `${Number(value).toLocaleString('fr-MA', { 
                        style: 'currency', 
                        currency: dashboardData?.currency || 'MAD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}`,
                      'Valeur'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Aucun inventaire disponible
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Section 3: Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Projets Hors Budget</h3>
            </div>
            <div className="space-y-3">
              {overBudgetProjects.length > 0 ? (
                overBudgetProjects.map((project, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <span className="text-xs font-bold text-orange-600">
                        +{project.gap.toLocaleString('fr-MA', { 
                          style: 'currency', 
                          currency: dashboardData?.currency || 'MAD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {project.budget > 0 
                        ? `${((project.gap / project.budget) * 100).toFixed(1)}% de dépassement`
                        : 'Budget non défini'
                      }
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun projet hors budget
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Alertes de Stock</h3>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.material_name}
                      </p>
                      <span className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                        {alert.severity === 'critical' ? 'CRITIQUE' : 'ALERTE'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Stock: {alert.current_level} (Seuil: {alert.threshold})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune alerte de stock active
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Section 4: Accès Rapide */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Accès Rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/projects'}>
              <Building className="mr-2 h-4 w-4" />
              Voir les Projets
            </Button>
            <Button onClick={() => window.location.href = '/stock'}>
              <Package className="mr-2 h-4 w-4" />
              Gérer le Stock
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Paramètres
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}