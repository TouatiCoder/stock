"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CostsDashboard } from "@/components/costs/costs-dashboard"
import { SuppliersList } from "@/components/costs/suppliers-list"
import { OrdersList } from "@/components/costs/orders-list"

export default function CostsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "suppliers" | "orders">("overview")

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
                  <Button className="flex items-center gap-2">
                    <Plus size={18} />
                    Nouvelle Commande
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  {["overview", "suppliers", "orders"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab === "overview" && "Vue d'ensemble"}
                      {tab === "suppliers" && "Fournisseurs"}
                      {tab === "orders" && "Commandes"}
                    </button>
                  ))}
                </div>

                {/* Content */}
                {activeTab === "overview" && <CostsDashboard />}
                {activeTab === "suppliers" && <SuppliersList />}
                {activeTab === "orders" && <OrdersList />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
