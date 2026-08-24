"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { useCommonTranslations, useInventoryTranslations, useLocale } from "@/components/LocaleProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/mysql/auth-context"

type WarehouseOption = {
  id: string
  name: string
  location?: string | null
  isMain?: boolean
}

type MaterialInventoryRow = {
  id: string
  quantity: number
  warehouseId: string | null
  warehouse?: {
    id: string
    name: string
  } | null
}

type MaterialOption = {
  id: string
  name: string
  unit: string
  inventory?: MaterialInventoryRow[]
}

export default function NewEntryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])

  const [formData, setFormData] = useState({
    material_id: "",
    warehouse_id: "",
    quantity: "",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user?.companyId) return
    void Promise.all([fetchMaterials(), fetchWarehouses()])
  }, [user?.companyId])

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === formData.material_id) || null,
    [materials, formData.material_id],
  )

  const totalStock = useMemo(() => {
    if (!selectedMaterial?.inventory) return 0
    return selectedMaterial.inventory.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
  }, [selectedMaterial])

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/inventory/materials", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch materials")

      const data = await res.json()
      const normalizedMaterials = Array.isArray(data)
        ? data.map((material: any) => ({
            id: material.id,
            name: material.name || "",
            unit: material.unit || material.unit_of_measure || tInventory("unitSingle"),
            inventory: Array.isArray(material.inventory)
              ? material.inventory.map((row: any) => ({
                  id: row.id,
                  quantity: Number(row.quantity ?? 0),
                  warehouseId: row.warehouseId ?? null,
                  warehouse: row.warehouse ?? null,
                }))
              : [],
          }))
        : []

      setMaterials(normalizedMaterials)
    } catch (error) {
      console.error("Error fetching materials", error)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch warehouses")
      const data = await res.json()
      setWarehouses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching warehouses", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.material_id) newErrors.material_id = tInventory("materialRequiredError")
    if (!formData.warehouse_id) newErrors.warehouse_id = tInventory("warehouseRequiredError")
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = tInventory("quantityPositiveError")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "entry",
          material_id: formData.material_id,
          warehouse_id: formData.warehouse_id,
          quantity: formData.quantity,
          notes: formData.notes,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || tInventory("saveError"))

      toast.success(tInventory("entrySaved"))
      setTimeout(() => router.push("/inventory"), 800)
    } catch (error: any) {
      toast.error(error?.message || tInventory("saveError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "ml-2 rotate-180" : "mr-2"}`} />
                {tCommon("back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tInventory("newStockEntryTitle")}</h1>
              <p className="text-gray-600">{tInventory("newStockEntrySubtitle")}</p>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="material">
                {tInventory("materials")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.material_id}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, material_id: val }))
                  setErrors((prev) => ({ ...prev, material_id: "" }))
                }}
              >
                <SelectTrigger className={errors.material_id ? "border-red-500" : ""}>
                  <SelectValue placeholder={tInventory("selectMaterialPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.material_id && <p className="text-sm text-red-500">{errors.material_id}</p>}
              {selectedMaterial && (
                <p className="text-sm text-gray-500">
                  {tInventory("tableAvailable")}: {totalStock} {selectedMaterial.unit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">
                {tInventory("destinationWarehouse")} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, warehouse_id: val }))
                  setErrors((prev) => ({ ...prev, warehouse_id: "" }))
                }}
              >
                <SelectTrigger className={errors.warehouse_id ? "border-red-500" : ""}>
                  <SelectValue placeholder={tInventory("selectDestinationWarehouse")} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse_id && <p className="text-sm text-red-500">{errors.warehouse_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {tInventory("quantity")}
                {selectedMaterial ? ` (${selectedMaterial.unit})` : ""} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                  setErrors((prev) => ({ ...prev, quantity: "" }))
                }}
                className={errors.quantity ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{tInventory("notesOptional")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={tInventory("entryNotesPlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  tInventory("savingEntry")
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {tCommon("save")}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
