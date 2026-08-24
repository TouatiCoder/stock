"use client"

import { useEffect, useState } from "react"
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

export default function EditWarehousePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const tWarehouse = useWarehouseTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
    isMain: false,
  })

  useEffect(() => {
    const loadWarehouse = async () => {
      if (!user?.companyId) return
      try {
        setLoadingData(true)
        const res = await fetch(`/api/warehouses/${params.id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to load warehouse")
        }

        setFormData({
          name: data.name || "",
          location: data.location || "",
          capacity: data.capacity != null ? String(data.capacity) : "",
          isMain: data.isMain || false,
        })
      } catch (error: any) {
        toast.error(error.message || "Failed to load warehouse")
        router.push("/warehouses")
      } finally {
        setLoadingData(false)
      }
    }

    loadWarehouse()
  }, [params.id, router, user?.companyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(tWarehouse("nameRequiredError"))
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`/api/warehouses/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location || null,
          capacity: formData.capacity ? parseFloat(formData.capacity) : null,
          isMain: formData.isMain,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || tWarehouse("updateError"))
      }

      toast.success(tWarehouse("updatedSuccess"))
      router.push("/warehouses")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || tWarehouse("updateError"))
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6 text-sm text-gray-600">{tCommon("loading")}</Card>
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold text-gray-900">{tWarehouse("editWarehouse")}</h1>
              <p className="text-gray-600">{tWarehouse("editWarehouseSubtitle")}</p>
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
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <input
                  id="isMain"
                  type="checkbox"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  disabled={loading}
                  className="h-4 w-4 cursor-pointer accent-amber-500"
                />
                <div>
                  <Label htmlFor="isMain" className="cursor-pointer font-semibold text-amber-800">
                    {tWarehouse("mainWarehouse")}
                  </Label>
                  <p className="text-xs text-amber-600">{tWarehouse("mainWarehouseDescription")}</p>
                </div>
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
                      {tCommon("loading")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {tCommon("save")}
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
