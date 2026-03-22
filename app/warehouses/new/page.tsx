"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useCommonTranslations, useLocale, useWarehouseTranslations } from "@/components/LocaleProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export default function NewWarehousePage() {
  const router = useRouter()
  const { user } = useAuth()
  const tWarehouse = useWarehouseTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.companyId) {
      toast.error(tWarehouse("notConnected"))
      return
    }

    if (!formData.name.trim()) {
      toast.error(tWarehouse("nameRequiredError"))
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user.companyId,
          name: formData.name,
          location: formData.location || null,
          capacity: formData.capacity ? parseFloat(formData.capacity) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || tWarehouse("createError"))
      }

      toast.success(tWarehouse("createdSuccess"))
      router.push("/warehouses")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || tWarehouse("createError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/warehouses">
              <Button variant="outline" size="sm">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "ml-2 rotate-180" : "mr-2"}`} />
                {tCommon("back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tWarehouse("newWarehouse")}</h1>
              <p className="text-gray-600">{tWarehouse("newWarehouseSubtitle")}</p>
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="name">{tWarehouse("warehouseNameRequired")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={tWarehouse("warehouseNameExample")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{tWarehouse("location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={tWarehouse("locationExample")}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">{tWarehouse("capacity")}</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder={tWarehouse("capacityPlaceholder")}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/warehouses")} disabled={loading} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {tWarehouse("creating")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {tCommon("create")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
