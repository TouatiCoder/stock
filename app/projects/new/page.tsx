"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useCommonTranslations, useLocale, useProjectTranslations } from "@/components/LocaleProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/mysql/auth-context"

export default function NewProjectPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const tProject = useProjectTranslations()
  const tCommon = useCommonTranslations()
  const { dir } = useLocale()
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
    if (isLoading) return
    if (!user) router.push("/login")
  }, [isLoading, router, user])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">{tProject("authChecking")}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">{tProject("redirectingToLogin")}</p>
        </div>
      </div>
    )
  }

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
    if (!user.companyId) {
      toast.error(tProject("companyMissingError"))
      setSubmitError(`${tProject("companyMissingError")} (Code: N/A)`)
      return
    }

    try {
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
        projectType: formData.project_type === "Other" ? formData.project_type_other || tProject("otherType") : formData.project_type,
        status: formData.status,
        totalBudget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        startDate: formData.start_date || null,
        endDate: formData.planned_end_date || null,
        companyId: user.companyId,
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!res.ok) {
        let serverMsg = ""
        try {
          const errJson = await res.json()
          serverMsg = errJson?.error || ""
        } catch {}
        throw new Error(serverMsg || `Failed to create project (HTTP ${res.status})`)
      }

      toast.success(tProject("createdSuccess"))
      setTimeout(() => router.push("/projects"), 1500)
    } catch (error: any) {
      let errorMessage = error.message || tProject("genericCreateError")
      if (error.code === "23503") errorMessage = tProject("referenceError")
      else if (error.code === "23505") errorMessage = tProject("duplicateNameError")
      else if (error.code === "42501") errorMessage = tProject("permissionError")
      else if (error.message?.includes("network") || error.message?.includes("fetch")) errorMessage = tProject("networkError")
      setSubmitError(`${errorMessage} (Code: ${error.code || "N/A"})`)
      toast.error(errorMessage)
    }
  }

  const handleCancel = () => {
    if (formData.name || formData.client_name) {
      if (confirm(tProject("cancelConfirm"))) router.push("/projects")
      return
    }
    router.push("/projects")
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "ml-2 rotate-180" : "mr-2"}`} />
                {tCommon("back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tProject("newProject")}</h1>
              <p className="text-gray-600">{tProject("newProjectSubtitle")}</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="mb-1 text-sm font-medium text-red-900">{tProject("createErrorTitle")}</h3>
                <p className="text-sm text-red-700">{submitError}</p>
                <p className="mt-2 text-xs text-red-600">{tProject("createErrorHelp")}</p>
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
                  <Label htmlFor="name" className="flex items-center gap-1">
                    {tProject("projectName")} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder={tProject("projectNameExample")} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">{tProject("clientName")}</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    placeholder={tProject("clientNameExample")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_email">{tProject("clientEmail")}</Label>
                    <Input
                      id="client_email"
                      name="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={handleChange}
                      placeholder={tProject("clientEmailExample")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_phone">{tProject("clientPhone")}</Label>
                    <Input
                      id="client_phone"
                      name="client_phone"
                      value={formData.client_phone}
                      onChange={handleChange}
                      placeholder={tProject("clientPhoneExample")}
                    />
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
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="R+2">{tProject("rPlus2Residential")}</option>
                      <option value="Villa">{tProject("villa")}</option>
                      <option value="Immeuble">{tProject("building")}</option>
                      <option value="Commercial">{tProject("commercial")}</option>
                      <option value="Industrial">{tProject("industrial")}</option>
                      <option value="Other">{tProject("otherType")}</option>
                    </select>
                  </div>

                  {formData.project_type === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="project_type_other">{tProject("specifyType")}</Label>
                      <Input
                        id="project_type_other"
                        name="project_type_other"
                        value={formData.project_type_other}
                        onChange={handleChange}
                        placeholder={tProject("customTypeExample")}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">{tProject("initialStatus")}</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder={tProject("addressExample")} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">{tCommon("city")}</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder={tProject("cityExample")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">{tProject("postalCode")}</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder={tProject("postalCodeExample")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("budget")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="total_budget">{tProject("budgetTotalMad")}</Label>
                  <Input
                    id="total_budget"
                    name="total_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_budget}
                    onChange={handleChange}
                    placeholder={tProject("budgetExample")}
                  />
                  <p className="mt-1 text-xs text-gray-500">{tProject("budgetHint")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("planning")}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">{tProject("startDate")}</Label>
                    <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planned_end_date">{tProject("plannedEndDate")}</Label>
                    <Input
                      id="planned_end_date"
                      name="planned_end_date"
                      type="date"
                      value={formData.planned_end_date}
                      onChange={handleChange}
                      min={formData.start_date || today}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{tProject("description")}</h2>
                <div className="space-y-2">
                  <Label htmlFor="description">{tProject("projectDescriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={tProject("projectDescriptionPlaceholder")}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                <Button type="button" variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4" />
                  {tCommon("create")}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
