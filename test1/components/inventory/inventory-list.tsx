"use client"

import { useState } from "react"
import type { InventoryItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InventoryListProps {
  items: InventoryItem[]
  onItemAdded?: (item: InventoryItem) => void // optionnel si tu veux gérer ajout ici
}

export function InventoryList({ items }: InventoryListProps) {
  const [search, setSearch] = useState("")

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="p-4 border-b border-slate-200">
        <Input
          type="search"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Unit Cost</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
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
                      <Badge className="inline-flex items-center gap-1 bg-orange-100 text-orange-800">
                        <AlertCircle size={14} /> Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm"><Edit2 size={16} /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit this item</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600"><Trash2 size={16} /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete this item</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
