"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Warehouse,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

import {
  useCommonTranslations,
  useInventoryTranslations,
  useLocale,
} from "@/components/LocaleProvider"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/mysql/auth-context"

// ============================================================
// TYPES
// ============================================================

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

type ApiMaterial = {
  id?: string
  name?: string
  unit?: string
  inventory?: Array<{
    warehouseId?: string
    quantity?: number | string
    warehouse?: {
      name?: string
    } | null
  }>
}

type ApiWarehouse = {
  id?: string
  name?: string
}

// ============================================================
// COMPONENT
// ============================================================

export default function StockTransferPage() {
  const router = useRouter()

  const { user } = useAuth()

  const tInventory =
    useInventoryTranslations()

  const tCommon =
    useCommonTranslations()

  const { dir, locale } =
    useLocale()

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(false)

  const [
    loadingData,
    setLoadingData,
  ] = useState(true)

  const [materials, setMaterials] =
    useState<MaterialOption[]>([])

  const [warehouses, setWarehouses] =
    useState<WarehouseOption[]>([])

  const [dataError, setDataError] =
    useState<string | null>(null)

  const [errors, setErrors] =
    useState<Record<string, string>>(
      {}
    )

  const [formData, setFormData] =
    useState({
      material_id: "",
      source_warehouse_id: "",
      destination_warehouse_id: "",
      quantity: "",
      notes: "",
    })

  // ==========================================================
  // FETCH MATERIALS
  // ==========================================================

  const fetchMaterials =
    async (): Promise<
      MaterialOption[]
    > => {
      const res = await fetch(
        "/api/inventory/materials",
        {
          credentials: "include",
          cache: "no-store",
        }
      )

      if (!res.ok) {
        throw new Error(
          "Failed to fetch materials"
        )
      }

      const data: unknown =
        await res.json()

      if (!Array.isArray(data)) {
        return []
      }

      return (data as ApiMaterial[]).map(
        (
          material: ApiMaterial
        ): MaterialOption => {
          const inventory =
            Array.isArray(
              material.inventory
            )
              ? material.inventory
              : []

          const warehouseStocks =
            inventory
              .filter(
                (
                  row
                ): row is {
                  warehouseId: string
                  quantity?: number | string
                  warehouse: {
                    name: string
                  }
                } =>
                  typeof row?.warehouseId ===
                    "string" &&
                  row.warehouse !==
                    null &&
                  typeof row.warehouse
                    ?.name === "string"
              )
              .map(
                (
                  row
                ): WarehouseStock => ({
                  warehouseId:
                    String(
                      row.warehouseId
                    ),

                  warehouseName:
                    String(
                      row.warehouse.name
                    ),

                  quantity:
                    Number(
                      row.quantity ?? 0
                    ),
                })
              )
              .filter(
                (
                  row: WarehouseStock
                ) =>
                  Number.isFinite(
                    row.quantity
                  ) &&
                  row.quantity > 0
              )

          return {
            id: String(
              material.id ?? ""
            ),

            name: String(
              material.name ?? ""
            ),

            unit:
              material.unit ||
              tInventory(
                "unitSingle"
              ),

            warehouseStocks,
          }
        }
      )
    }

  // ==========================================================
  // FETCH WAREHOUSES
  // ==========================================================

  const fetchWarehouses =
    async (): Promise<
      WarehouseOption[]
    > => {
      const res = await fetch(
        "/api/warehouses",
        {
          credentials: "include",
          cache: "no-store",
        }
      )

      if (!res.ok) {
        throw new Error(
          "Failed to fetch warehouses"
        )
      }

      const data: unknown =
        await res.json()

      if (!Array.isArray(data)) {
        return []
      }

      return (data as ApiWarehouse[])
        .map(
          (
            warehouse: ApiWarehouse
          ): WarehouseOption => ({
            id: String(
              warehouse.id ?? ""
            ),

            name: String(
              warehouse.name ?? ""
            ),
          })
        )
        .filter(
          (
            warehouse: WarehouseOption
          ) =>
            Boolean(
              warehouse.id
            ) &&
            Boolean(
              warehouse.name
            )
        )
    }

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (!user?.companyId) {
      setLoadingData(false)
      return
    }

    let cancelled = false

    const loadData =
      async () => {
        setLoadingData(true)
        setDataError(null)

        try {
          const [
            materialsResult,
            warehousesResult,
          ] = await Promise.all([
            fetchMaterials(),
            fetchWarehouses(),
          ])

          if (cancelled) {
            return
          }

          setMaterials(
            materialsResult
          )

          setWarehouses(
            warehousesResult
          )
        } catch (error) {
          console.error(
            "Error loading stock transfer data:",
            error
          )

          if (!cancelled) {
            setDataError(
              tInventory(
                "transferLoadError"
              ) ||
                "Impossible de charger les données du transfert."
            )
          }
        } finally {
          if (!cancelled) {
            setLoadingData(false)
          }
        }
      }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [
    user?.companyId,
    tInventory,
  ])

  // ==========================================================
  // SELECTED MATERIAL
  // ==========================================================

  const selectedMaterial =
    useMemo(
      () =>
        materials.find(
          (
            material: MaterialOption
          ) =>
            material.id ===
            formData.material_id
        ) || null,
      [
        materials,
        formData.material_id,
      ]
    )

  // ==========================================================
  // SOURCE WAREHOUSES
  // ==========================================================

  const sourceWarehouseOptions =
    useMemo(() => {
      // Warehouse selection must not depend on a material being selected.
      // Stock quantities are resolved once a material is chosen.
      return warehouses
        .map((warehouse): WarehouseStock => {
          const stock = selectedMaterial?.warehouseStocks.find(
            (row) => row.warehouseId === warehouse.id
          )

          return {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            quantity: stock?.quantity ?? 0,
          }
        })
        .sort(
          (
            a: WarehouseStock,
            b: WarehouseStock
          ) =>
            a.warehouseName.localeCompare(
              b.warehouseName
            )
        )
    }, [selectedMaterial, warehouses])

  // ==========================================================
  // SELECTED SOURCE STOCK
  // ==========================================================

  const selectedSourceStock =
    useMemo(
      () =>
        sourceWarehouseOptions.find(
          (
            row: WarehouseStock
          ) =>
            row.warehouseId ===
            formData.source_warehouse_id
        ) || null,
      [
        sourceWarehouseOptions,
        formData.source_warehouse_id,
      ]
    )

  // ==========================================================
  // DESTINATION WAREHOUSES
  // ==========================================================

  const destinationWarehouseOptions =
    useMemo(
      () =>
        warehouses.filter(
          (
            warehouse: WarehouseOption
          ) =>
            warehouse.id !==
            formData.source_warehouse_id
        ),
      [
        warehouses,
        formData.source_warehouse_id,
      ]
    )

  // ==========================================================
  // AUTO SELECT SOURCE
  // ==========================================================

  useEffect(() => {
    if (
      !selectedMaterial ||
      sourceWarehouseOptions.length !==
        1
    ) {
      return
    }

    const onlyWarehouse =
      sourceWarehouseOptions[0]

    setFormData((prev) => {
      if (
        prev.source_warehouse_id ===
        onlyWarehouse.warehouseId
      ) {
        return prev
      }

      return {
        ...prev,

        source_warehouse_id:
          onlyWarehouse.warehouseId,

        destination_warehouse_id:
          prev.destination_warehouse_id ===
          onlyWarehouse.warehouseId
            ? ""
            : prev.destination_warehouse_id,
      }
    })
  }, [
    selectedMaterial,
    sourceWarehouseOptions,
  ])

  // ==========================================================
  // CLEAN INVALID SOURCE
  // ==========================================================

  useEffect(() => {
    if (
      !formData.source_warehouse_id
    ) {
      return
    }

    const sourceStillExists =
      sourceWarehouseOptions.some(
        (
          row: WarehouseStock
        ) =>
          row.warehouseId ===
          formData.source_warehouse_id
      )

    if (!sourceStillExists) {
      setFormData((prev) => ({
        ...prev,

        source_warehouse_id:
          "",

        destination_warehouse_id:
          "",

        quantity: "",
      }))
    }
  }, [
    sourceWarehouseOptions,
    formData.source_warehouse_id,
  ])

  // ==========================================================
  // CLEAN INVALID DESTINATION
  // ==========================================================

  useEffect(() => {
    if (
      !formData.destination_warehouse_id
    ) {
      return
    }

    const destinationStillExists =
      destinationWarehouseOptions.some(
        (
          warehouse: WarehouseOption
        ) =>
          warehouse.id ===
          formData.destination_warehouse_id
      )

    if (!destinationStillExists) {
      setFormData((prev) => ({
        ...prev,

        destination_warehouse_id:
          "",
      }))
    }
  }, [
    destinationWarehouseOptions,
    formData.destination_warehouse_id,
  ])

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const parsedQuantity =
    Number(formData.quantity)

  const isQuantityValid =
    Number.isFinite(
      parsedQuantity
    ) &&
    parsedQuantity > 0

  const availableQuantity =
    selectedSourceStock
      ? Number(
          selectedSourceStock.quantity
        )
      : 0

  const remainingSourceStock =
    selectedSourceStock &&
    isQuantityValid
      ? availableQuantity -
        parsedQuantity
      : availableQuantity

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const newErrors: Record<
      string,
      string
    > = {}

    const quantity =
      Number(formData.quantity)

    // --------------------------------------------------------
    // MATERIAL
    // --------------------------------------------------------

    if (!formData.material_id) {
      newErrors.material_id =
        tInventory(
          "materialRequiredError"
        )
    }

    // --------------------------------------------------------
    // SOURCE
    // --------------------------------------------------------

    if (
      !formData.source_warehouse_id
    ) {
      newErrors.source_warehouse_id =
        tInventory(
          "sourceWarehouseRequiredError"
        )
    }

    // --------------------------------------------------------
    // DESTINATION
    // --------------------------------------------------------

    if (
      !formData.destination_warehouse_id
    ) {
      newErrors.destination_warehouse_id =
        tInventory(
          "destinationWarehouseRequiredError"
        )
    }

    // --------------------------------------------------------
    // SOURCE != DESTINATION
    // --------------------------------------------------------

    if (
      formData.source_warehouse_id &&
      formData.destination_warehouse_id &&
      formData.source_warehouse_id ===
        formData.destination_warehouse_id
    ) {
      newErrors.destination_warehouse_id =
        tInventory(
          "differentWarehouseError"
        )
    }

    // --------------------------------------------------------
    // QUANTITY
    // --------------------------------------------------------

    if (
      !formData.quantity ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      newErrors.quantity =
        tInventory(
          "quantityPositiveError"
        )
    }

    // --------------------------------------------------------
    // SOURCE STOCK
    // --------------------------------------------------------

    else if (
      !selectedSourceStock
    ) {
      newErrors.source_warehouse_id =
        tInventory(
          "insufficientSourceStock"
        )
    }

    // --------------------------------------------------------
    // INSUFFICIENT STOCK
    // --------------------------------------------------------

    else if (
      quantity >
      availableQuantity
    ) {
      newErrors.quantity =
        tInventory(
          "insufficientSourceStock"
        )
    }

    setErrors(newErrors)

    return (
      Object.keys(
        newErrors
      ).length === 0
    )
  }

  // ==========================================================
  // MATERIAL CHANGE
  // ==========================================================

  const handleMaterialChange = (
    materialId: string
  ) => {
    // Preserve valid warehouse choices if the user selected them first.
    // Material-specific quantity is reset because stock changes by material.
    setFormData((prev) => ({
      ...prev,
      material_id: materialId,
      quantity: "",
      source_warehouse_id: warehouses.some(
        (warehouse) => warehouse.id === prev.source_warehouse_id
      ) ? prev.source_warehouse_id : "",
      destination_warehouse_id: warehouses.some(
        (warehouse) =>
          warehouse.id === prev.destination_warehouse_id &&
          warehouse.id !== prev.source_warehouse_id
      ) ? prev.destination_warehouse_id : "",
    }))

    setErrors({})
  }

  // ==========================================================
  // SOURCE CHANGE
  // ==========================================================

  const handleSourceChange = (
    warehouseId: string
  ) => {
    setFormData((prev) => ({
      ...prev,

      source_warehouse_id:
        warehouseId,

      destination_warehouse_id:
        prev.destination_warehouse_id ===
        warehouseId
          ? ""
          : prev.destination_warehouse_id,

      quantity: "",
    }))

    setErrors((prev) => ({
      ...prev,

      source_warehouse_id:
        "",

      destination_warehouse_id:
        "",

      quantity: "",
    }))
  }

  // ==========================================================
  // DESTINATION CHANGE
  // ==========================================================

  const handleDestinationChange = (
    warehouseId: string
  ) => {
    if (
      warehouseId ===
      formData.source_warehouse_id
    ) {
      setErrors((prev) => ({
        ...prev,

        destination_warehouse_id:
          tInventory(
            "differentWarehouseError"
          ),
      }))

      return
    }

    setFormData((prev) => ({
      ...prev,

      destination_warehouse_id:
        warehouseId,
    }))

    setErrors((prev) => ({
      ...prev,

      destination_warehouse_id:
        "",
    }))
  }

  // ==========================================================
  // QUANTITY CHANGE
  // ==========================================================

  const handleQuantityChange = (
    value: string
  ) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        quantity: "",
      }))

      setErrors((prev) => ({
        ...prev,
        quantity: "",
      }))

      return
    }

    const numericValue =
      Number(value)

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      quantity: value,
    }))

    if (
      numericValue <= 0
    ) {
      setErrors((prev) => ({
        ...prev,

        quantity:
          tInventory(
            "quantityPositiveError"
          ),
      }))

      return
    }

    if (
      selectedSourceStock &&
      numericValue >
        availableQuantity
    ) {
      setErrors((prev) => ({
        ...prev,

        quantity:
          tInventory(
            "insufficientSourceStock"
          ),
      }))

      return
    }

    setErrors((prev) => ({
      ...prev,

      quantity: "",
    }))
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (loading) {
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch(
        "/api/inventory",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            operation:
              "transfer",

            material_id:
              formData.material_id,

            source_warehouse_id:
              formData.source_warehouse_id,

            destination_warehouse_id:
              formData.destination_warehouse_id,

            quantity:
              parsedQuantity,

            notes:
              formData.notes.trim(),
          }),
        }
      )

      const payload: {
        error?: string
        success?: boolean
        id?: string
      } = await res
        .json()
        .catch(
          () => ({})
        )

      if (!res.ok) {
        throw new Error(
          payload.error ||
            tInventory(
              "transferSaveError"
            )
        )
      }

      toast.success(
        tInventory(
          "transferSaved"
        )
      )

      router.push(
        "/inventory"
      )
    } catch (error) {
      console.error(
        "Stock transfer failed:",
        error
      )

      const message =
        error instanceof Error
          ? error.message
          : tInventory(
              "transferSaveError"
            )

      if (
        message ===
        "Insufficient stock in source warehouse"
      ) {
        setErrors((prev) => ({
          ...prev,

          quantity:
            tInventory(
              "insufficientSourceStock"
            ),
        }))
      }

      toast.error(
        message
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingData) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">

          <div className="animate-pulse space-y-6">

            <div className="h-10 bg-gray-200 rounded w-2/3" />

            <Card>
              <div className="p-6 space-y-6">

                {[
                  1,
                  2,
                  3,
                  4,
                ].map(
                  (
                    item: number
                  ) => (
                    <div
                      key={item}
                      className="space-y-2"
                    >
                      <div className="h-4 bg-gray-200 rounded w-1/4" />

                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  )
                )}

              </div>
            </Card>

          </div>

        </div>
      </div>
    )
  }

  // ==========================================================
  // DATA ERROR
  // ==========================================================

  if (dataError) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">

          <Card>
            <div className="p-8 text-center">

              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />

              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {tInventory(
                  "transferLoadError"
                ) ||
                  "Erreur de chargement"}
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                {dataError}
              </p>

              <Button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
              >
                {tCommon(
                  "retry"
                ) || "Réessayer"}
              </Button>

            </div>
          </Card>

        </div>
      </div>
    )
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="p-4 md:p-6">

      <div className="mx-auto max-w-2xl">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <header className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <ArrowLeftRight className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl md:text-3xl">
                {tInventory("newStockTransferTitle")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
                {tInventory("newStockTransferSubtitle")}
              </p>
            </div>
          </div>
        </header>

        {/* ====================================================
            FORM
        ==================================================== */}

        <Card>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-5 md:p-6"
          >

            {/* ==================================================
                MATERIAL
            ================================================== */}

            <div className="space-y-2">

              <Label htmlFor="material">

                {tInventory(
                  "materials"
                )}

                <span className="text-red-500 ml-1">
                  *
                </span>

              </Label>

              <Select
                value={
                  formData.material_id
                }
                onValueChange={
                  handleMaterialChange
                }
                disabled={
                  loading
                }
              >

                <SelectTrigger
                  id="material"
                  className={
                    errors.material_id
                      ? "border-red-500"
                      : ""
                  }
                >

                  <SelectValue
                    placeholder={tInventory(
                      "selectMaterialPlaceholder"
                    )}
                  />

                </SelectTrigger>

                <SelectContent>

                  {materials.length ===
                  0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {tInventory(
                        "noMaterialsFound"
                      ) ||
                        "Aucun matériau disponible"}
                    </div>
                  ) : (
                    materials.map(
                      (
                        material: MaterialOption
                      ) => (
                        <SelectItem
                          key={
                            material.id
                          }
                          value={
                            material.id
                          }
                        >
                          {
                            material.name
                          }{" "}
                          (
                          {
                            material.unit
                          }
                          )
                        </SelectItem>
                      )
                    )
                  )}

                </SelectContent>

              </Select>

              {errors.material_id && (
                <p className="text-sm text-red-500">
                  {
                    errors.material_id
                  }
                </p>
              )}

            </div>

            {/* ==================================================
                SOURCE + DESTINATION
            ================================================== */}

            <div className="grid gap-6 md:grid-cols-2">

              {/* SOURCE */}

              <div className="space-y-2">

                <Label htmlFor="source-warehouse">

                  <span className="inline-flex items-center gap-1">

                    <Warehouse className="h-3.5 w-3.5" />

                    {
                      tInventory(
                        "sourceWarehouse"
                      )
                    }

                  </span>

                  <span className="text-red-500 ml-1">
                    *
                  </span>

                </Label>

                <Select
                  value={
                    formData.source_warehouse_id
                  }
                  onValueChange={
                    handleSourceChange
                  }
                  disabled={
                    loading ||
                    loadingData ||
                    sourceWarehouseOptions.length === 0
                  }
                >

                  <SelectTrigger
                    id="source-warehouse"
                    className={
                      errors.source_warehouse_id
                        ? "border-red-500"
                        : ""
                    }
                  >

                    <SelectValue
                      placeholder={tInventory(
                        "selectSourceWarehouse"
                      )}
                    />

                  </SelectTrigger>

                  <SelectContent>

                    {sourceWarehouseOptions.length ===
                    0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {tInventory(
                        "noSourceWarehouseAvailable"
                      ) || "Aucun dépôt disponible"}
                      </div>
                    ) : (
                      sourceWarehouseOptions.map(
                        (
                          warehouse: WarehouseStock
                        ) => (
                          <SelectItem
                            key={
                              warehouse.warehouseId
                            }
                            value={
                              warehouse.warehouseId
                            }
                          >
                            {
                              warehouse.warehouseName
                            }
                          </SelectItem>
                        )
                      )
                    )}

                  </SelectContent>

                </Select>

                {errors.source_warehouse_id && (
                  <p className="text-sm text-red-500">
                    {
                      errors.source_warehouse_id
                    }
                  </p>
                )}

                {selectedMaterial &&
                  sourceWarehouseOptions.length > 0 &&
                  sourceWarehouseOptions.every((row) => row.quantity <= 0) && (
                    <p className="text-sm text-amber-700">
                      {tInventory("noSourceWarehouseAvailable") ||
                        "Aucun stock disponible pour ce matériau dans les dépôts actifs."}
                    </p>
                  )}

                {selectedSourceStock && availableQuantity > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">

                    <div className="flex items-center gap-2 text-sm text-blue-700">

                      <Package className="h-4 w-4" />

                      <span>
                        {tInventory(
                          "availableInSource"
                        )}
                      </span>

                    </div>

                    <span className="font-semibold text-blue-900">

                      {availableQuantity.toLocaleString(
                        locale ===
                          "ar"
                          ? "ar-MA"
                          : locale ===
                              "fr"
                            ? "fr-MA"
                            : "en-US"
                      )}{" "}

                      {
                        selectedMaterial?.unit
                      }

                    </span>

                  </div>
                )}

              </div>

              {/* DESTINATION */}

              <div className="space-y-2">

                <Label htmlFor="destination-warehouse">

                  <span className="inline-flex items-center gap-1">

                    <Warehouse className="h-3.5 w-3.5" />

                    {
                      tInventory(
                        "destinationWarehouse"
                      )
                    }

                  </span>

                  <span className="text-red-500 ml-1">
                    *
                  </span>

                </Label>

                <Select
                  value={
                    formData.destination_warehouse_id
                  }
                  onValueChange={
                    handleDestinationChange
                  }
                  disabled={
                    loading ||
                    !formData.source_warehouse_id ||
                    destinationWarehouseOptions.length ===
                      0
                  }
                >

                  <SelectTrigger
                    id="destination-warehouse"
                    className={
                      errors.destination_warehouse_id
                        ? "border-red-500"
                        : ""
                    }
                  >

                    <SelectValue
                      placeholder={tInventory(
                        "selectDestinationWarehouse"
                      )}
                    />

                  </SelectTrigger>

                  <SelectContent>

                    {destinationWarehouseOptions.length ===
                    0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {tInventory(
                          "noDestinationWarehouseAvailable"
                        ) ||
                          "Aucun dépôt disponible"}
                      </div>
                    ) : (
                      destinationWarehouseOptions.map(
                        (
                          warehouse: WarehouseOption
                        ) => (
                          <SelectItem
                            key={
                              warehouse.id
                            }
                            value={
                              warehouse.id
                            }
                          >
                            {
                              warehouse.name
                            }
                          </SelectItem>
                        )
                      )
                    )}

                  </SelectContent>

                </Select>

                {errors.destination_warehouse_id && (
                  <p className="text-sm text-red-500">
                    {
                      errors.destination_warehouse_id
                    }
                  </p>
                )}

              </div>

            </div>

            {/* ==================================================
                QUANTITY
            ================================================== */}

            <div className="space-y-2">

              <Label htmlFor="quantity">

                {
                  tInventory(
                    "quantity"
                  )
                }

                {selectedMaterial
                  ? ` (${selectedMaterial.unit})`
                  : ""}

                <span className="text-red-500 ml-1">
                  *
                </span>

              </Label>

              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={
                  formData.quantity
                }
                onChange={(e) =>
                  handleQuantityChange(
                    e.target.value
                  )
                }
                className={
                  errors.quantity
                    ? "border-red-500"
                    : ""
                }
                placeholder="0.00"
                disabled={
                  loading ||
                  !selectedSourceStock ||
                  availableQuantity <= 0
                }
              />

              {errors.quantity && (
                <p className="text-sm text-red-500">
                  {
                    errors.quantity
                  }
                </p>
              )}

              {selectedSourceStock &&
                isQuantityValid && (
                  <div
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      parsedQuantity >
                      availableQuantity
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >

                    <span>
                      {tInventory(
                        "remainingAfterTransfer"
                      ) ||
                        "Stock restant après transfert"}
                    </span>

                    <span className="font-semibold">

                      {Math.max(
                        remainingSourceStock,
                        0
                      ).toLocaleString(
                        locale ===
                          "ar"
                          ? "ar-MA"
                          : locale ===
                              "fr"
                            ? "fr-MA"
                            : "en-US"
                      )}{" "}

                      {
                        selectedMaterial?.unit
                      }

                    </span>

                  </div>
                )}

            </div>

            {/* ==================================================
                NOTES
            ================================================== */}

            <div className="space-y-2">

              <Label htmlFor="notes">

                {
                  tInventory(
                    "notesOptional"
                  )
                }

              </Label>

              <Textarea
                id="notes"
                value={
                  formData.notes
                }
                onChange={(e) =>
                  setFormData(
                    (prev) => ({
                      ...prev,

                      notes:
                        e.target.value,
                    })
                  )
                }
                placeholder={tInventory(
                  "transferNotesPlaceholder"
                )}
                disabled={
                  loading
                }
                rows={4}
              />

            </div>

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.back()
                }
                disabled={
                  loading
                }
                className="w-full sm:w-auto"
              >
                {
                  tCommon(
                    "cancel"
                  )
                }
              </Button>

              <Button
                type="submit"
                disabled={
                  loading ||
                  loadingData ||
                  !selectedMaterial ||
                  !selectedSourceStock ||
                  !formData.destination_warehouse_id ||
                  !isQuantityValid ||
                  parsedQuantity >
                    availableQuantity
                }
                className="w-full sm:w-auto"
              >

                {loading ? (
                  <span className="inline-flex items-center gap-2">

                    <Loader2 className="h-4 w-4 animate-spin" />

                    {
                      tInventory(
                        "savingTransfer"
                      )
                    }

                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">

                    <ArrowLeftRight className="h-4 w-4" />

                    <Save className="h-4 w-4" />

                    {
                      tInventory(
                        "saveTransfer"
                      )
                    }

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