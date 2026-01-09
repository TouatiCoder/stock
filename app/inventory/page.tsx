"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download, Package } from "lucide-react"
import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { StockMovements } from "@/components/inventory/stock-movements"
import { CriticalThresholds } from "@/components/inventory/critical-thresholds"
import { inventoryService } from "@/lib/services/inventoryService"
import { materialService } from "@/lib/services/materialService"
import { useAuth } from "@/lib/auth-context"

export default function InventoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (user?.company_id) {
      fetchData()
    }
  }, [user?.company_id, searchTerm, filterCategory])

   const fetchData = async () => {
    try {
      setLoading(true)
      
      const companyId = user?.company_id
      if (!companyId) return

      // ✅ CORRIGÉ: Utilisez le bon service
      const categoriesData = await inventoryService.getCategories(companyId)
      
      // ✅ Assurez-vous que chaque catégorie a un id
      const validCategories = (categoriesData || []).filter(cat => 
        cat && (cat.id || cat.temp_id)
      ).map(cat => ({
        id: cat.id || cat.temp_id, // Utilisez temp_id pour les catégories temporaires
        name: cat.name || 'Non nommé'
      }))
      
      console.log("Valid categories for select:", validCategories)
      setCategories(validCategories)

      // Récupérer les statistiques
      const statsData = await inventoryService.getInventoryStats(companyId)
      setStats(statsData)

    } catch (error) {
      console.error("Error fetching inventory data:", error)
    } finally {
      setLoading(false)
    }
  }


  const handleExport = async () => {
    try {
      if (!user?.company_id) return
      
      const report = await inventoryService.generateInventoryReport(user.company_id)
      
      // Convertir en CSV
      const headers = ['Nom', 'SKU', 'Catégorie', 'Stock Actuel', 'Stock Min', 'Seuil Critique', 'Prix Unitaire', 'Valeur Totale']
      const csvData = report.map(item => [
        item.name,
        item.sku || '',
        item.category?.name || '',
        item.current_stock,
        item.min_stock_level,
        item.critical_threshold,
        item.unit_price,
        item.total_value
      ])
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')
      
      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventaire-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      
    } catch (error) {
      console.error("Error exporting inventory:", error)
      alert("Erreur lors de l'exportation")
    }
  }

  const handleAddEntry = () => {
    router.push("/inventory/entry/new")
  }

  const handleAddMaterial = () => {
    router.push("/inventory/materials/new")
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
                    <h1 className="text-3xl font-bold text-gray-900">Gestion de Stock</h1>
                    <p className="text-gray-600 mt-1">
                      Suivi complet de vos inventaires
                      {stats && ` • ${stats.totalMaterials} matériaux • Valeur: ${stats.totalValue?.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={handleExport}
                      disabled={loading}
                    >
                      <Download size={18} />
                      Exporter
                    </Button>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={handleAddEntry}
                    >
                      <Plus size={18} />
                      Nouvelle Entrée
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 bg-transparent"
                      onClick={handleAddMaterial}
                    >
                      <Package size={18} />
                      Ajouter Matériau
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <InventoryStats />

                {/* Filtres */}
                <Card>
                  <div className="p-4 flex items-center gap-3">
                    <Search size={18} className="text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher un matériau..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={loading}
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      disabled={loading}
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories
                        .filter(cat => cat && cat.id && cat.name)
                        .map(category => (
                          <option 
                            key={category.id} 
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </Card>

                {/* Sections Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <InventoryList 
                      searchTerm={searchTerm} 
                      filterCategory={filterCategory}
                    />
                  </div>
                  <div className="space-y-6">
                    <CriticalThresholds />
                    <StockMovements />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}