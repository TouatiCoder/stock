"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { useCommonTranslations, useInventoryTranslations, useLocale } from "@/components/LocaleProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/mysql/auth-context"

type WarehouseStock = {
  warehouseId: string
  warehouseName: string
  quantity: number
}

type MaterialOption = {
  id: string
  name: string
  unit: string
  warehouseStocks: WarehouseStock[]
}

type WarehouseOption = {
  id: string
  name: string
}

export default function StockTransferPage() {
  const router = useRouter()
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    material_id: "",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    quantity: "",
    notes: "",
  })

  useEffect(() => {
    if (!user?.companyId) return
    void Promise.all([fetchMaterials(), fetchWarehouses()])
  }, [user?.companyId])

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === formData.material_id) || null,
    [materials, formData.material_id],
  )

  const sourceWarehouseOptions = useMemo(() => {
    if (!selectedMaterial) return []
    return selectedMaterial.warehouseStocks.filter((row) => row.quantity > 0)
  }, [selectedMaterial])

  const selectedSourceStock = useMemo(
    () => sourceWarehouseOptions.find((row) => row.warehouseId === formData.source_warehouse_id) || null,
    [sourceWarehouseOptions, formData.source_warehouse_id],
  )

  const destinationWarehouseOptions = useMemo(
    () => warehouses.filter((warehouse) => warehouse.id !== formData.source_warehouse_id),
    [warehouses, formData.source_warehouse_id],
  )

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/inventory/materials", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch materials")

      const data = await res.json()
      const normalizedMaterials = Array.isArray(data)
        ? data.map((material: any) => ({
            id: material.id,
            name: material.name || "",
            unit: material.unit || tInventory("unitSingle"),
            warehouseStocks: Array.isArray(material.inventory)
              ? material.inventory
                  .filter((row: any) => row.warehouseId && row.warehouse?.name)
                  .map((row: any) => ({
                    warehouseId: String(row.warehouseId),
                    warehouseName: String(row.warehouse?.name),
                    quantity: Number(row.quantity ?? 0),
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
    const quantity = parseFloat(formData.quantity)

    if (!formData.material_id) newErrors.material_id = tInventory("materialRequiredError")
    if (!formData.source_warehouse_id) newErrors.source_warehouse_id = tInventory("sourceWarehouseRequiredError")
    if (!formData.destination_warehouse_id) {
      newErrors.destination_warehouse_id = tInventory("destinationWarehouseRequiredError")
    }
    if (formData.source_warehouse_id && formData.source_warehouse_id === formData.destination_warehouse_id) {
      newErrors.destination_warehouse_id = tInventory("differentWarehouseError")
    }
    if (!formData.quantity || quantity <= 0) {
      newErrors.quantity = tInventory("quantityPositiveError")
    } else if (selectedSourceStock && quantity > selectedSourceStock.quantity) {
      newErrors.quantity = tInventory("insufficientSourceStock")
    }

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
          operation: "transfer",
          material_id: formData.material_id,
          source_warehouse_id: formData.source_warehouse_id,
          destination_warehouse_id: formData.destination_warehouse_id,
          quantity: formData.quantity,
          notes: formData.notes,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || tInventory("transferSaveError"))

      toast.success(tInventory("transferSaved"))
      setTimeout(() => router.push("/inventory"), 800)
    } catch (error: any) {
      toast.error(error?.message || tInventory("transferSaveError"))
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
              <h1 className="text-3xl font-bold text-gray-900">{tInventory("newStockTransferTitle")}</h1>
              <p className="text-gray-600">{tInventory("newStockTransferSubtitle")}</p>
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
                  setFormData({
                    material_id: val,
                    source_warehouse_id: "",
                    destination_warehouse_id: "",
                    quantity: "",
                    notes: formData.notes,
                  })
                  setErrors({})
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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source-warehouse">
                  {tInventory("sourceWarehouse")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.source_warehouse_id}
                  onValueChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      source_warehouse_id: val,
                      destination_warehouse_id: prev.destination_warehouse_id === val ? "" : prev.destination_warehouse_id,
                    }))
                    setErrors((prev) => ({ ...prev, source_warehouse_id: "", destination_warehouse_id: "" }))
                  }}
                >
                  <SelectTrigger className={errors.source_warehouse_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={tInventory("selectSourceWarehouse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceWarehouseOptions.map((warehouse) => (
                      <SelectItem key={warehouse.warehouseId} value={warehouse.warehouseId}>
                        {warehouse.warehouseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.source_warehouse_id && <p className="text-sm text-red-500">{errors.source_warehouse_id}</p>}
                {selectedSourceStock && (
                  <p className="text-sm text-gray-500">
                    {tInventory("availableInSource")}: {selectedSourceStock.quantity} {selectedMaterial?.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination-warehouse">
                  {tInventory("destinationWarehouse")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.destination_warehouse_id}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, destination_warehouse_id: val }))
                    setErrors((prev) => ({ ...prev, destination_warehouse_id: "" }))
                  }}
                >
                  <SelectTrigger className={errors.destination_warehouse_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={tInventory("selectDestinationWarehouse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationWarehouseOptions.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destination_warehouse_id && (
                  <p className="text-sm text-red-500">{errors.destination_warehouse_id}</p>
                )}
              </div>
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
                placeholder={tInventory("transferNotesPlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  tInventory("savingTransfer")
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    <Save className="h-4 w-4" />
                    {tInventory("saveTransfer")}
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
