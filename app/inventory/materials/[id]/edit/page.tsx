"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, Package, AlertCircle, Plus, Palette, Tag, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/mysql/auth-context"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCommonTranslations, useInventoryTranslations } from "@/components/LocaleProvider"
import { ColorPicker } from "@/components/ui/color-picker"
import { ManageCategoriesDialog } from "@/components/inventory/manage-categories-dialog"

interface Material {
  id: string
  name: string
  description?: string | null
  sku?: string | null
  barcode?: string | null
  category_id: string
  company_id: string
  unit_of_measure: string
  unit_weight?: number | null
  unit_price: number
  min_stock_level: number
  max_stock_level?: number | null
  critical_threshold: number
  current_stock: number
  reserved_stock: number
  total_value: number
  storage_location?: string | null
  technical_specifications?: Record<string, any> | null
  supplier_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
const DEFAULT_UNIT = "unit"
const PRESET_UNIT_VALUES = ["kg", "ton", "m3", "m2", "m", "unit", "bag", "pallet"] as const
function getCategoryColors(companyId: string): Record<string, string> {
  try {
    const stored = localStorage.getItem(`categoryColors_${companyId}`)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveCategoryColor(companyId: string, name: string, color: string) {
  try {
    const existing = getCategoryColors(companyId)
    existing[name] = color
    localStorage.setItem(`categoryColors_${companyId}`, JSON.stringify(existing))
  } catch {}
}

const mapCategoryOptions = (categoryNames: string[], colors: Record<string, string>) =>
  categoryNames.map((categoryName) => ({
    id: categoryName,
    name: categoryName,
    color_code: colors[categoryName] || "#3B82F6",
  }))
 
function isPresetUnit(value: string): value is (typeof PRESET_UNIT_VALUES)[number] {
  return PRESET_UNIT_VALUES.includes(value as (typeof PRESET_UNIT_VALUES)[number])
}

export default function EditMaterialPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const tInventory = useInventoryTranslations()
  const tCommon = useCommonTranslations()

  const [loading, setLoading] = useState(false)
  const [loadingMaterial, setLoadingMaterial] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [showManageCategoriesDialog, setShowManageCategoriesDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6")
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    unit_of_measure: DEFAULT_UNIT,
    custom_unit: "",
    unit_price: "",
    min_stock_level: "",
    max_stock_level: "",
    supplier_id: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.companyId) {
      fetchCategories()
      fetchSuppliers()
      fetchMaterial()
    }
  }, [user?.companyId, params.id])

  const fetchMaterial = async () => {
    try {
      setLoadingMaterial(true)

      const response = await fetch(`/api/materials/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch material")
      }

      const material = await response.json()

      // Use inventory data from the material response
      const latestInventory = material.inventory && material.inventory.length > 0 ? material.inventory[0] : null
      const materialUnit = material.unit || DEFAULT_UNIT
      const hasCustomUnit = !isPresetUnit(materialUnit) && materialUnit !== "other"
      const normalizedCategory = /^temp-\d+$/i.test(material.category || "") ? "" : material.category || ""

      setFormData({
        name: material.name || "",
        description: material.description || "",
        category_id: normalizedCategory,
        unit_of_measure: isPresetUnit(materialUnit) ? materialUnit : "other",
        custom_unit: hasCustomUnit ? materialUnit : "",
        unit_price: material.unitPrice != null ? material.unitPrice.toString() : "",
        min_stock_level: latestInventory?.minThreshold != null ? latestInventory.minThreshold.toString() : "",
        max_stock_level: latestInventory?.maxThreshold != null ? latestInventory.maxThreshold.toString() : "",
        supplier_id: material.supplierId || "",
      })
    } catch (error) {
      console.error("Error fetching material:", error)
      toast.error(tInventory("materialLoadError"))
      router.push("/inventory")
    } finally {
      setLoadingMaterial(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)

      if (!user?.companyId) return

      const response = await fetch("/api/inventory/materials/filters")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch categories")
      }

      const colors = getCategoryColors(user!.companyId)
      setCategories(Array.isArray(data?.categories) ? mapCategoryOptions(data.categories, colors) : [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toast.error(tInventory("categoriesLoadError"))

      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      if (!user?.companyId) return

      const response = await fetch(`/api/suppliers?companyId=${user.companyId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to fetch suppliers")
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user?.companyId) {
      toast.error(tInventory("categoryNameRequired"))
      return
    }

    try {
      setCreatingCategory(true)

      const newCategory = {
        id: newCategoryName.trim(),
        name: newCategoryName.trim(),
        color_code: newCategoryColor,
      }

      saveCategoryColor(user!.companyId, newCategory.name, newCategoryColor)

      const data = newCategory
      const updatedCategories = [...categories, data]
      setCategories(updatedCategories)
      setFormData((prev) => ({ ...prev, category_id: data.name }))

      setShowNewCategoryDialog(false)
      setNewCategoryName("")
      setNewCategoryColor("#3B82F6")

      toast.success(`${tInventory("categoryCreatedPrefix")} \"${data.name}\" ${tInventory("categoryCreatedSuffix")}`)
    } catch (error: any) {
      console.error("Error creating category:", error)
      toast.error(error.message || tInventory("genericCreateError"))
    } finally {
      setCreatingCategory(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = tInventory("materialNameRequired")
    }

    if (!formData.category_id) {
      newErrors.category_id = tInventory("categoryRequiredError")
    }

    if (!formData.unit_of_measure) {
      newErrors.unit_of_measure = tInventory("unitRequiredError")
    }

    if (formData.unit_of_measure === "other" && !formData.custom_unit.trim()) {
      newErrors.custom_unit = tInventory("customUnitRequiredError")
    }

    const unitPrice = parseFloat(formData.unit_price)
    if (isNaN(unitPrice) || unitPrice < 0) {
      newErrors.unit_price = tInventory("unitPriceInvalid")
    }

    const minStock = parseFloat(formData.min_stock_level)
    if (formData.min_stock_level && (isNaN(minStock) || minStock < 0)) {
      newErrors.min_stock_level = tInventory("minStockInvalid")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.companyId) {
      toast.error(tInventory("companyNotFoundError"))
      return
    }

    if (!validateForm()) {
      toast.error(tInventory("formHasErrors"))
      return
    }

    try {
      setLoading(true)
      setErrors({})

      const resolvedUnitOfMeasure = formData.unit_of_measure === "other" ? formData.custom_unit.trim() : formData.unit_of_measure
      const selectedCategory = categories.find((c) => c.id === formData.category_id || c.name === formData.category_id)
      const categoryName = selectedCategory ? selectedCategory.name : formData.category_id

      const materialData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        unit: resolvedUnitOfMeasure,
        unitPrice: parseFloat(formData.unit_price) || 0,
        category: categoryName,
        supplierId: formData.supplier_id || null,
        companyId: user.companyId,
        minStockLevel: formData.min_stock_level ? parseFloat(formData.min_stock_level) : 0,
        maxStockLevel: formData.max_stock_level ? parseFloat(formData.max_stock_level) : null,
      }

      const response = await fetch(`/api/materials/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialData),
      })

      const updatedMaterial = await response.json()

      if (!response.ok) {
        throw new Error(updatedMaterial.error || "Failed to update material")
      }

      toast.success(tInventory("materialUpdatedSuccess"), {
        description: `\"${updatedMaterial.name}\" ${tInventory("materialUpdatedDescription")}`,
      })

      setTimeout(() => {
        router.push("/inventory")
      }, 1500)
    } catch (error: any) {
      console.error("Error updating material:", error)

      let errorMessage = error.message || tInventory("genericUpdateError")

      if (error.code === "23505") {
        errorMessage = tInventory("materialExistsError")
      } else if (error.message?.includes("category_id")) {
        errorMessage = tInventory("invalidCategoryError")
      } else if (error.message?.includes("companyId")) {
        errorMessage = tInventory("companyAssociationError")
      } else if (error.code === "42501") {
        errorMessage = tInventory("permissionDeniedError")
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/inventory")
  }

  const unitOptions = [
    { value: "kg", label: tInventory("unitKg") },
    { value: "ton", label: tInventory("unitTonLabel") },
    { value: "m3", label: tInventory("unitM3Label") },
    { value: "m2", label: tInventory("unitM2Label") },
    { value: "m", label: tInventory("unitMLabel") },
    { value: "unit", label: tInventory("unitSingleLabel") },
    { value: "bag", label: tInventory("unitBagLabel") },
    { value: "pallet", label: tInventory("unitPalletLabel") },
    { value: "other", label: tInventory("unitOtherLabel") },
  ]


  if (loadingMaterial) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/inventory">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {tCommon("back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tInventory("editMaterialTitle")}</h1>
                <p className="text-gray-600">{tInventory("editMaterialSubtitle")}</p>
              </div>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      {tInventory("materialNameLabel")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={tInventory("materialNamePlaceholder")}
                      required
                      disabled={loading}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category_id" className="flex items-center gap-1">
                        {tInventory("category")} <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-1">
                        {categories.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowManageCategoriesDialog(true)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            {tInventory("manageCategoriesBtn")}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewCategoryDialog(true)}
                          className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3 me-1" />
                          {tInventory("addCategory")}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        disabled={loading || loadingCategories}
                      >
                        <SelectTrigger className={`flex-1 ${errors.category_id ? "border-red-500" : ""}`}>
                          <SelectValue
                            placeholder={
                              loadingCategories
                                ? tCommon("loading")
                                : categories.length === 0
                                  ? tInventory("noCategoryAddHint")
                                  : tInventory("selectCategory")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <SelectItem value="no-category" disabled>
                              <div className="flex items-center gap-2 text-gray-400">
                                <Tag className="h-3 w-3" />
                                <span>{tInventory("noCategoryAvailable")}</span>
                              </div>
                            </SelectItem>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color_code || "#9CA3AF" }} />
                                  <span className="truncate">{category.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {categories.length > 0 && formData.category_id && (
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center border"
                          style={{
                            backgroundColor: categories.find((c) => c.id === formData.category_id)?.color_code + "20",
                            borderColor: categories.find((c) => c.id === formData.category_id)?.color_code + "40",
                          }}
                        >
                          <Tag className="h-4 w-4" style={{ color: categories.find((c) => c.id === formData.category_id)?.color_code }} />
                        </div>
                      )}
                    </div>

                    {errors.category_id && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.category_id}
                      </p>
                    )}

                    {categories.length === 0 && !loadingCategories && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                        <p className="font-medium">{tInventory("noCategoryAvailable")}</p>
                        <p>{tInventory("createFirstCategoryHint")}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_of_measure" className="flex items-center gap-1">
                      {tInventory("unitMeasureLabel")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.unit_of_measure}
                      onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className={errors.unit_of_measure ? "border-red-500" : ""}>
                        <SelectValue placeholder={tInventory("selectUnit")} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit_of_measure && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.unit_of_measure}
                      </p>
                    )}

                    {formData.unit_of_measure === "other" && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="custom_unit" className="flex items-center gap-1">
                          {tInventory("customUnitLabel")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="custom_unit"
                          value={formData.custom_unit}
                          onChange={(e) => setFormData({ ...formData, custom_unit: e.target.value })}
                          placeholder={tInventory("customUnitPlaceholder")}
                          disabled={loading}
                          className={errors.custom_unit ? "border-red-500" : ""}
                        />
                        {errors.custom_unit && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.custom_unit}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_price" className="flex items-center gap-1">
                      {tInventory("unitPriceMadLabel")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      placeholder="0.00"
                      required
                      disabled={loading}
                      className={errors.unit_price ? "border-red-500" : ""}
                    />
                    {errors.unit_price && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.unit_price}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">{tInventory("supplier")}</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                      disabled={loading || suppliers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={suppliers.length === 0 ? tInventory("noSupplier") : tInventory("selectSupplier")} />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_stock_level">{tInventory("minStockLabel")}</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      className={errors.min_stock_level ? "border-red-500" : ""}
                    />
                    {errors.min_stock_level && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.min_stock_level}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{tInventory("alertThresholdHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_stock_level">{tInventory("maxStockLabel")}</Label>
                    <Input
                      id="max_stock_level"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_stock_level}
                      onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">{tInventory("optional")}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{tInventory("descriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={tInventory("descriptionPlaceholder")}
                    rows={3}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">{tInventory("optional")}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {tCommon("cancel")}
                  </Button>
                  <Button type="submit" disabled={loading || categories.length === 0} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                        {tInventory("updating")}
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        {tInventory("updateMaterial")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {tInventory("newCategoryTitle")}
            </DialogTitle>
            <DialogDescription>{tInventory("newCategoryDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">{tInventory("categoryNameLabel")}</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={tInventory("categoryNamePlaceholder")}
                disabled={creatingCategory}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {tInventory("colorLabel")}
              </Label>
              <ColorPicker
                value={newCategoryColor}
                onChange={setNewCategoryColor}
                disabled={creatingCategory}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCategoryDialog(false)}
              disabled={creatingCategory}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingCategory ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {tInventory("creating")}
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4 me-2" />
                  {tInventory("createCategory")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageCategoriesDialog
        open={showManageCategoriesDialog}
        onOpenChange={setShowManageCategoriesDialog}
        categories={categories}
        companyId={user?.companyId || ""}
        onCategoriesChange={setCategories}
        onCategoryDeleted={(deletedName) => {
          if (formData.category_id === deletedName) {
            setFormData((prev) => ({ ...prev, category_id: "" }))
          }
        }}
        onAllReset={() => setFormData((prev) => ({ ...prev, category_id: "" }))}
        getCategoryColors={getCategoryColors}
        saveCategoryColor={saveCategoryColor}
      />
    </>
  )
}
