"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CostsDashboard } from "@/components/costs/costs-dashboard"
import { SuppliersList } from "@/components/costs/suppliers-list"
import { OrdersList } from "@/components/costs/orders-list"
// Ajoutez ces imports
import { costService } from "@/lib/services/costService"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Définir le type des stats - CORRIGEZ CETTE INTERFACE
interface CostStats {
  totalBudget: number
  totalSpent: number
  totalOrders: number
  pendingOrders: number
  totalSuppliers: number
  activeSuppliers: number
  totalInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  byCategory: Array<{ category: string; amount: number }>
  byMonth: Array<{ month: string; spent: number; budget: number }>
  bySupplier: Array<{ name: string; percentage: number }>
}

export default function CostsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "suppliers" | "orders">("overview")
  
  // Ajoutez ces états
  const [dashboardData, setDashboardData] = useState({
    totalBudget: 0,
    totalSpent: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    paidAmount: 0,
    costData: [] as Array<{ month: string; budget: number; actual: number }>,
    supplierData: [] as Array<{ name: string; percentage: number }>
  })
  const [loading, setLoading] = useState(true)

  // Ajoutez cet effet pour charger les données
  useEffect(() => {
    if (activeTab === "overview") {
      fetchCostData()
    }
  }, [activeTab])

  // Ajoutez cette fonction pour récupérer les données
  const fetchCostData = async () => {
    try {
      setLoading(true)
      
      // 1. Vérifier l'authentification
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // 2. Récupérer l'entreprise de l'utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()
      if (!userData?.company_id) return

      // 3. Appeler votre service
      const stats = await costService.getCostStats(userData.company_id)
      
      // 4. Calculer le montant des factures en attente
      const { data: pendingInvoicesData } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('company_id', userData.company_id)
        .eq('status', 'pending')
      
      const pendingAmount = pendingInvoicesData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

      // 5. Formater les données pour le dashboard
      const formattedData = {
        totalBudget: stats.totalBudget || 0,
        totalSpent: stats.totalSpent || 0,
        pendingInvoices: stats.pendingInvoices || 0,
        pendingAmount: pendingAmount,
        paidInvoices: (stats.totalInvoices || 0) - (stats.pendingInvoices || 0),
        paidAmount: stats.totalSpent || 0,
        costData: stats.byMonth?.map(month => ({
          month: month.month,
          budget: month.budget,
          actual: month.spent
        })) || [],
        supplierData: stats.bySupplier || [] // bySupplier vient maintenant de votre service
      }

      setDashboardData(formattedData)
    } catch (error) {
      console.error('Erreur:', error)
      // Données par défaut en cas d'erreur
      setDashboardData({
        totalBudget: 0,
        totalSpent: 0,
        pendingInvoices: 0,
        pendingAmount: 0,
        paidInvoices: 0,
        paidAmount: 0,
        costData: [],
        supplierData: []
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Coûts</h1>
                    <p className="text-gray-600 mt-1">Suivi budgétaire et gestion des fournisseurs</p>
                  </div>
                  <Button className="flex items-center gap-2" onClick={() => router.push("/costs/orders/new")}>
                    <Plus size={18} />
                    Nouvelle Commande
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  {[
    { value: "overview", label: "Vue d'ensemble" },
    { value: "suppliers", label: "Fournisseurs" },
    { value: "orders", label: "Commandes" }
  ].map((tab) => (
    <button
      key={tab.value}  // ✅ Toujours important
      onClick={() => setActiveTab(tab.value as any)}
      className={`px-4 py-2 font-medium transition-colors ${
        activeTab === tab.value
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {tab.label}  {/* ✅ Une seule expression, pas de conditionnelles */}
    </button>
  ))}
                </div>

                {/* Content - Passez les bonnes props */}
                {activeTab === "overview" && (
                  <CostsDashboard 
                    totalBudget={dashboardData.totalBudget}
                    totalSpent={dashboardData.totalSpent}
                    pendingInvoices={dashboardData.pendingInvoices}
                    pendingAmount={dashboardData.pendingAmount}
                    paidInvoices={dashboardData.paidInvoices}
                    paidAmount={dashboardData.paidAmount}
                    costData={dashboardData.costData}
                    supplierData={dashboardData.supplierData}
                    loading={loading}
                  />
                )}
                {activeTab === "suppliers" && <SuppliersList searchTerm={""} />}
                {activeTab === "orders" && <OrdersList searchTerm={""} />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}