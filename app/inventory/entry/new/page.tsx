"use client"

import { useEffect, useState } from "react"
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
import { useAuth } from "@/lib/mysql/auth-context"

export default function NewEntryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])

  const [formData, setFormData] = useState({
    material_id: "",
    quantity: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.companyId) fetchMaterials()
  }, [user?.companyId])

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/materials?companyId=${user?.companyId}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error("Error fetching materials", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.material_id) newErrors.material_id = tInventory("materialRequiredError")
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
          material_id: formData.material_id,
          quantity: formData.quantity,
          companyId: user?.companyId,
        }),
      })

      if (!res.ok) throw new Error(tInventory("saveError"))

      toast.success(tInventory("entrySaved"))
      setTimeout(() => router.push("/inventory"), 1000)
    } catch {
      toast.error(tInventory("saveError"))
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
              <Select value={formData.material_id} onValueChange={(val) => setFormData({ ...formData, material_id: val })}>
                <SelectTrigger className={errors.material_id ? "border-red-500" : ""}>
                  <SelectValue placeholder={tInventory("selectMaterialPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.material_id && <p className="text-sm text-red-500">{errors.material_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {tInventory("quantity")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tInventory("savingEntry") : (
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
