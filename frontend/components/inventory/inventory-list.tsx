"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { InventoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, AlertCircle } from "lucide-react"

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("inventory_items").select("*").order("name")

        if (data) setItems(data as InventoryItem[])
      } catch (error) {
        console.error("Error fetching inventory:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading inventory...</div>
  }

  return (
    <div className="space-y-4">
      <div className="p-6 border-b border-slate-200">
        <Input
          type="search"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Unit Cost</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isLowStock = item.quantity_on_hand <= item.reorder_level
              return (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {item.quantity_on_hand} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{item.unit_cost_mad.toLocaleString()} MAD</td>
                  <td className="px-6 py-4 text-sm">
                    {isLowStock ? (
                      <Badge className="gap-1 bg-orange-100 text-orange-800">
                        <AlertCircle size={14} />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
