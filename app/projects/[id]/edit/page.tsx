"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useCommonTranslations, useLocale, useProjectTranslations } from "@/components/LocaleProvider"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
  const { user } = useAuth()
  const tProject = useProjectTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    address: "",
    city: "",
    postal_code: "",
    project_type: "R+2",
    project_type_other: "",
    total_budget: "",
    start_date: "",
    planned_end_date: "",
    status: "planning",
  })

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) throw new Error("Failed to fetch project")
        const project = await response.json()

        const fixedTypes = ["R+2", "Villa", "Immeuble", "Commercial", "Industrial"]
        setFormData({
          name: project.name || "",
          description: project.description || "",
          client_name: project.clientName || "",
          client_email: project.clientEmail || "",
          client_phone: project.clientPhone || "",
          address: project.address || "",
          city: project.city || "",
          postal_code: project.postalCode || "",
          project_type: fixedTypes.includes(project.projectType) ? project.projectType : project.projectType ? "Other" : "R+2",
          project_type_other: fixedTypes.includes(project.projectType) ? "" : project.projectType || "",
          total_budget: project.totalBudget?.toString() || "",
          start_date: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
          planned_end_date: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
          status: project.status || "planning",
        })
      } catch (error) {
        console.error("Error fetching project:", error)
        toast.error(tProject("loadError"))
        router.push("/projects")
      } finally {
        setFetching(false)
      }
    }

    if (projectId) fetchProject()
  }, [projectId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (submitError) setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error(tProject("nameRequiredError"))
      return
    }

    try {
      setLoading(true)
      setSubmitError(null)

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        clientName: formData.client_name.trim() || null,
        clientEmail: formData.client_email.trim() || null,
        clientPhone: formData.client_phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        postalCode: formData.postal_code.trim() || null,
        projectType: formData.project_type === "Other" ? formData.project_type_other.trim() || tProject("otherType") : formData.project_type,
        status: formData.status,
        totalBudget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        startDate: formData.start_date || null,
        endDate: formData.planned_end_date || null,
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!res.ok) {
        let message = `Failed to update project (HTTP ${res.status})`
        try {
          const data = await res.json()
          if (data?.error) message = data.error
        } catch {}
        throw new Error(message)
      }

      toast.success(tProject("updatedSuccess"))
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (error: any) {
      setSubmitError(error.message || tProject("updateError"))
      toast.error(tProject("updateError"))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "ml-2 rotate-180" : "mr-2"}`} />
                {tCommon("back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tProject("editTitle")}</h1>
              <p className="text-gray-600">{tProject("editSubtitle")}</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="mb-1 text-sm font-medium text-red-900">{tProject("updateErrorTitle")}</h3>
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-8 p-6">
              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("basicInfo")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {tProject("projectName")} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">{tProject("clientName")}</Label>
                  <Input id="client_name" name="client_name" value={formData.client_name} onChange={handleChange} disabled={loading} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_email">{tProject("clientEmail")}</Label>
                    <Input id="client_email" name="client_email" type="email" value={formData.client_email} onChange={handleChange} disabled={loading} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_phone">{tProject("clientPhone")}</Label>
                    <Input id="client_phone" name="client_phone" value={formData.client_phone} onChange={handleChange} disabled={loading} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project_type">{tProject("projectType")}</Label>
                    <select
                      id="project_type"
                      name="project_type"
                      value={formData.project_type}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="R+2">{tProject("rPlus2Residential")}</option>
                      <option value="Villa">{tProject("villa")}</option>
                      <option value="Immeuble">{tProject("building")}</option>
                      <option value="Commercial">{tProject("commercial")}</option>
                      <option value="Industrial">{tProject("industrial")}</option>
                      <option value="Other">{tProject("otherType")}</option>
                    </select>
                    {formData.project_type === "Other" && (
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="project_type_other">{tProject("customType")}</Label>
                        <Input
                          id="project_type_other"
                          name="project_type_other"
                          value={formData.project_type_other}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{tCommon("status")}</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="planning">{tProject("planning")}</option>
                      <option value="active">{tProject("active")}</option>
                      <option value="paused">{tProject("paused")}</option>
                      <option value="completed">{tProject("completed")}</option>
                      <option value="cancelled">{tProject("cancelled")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("location")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="address">{tCommon("address")}</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={loading} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">{tCommon("city")}</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">{tProject("postalCode")}</Label>
                    <Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} disabled={loading} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("budgetSchedule")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="total_budget">{tProject("budgetTotalMad")}</Label>
                  <Input id="total_budget" name="total_budget" type="number" step="0.01" value={formData.total_budget} onChange={handleChange} disabled={loading} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">{tProject("startDate")}</Label>
                    <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planned_end_date">{tProject("plannedEndDate")}</Label>
                    <Input
                      id="planned_end_date"
                      name="planned_end_date"
                      type="date"
                      value={formData.planned_end_date}
                      onChange={handleChange}
                      min={formData.start_date}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("description")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="description">{tProject("projectDescriptionLabel")}</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} disabled={loading} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                <Link href={`/projects/${projectId}`}>
                  <Button type="button" variant="outline" disabled={loading}>
                    <X className="mr-2 h-4 w-4" />
                    {tCommon("cancel")}
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {tCommon("saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tCommon("update")}
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
