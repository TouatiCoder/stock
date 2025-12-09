"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { InventoryList } from "@/components/inventory/inventory-list"
import { AddItemDialog } from "@/components/inventory/add-item-dialog"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { InventoryItem } from "@/lib/types"

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalValue: 0,
    categoryCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient()
        
        const { data: items, error } = await supabase
          .from("inventory_items")
          .select("*")
        
        if (error) throw error
        
        if (items) {
          const totalItems = items.length
          
          // CORRECTION : Ajouter les types
          const lowStockCount = items.filter(
            (item: InventoryItem) => item.quantity_on_hand <= item.reorder_level
          ).length
          
          // CORRECTION : Ajouter les types
          const totalValue = items.reduce(
            (sum: number, item: InventoryItem) => 
              sum + (item.quantity_on_hand * item.unit_cost_mad), 
            0
          )
          
          // CORRECTION : Ajouter le type
          const uniqueCategories = new Set(
            items.map((item: InventoryItem) => item.category)
          )
          
          setStats({
            totalItems,
            lowStockCount,
            totalValue,
            categoryCount: uniqueCategories.size
          })
        }
      } catch (error) {
        console.error("Error fetching inventory stats:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])

  if (loading) {
    return <div className="p-6">Loading inventory statistics...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500">Manage your stock and materials</p>
        </div>
        <AddItemDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Total Items</p>
          <p className="text-3xl font-bold text-slate-900">
            {stats.totalItems.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">
            {stats.categoryCount} {stats.categoryCount === 1 ? 'category' : 'categories'}
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Low Stock</p>
          <p className="text-3xl font-bold text-orange-600">
            {stats.lowStockCount}
          </p>
          <p className="text-xs text-orange-600">Below reorder level</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Stock Value</p>
          <p className="text-3xl font-bold text-slate-900">
            {stats.totalValue.toLocaleString('fr-MA')} MAD
          </p>
          <p className="text-xs text-slate-400">Total inventory value</p>
        </Card>
      </div>

      <Card>
        <InventoryList />
      </Card>
    </div>
  )
}