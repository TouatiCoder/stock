"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download } from "lucide-react"
import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { StockMovements } from "@/components/inventory/stock-movements"
import { CriticalThresholds } from "@/components/inventory/critical-thresholds"

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

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
                    <p className="text-gray-600 mt-1">Suivi complet de vos inventaires</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Download size={18} />
                      Exporter
                    </Button>
                    <Button className="flex items-center gap-2">
                      <Plus size={18} />
                      Nouvel Entrée
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
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                    >
                      <option value="all">Toutes les catégories</option>
                      <option value="steel">Acier</option>
                      <option value="concrete">Béton</option>
                      <option value="finishing">Finitions</option>
                      <option value="electrical">Électrique</option>
                    </select>
                  </div>
                </Card>

                {/* Sections Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <InventoryList searchTerm={searchTerm} filterCategory={filterCategory} />
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
