"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

const categories = [
  "Matériaux de construction",
  "Acier et ferraille",
  "Béton et granulats",
  "Bois et menuiserie",
  "Électricité",
  "Plomberie",
  "Équipements",
]

const units = ["pièce", "kg", "litre", "m", "m²", "m³", "paquet", "boîte"]

export function AddItemDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: categories[0],
    unit: units[0],
    unit_cost_mad: "",
    quantity_on_hand: "0",
    reorder_level: "10",
    description: "",
  })

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("inventory_items").insert([
        {
          ...formData,
          unit_cost_mad: Number.parseFloat(formData.unit_cost_mad),
          quantity_on_hand: Number.parseInt(formData.quantity_on_hand),
          reorder_level: Number.parseInt(formData.reorder_level),
        },
      ])

      if (error) throw error

      setFormData({
        name: "",
        sku: "",
        category: categories[0],
        unit: units[0],
        unit_cost_mad: "",
        quantity_on_hand: "0",
        reorder_level: "10",
        description: "",
      })
      setOpen(false)
    } catch (error) {
      console.error("Error adding item:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Add a new item to your inventory</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Name *</label>
            <Input
              placeholder="e.g., Steel Bars"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SKU *</label>
            <Input
              placeholder="e.g., STL-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Unit</label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Unit Cost (MAD) *</label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.unit_cost_mad}
              onChange={(e) => setFormData({ ...formData, unit_cost_mad: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Quantity</label>
            <Input
              type="number"
              placeholder="0"
              value={formData.quantity_on_hand}
              onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Reorder Level</label>
            <Input
              type="number"
              placeholder="10"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Additional notes about this item"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
