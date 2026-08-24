"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Package,
  Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { getOrderById, updateOrderFull, getSupplierMaterials } from "@/app/actions/order-actions"
import { useCostsTranslations, useCommonTranslations } from "@/components/LocaleProvider"

interface OrderItem {
  id: string
  material_id: string
  material_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  material?: {
    id: string
    name: string
    sku?: string
    unit_of_measure: string
  }
}

interface Material {
  id: string
  name: string
  sku?: string
  unit_of_measure: string
  unitPrice?: number
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number | null
  orderDate: Date | null
  expectedDelivery: Date | null
  supplier: {
    id: string
    name: string
  }
  items?: any[]
}

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const tCommon = useCommonTranslations()

  const orderId = params.id as string

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [status, setStatus] = useState("pending")
  const [orderDate, setOrderDate] = useState("")
  const [expectedDelivery, setExpectedDelivery] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [rawPriceInputs, setRawPriceInputs] = useState<Record<string, string>>({})

  const currencyLocale = "fr-MA"

  // Load data once on mount
  useEffect(() => {
    let isMounted = true

    const loadOrder = async () => {
      try {
        if (!orderId || !user?.companyId) {
          setLoading(false)
          return
        }

        // Load order
        const result = await getOrderById(orderId)

        if (!isMounted) return

        if (!result.success || !result.data) {
          toast.error(result.error || tCosts("orderNotFound"))
          router.push("/costs/orders")
          return
        }

        const orderData = result.data as PurchaseOrder

        // Load only materials linked to this order's supplier
        const matsResult = await getSupplierMaterials(orderData.supplier.id)
        if (isMounted && matsResult.success && matsResult.data) {
          const mats = (matsResult.data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            sku: m.sku,
            unit_of_measure: m.unit || m.unitOfMeasure || "",
            unitPrice: Number(m.unitPrice || 0)
          }))
          setMaterials(mats)
        }

        if (!isMounted) return

        setOrder(orderData)
        setStatus(orderData.status || "pending")
        setOrderDate(
          orderData.orderDate
            ? new Date(orderData.orderDate).toISOString().split("T")[0]
            : ""
        )
        setExpectedDelivery(
          orderData.expectedDelivery
            ? new Date(orderData.expectedDelivery).toISOString().split("T")[0]
            : ""
        )

        if (orderData.items && orderData.items.length > 0) {
          const mappedItems: OrderItem[] = orderData.items.map((item: any) => ({
            id: item.id,
            material_id: item.materialId,
            material_name: item.material?.name || "",
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
            total_price: Number(item.totalPrice),
            notes: item.notes || "",
            material: item.material
          }))
          setOrderItems(mappedItems)
        }
      } catch (error) {
        console.error("Error loading order:", error)
        if (isMounted) {
          toast.error(tCosts("errorLoadingOrder"))
          router.push("/costs/orders")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      isMounted = false
    }
  }, [orderId, user?.companyId])

  // Calculations
  const totalAmount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.total_price, 0),
    [orderItems]
  )
  const taxAmount = totalAmount * 0.2
  const finalAmount = totalAmount + taxAmount

  const statusLabels: Record<string, string> = {
    draft: tCosts("statusDraft"),
    pending: tCosts("statusPending"),
    approved: tCosts("statusApproved"),
    sent: tCosts("statusSent"),
    received: tCosts("statusReceived"),
    cancelled: tCosts("statusCancelled"),
  }

  const handleAddItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      material_id: "",
      material_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      notes: ""
    }
    setOrderItems([...orderItems, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (orderItems.length === 1) {
      toast.warning(tCosts("atLeastOneItemRequired"))
      return
    }
    setOrderItems(orderItems.filter(item => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    const updatedItems = orderItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }

        if (field === "quantity" || field === "unit_price") {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        }

        if (field === "material_id") {
          const material = materials.find(m => m.id === value)
          if (material) {
            updatedItem.material_name = material.name
            updatedItem.unit_price = material.unitPrice || 0
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
            updatedItem.material = material as any
          }
        }

        return updatedItem
      }
      return item
    })

    setOrderItems(updatedItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    const invalidItems = orderItems.filter(item => !item.material_id || item.quantity <= 0)
    if (invalidItems.length > 0) {
      toast.error(tCosts("invalidItemsError"))
      return
    }

    setSaving(true)
    try {
      const result = await updateOrderFull(orderId, {
        status,
        orderDate: orderDate ? new Date(orderDate) : null,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        totalAmount,
        items: orderItems.map(item => ({
          material_id: item.material_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes || null
        }))
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update order")
      }

      toast.success(tCosts("orderUpdated") || "Commande mise à jour avec succès")
      router.push(`/costs/orders/${orderId}`)
    } catch (error) {
      console.error("Error saving order:", error)
      toast.error(tCosts("saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">{tCosts("orderNotFound")}</h2>
          <Button asChild className="mt-4">
            <a href="/costs/orders" className="flex items-center gap-2 justify-center">
              <ArrowLeft className="h-4 w-4" />
              {tCosts("back")}
            </a>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/costs/orders")}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                {tCommon("back")}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tCosts("editOrder") || "Edit Order"}</h1>
                <p className="text-gray-600 text-sm mt-1">
                  N° <span className="font-mono font-medium">{order.orderNumber}</span>
                </p>
              </div>
            </div>

            <Badge variant="outline" className={`${
              status === "approved"
                ? "bg-blue-100 text-blue-800"
                : status === "sent"
                  ? "bg-orange-100 text-orange-800"
                  : status === "received"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
            }`}>
              {statusLabels[status] || status}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Main */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {tCosts("orderInfoTitle")}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{tCosts("supplier")}</Label>
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="font-medium">{order.supplier.name}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">{tCommon("status")}</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">{tCosts("statusDraft")}</option>
                        <option value="pending">{tCosts("statusPending")}</option>
                        <option value="approved">{tCosts("statusApproved")}</option>
                        <option value="sent">{tCosts("statusSent")}</option>
                        <option value="received">{tCosts("statusReceived")}</option>
                        <option value="cancelled">{tCosts("statusCancelled")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orderDate">{tCosts("orderDate")}</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedDelivery">{tCosts("expectedDelivery")}</Label>
                      <Input
                        id="expectedDelivery"
                        type="date"
                        value={expectedDelivery}
                        onChange={(e) => setExpectedDelivery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Order Items */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {tCosts("orderedItems") || "Order Items"}
                    </h2>
                    <Badge variant="outline">
                      {tCosts("itemsMiniTitle").replace("{count}", String(orderItems.length))}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {item.material_name || tCosts("selectMaterial")}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {/* Material Select */}
                          <div className="md:col-span-2">
                            <Label htmlFor={`material-${item.id}`} className="text-xs">
                              {tCosts("selectMaterial")}
                            </Label>
                            <select
                              id={`material-${item.id}`}
                              value={item.material_id}
                              onChange={(e) => handleItemChange(item.id, "material_id", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="">{tCosts("selectMaterial")}</option>
                              {materials.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} {m.sku ? `(${m.sku})` : ""} - {m.unitPrice?.toLocaleString(currencyLocale, { style: "currency", currency: "MAD" }) || "0"}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <Label htmlFor={`quantity-${item.id}`} className="text-xs">
                              {tCosts("quantity")}
                            </Label>
                            <Input
                              id={`quantity-${item.id}`}
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>

                          {/* Unit Price */}
                          <div>
                            <Label htmlFor={`unit_price-${item.id}`} className="text-xs">
                              {tCosts("unitPrice")}
                            </Label>
                            <Input
                              id={`unit_price-${item.id}`}
                              type="text"
                              inputMode="decimal"
                              value={rawPriceInputs[item.id] ?? (item.unit_price === 0 ? '' : String(item.unit_price))}
                              onChange={(e) => {
                                const raw = e.target.value
                                if (raw !== '' && !/^\d*[.,]?\d*$/.test(raw)) return
                                setRawPriceInputs(prev => ({ ...prev, [item.id]: raw }))
                                const parsed = parseFloat(raw.replace(',', '.'))
                                if (!isNaN(parsed)) {
                                  handleItemChange(item.id, "unit_price", parsed)
                                }
                              }}
                              onBlur={() => {
                                setRawPriceInputs(prev => {
                                  const next = { ...prev }
                                  delete next[item.id]
                                  return next
                                })
                              }}
                              className="w-full"
                            />
                          </div>

                          {/* Notes */}
                          <div className="md:col-span-4">
                            <Label htmlFor={`notes-${item.id}`} className="text-xs">
                              {tCosts("notes")}
                            </Label>
                            <Input
                              id={`notes-${item.id}`}
                              type="text"
                              value={item.notes || ""}
                              onChange={(e) => handleItemChange(item.id, "notes", e.target.value)}
                              placeholder={tCosts("notesPlaceholder") || "Notes"}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="mt-3 flex items-center justify-between pt-3 border-t">
                          <span className="text-sm text-gray-600">{tCosts("total")}</span>
                          <span className="text-lg font-bold text-blue-600">
                            {item.total_price.toLocaleString(currencyLocale, {
                              style: "currency",
                              currency: "MAD"
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {orderItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">{tCosts("noItemsInOrder")}</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddItem}
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {tCosts("addItem")}
                      </Button>
                    </div>
                  )}

                  {orderItems.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                      className="w-full mt-4 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      {tCosts("addItem")}
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    {tCosts("orderSummaryTitle")}
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tCosts("subtotalLabel")}</span>
                      <span className="font-semibold">
                        {totalAmount.toLocaleString(currencyLocale, {
                          style: "currency",
                          currency: "MAD"
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">{tCosts("vat") || "TVA"} (20%)</span>
                      <span className="font-semibold">
                        {taxAmount.toLocaleString(currencyLocale, {
                          style: "currency",
                          currency: "MAD"
                        })}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>{tCosts("total")}</span>
                        <span className="text-blue-600">
                          {finalAmount.toLocaleString(currencyLocale, {
                            style: "currency",
                            currency: "MAD"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-3">{tCosts("detailsTitle")}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{tCosts("orderNumberLabel")}</span>
                        <span className="font-mono font-medium">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{tCosts("itemsCountLabel")}</span>
                        <span>{orderItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{tCosts("supplier")}</span>
                        <span className="text-right truncate">{order.supplier.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card>
                <div className="p-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                      disabled={saving}
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {tCosts("saving")}
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          {tCommon("save")}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/costs/orders/${orderId}`)}
                      disabled={saving}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
