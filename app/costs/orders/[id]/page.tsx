"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Package,
  Calendar,
  User,
  Building,
  ExternalLink,
  Eye,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getOrderById, deleteOrder, deleteOrderItem } from "@/app/actions/order-actions"
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider"
import { formatQuantityWithUnit } from "@/lib/utils/units"

interface OrderItem {
  id: string
  materialId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  material: {
    id: string
    name: string
    sku: string | null
    unit?: string | null
    unitOfMeasure?: string | null
    category: string | null
  }
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  status: string
  totalAmount: number | null
  orderDate: Date | null
  expectedDelivery: Date | null
  actualDelivery: Date | null
  companyId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
  supplier: {
    id: string
    name: string
    contactPerson: string | null
    email: string | null
    phone: string | null
  }
  project: {
    id: string
    name: string
    clientName: string | null
  } | null
  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  items?: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const { locale } = useLocale()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  const orderId = params.id as string

  useEffect(() => {
    if (orderId && user?.companyId) {
      fetchOrder()
    }
  }, [orderId, user?.companyId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      
      const result = await getOrderById(orderId)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Order not found")
      }
      
      const orderData = result.data
      
      // Transform dates from string to Date objects if necessary (server actions return JSON dates as strings usually, but Prisma returns Date objects. 
      // Next.js serializes Server Actions results, so dates might be strings.
      // Let's handle it safely.)
      
      const parseDate = (date: any) => date ? new Date(date) : null

      const { items: rawItems, ...orderBase } = orderData

      const enrichedOrder: PurchaseOrder = {
        ...orderBase,
        orderDate: parseDate(orderData.orderDate),
        expectedDelivery: parseDate(orderData.expectedDelivery),
        actualDelivery: parseDate(orderData.actualDelivery),
        createdAt: parseDate(orderData.createdAt)!,
        updatedAt: parseDate(orderData.updatedAt)!,
        totalAmount: orderData.totalAmount ? Number(orderData.totalAmount) : null,
        supplier: {
          ...orderData.supplier
        },
        project: null, // As per original code, project relation is missing in fetched data
        createdBy: orderData.createdBy ? {
          ...orderData.createdBy,
          firstName: orderData.createdBy.firstName || null,
          lastName: orderData.createdBy.lastName || null
        } : null
      }
      
      setOrder(enrichedOrder)
      
      const enrichedItems: OrderItem[] = (rawItems || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity.toString()),
        unitPrice: Number(item.unitPrice.toString()),
        totalPrice: Number(item.totalPrice.toString()),
        material: {
            ...item.material,
            category: item.material.category // Ensure category is handled as string | null
        }
      }))
      
      setItems(enrichedItems)
      
    } catch (error) {
      console.error("Error fetching order:", error)
      toast.error(tCosts("errorLoadingOrder"))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(tCosts("deleteItemConfirm"))) return

    try {
      const result = await deleteOrderItem(itemId)
      if (!result.success) throw new Error(result.error)
      setItems(prev => prev.filter(i => i.id !== itemId))
      toast.success(tCosts("itemDeletedSuccess"))
    } catch (error) {
      toast.error(tCosts("deleteItemError"))
    }
  }

  const handleDelete = async () => {
    if (!confirm(tCosts("deleteOrderConfirm"))) {
      return
    }

    try {
      const result = await deleteOrder(orderId)

      if (!result.success) {
        throw new Error(result.error || "Failed to delete")
      }

      toast.success(tCosts("orderDeletedSuccess"))
      router.push("/costs/orders")
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error(tCosts("unableToDeleteOrder"))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string, color: string }> = {
      draft: { label: tCosts("statusDraft"), color: "bg-gray-100 text-gray-800" },
      pending: { label: tCosts("statusPending"), color: "bg-yellow-100 text-yellow-800" },
      approved: { label: tCosts("statusApproved"), color: "bg-blue-100 text-blue-800" },
      sent: { label: tCosts("statusSent"), color: "bg-orange-100 text-orange-800" },
      received: { label: tCosts("statusReceived"), color: "bg-green-100 text-green-800" },
      cancelled: { label: tCosts("statusCancelled"), color: "bg-red-100 text-red-800" }
    }
    
    const statusVariant = variants[status] || variants.draft
    return (
      <Badge className={`${statusVariant.color} px-3 py-1`}>
        {statusVariant.label}
      </Badge>
    )
  }

  const handlePrint = () => {
    router.push(`/costs/orders/${orderId}/print`);
  }

  const getItemUnit = (item: OrderItem) => {
    return item.material.unitOfMeasure || item.material.unit || ""
  }

  const currencyLocale = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA"
  const dateLocale = locale === "ar" ? "ar" : locale === "en" ? "en-US" : "fr-FR"

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto text-center">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {tCosts("orderNotFound")}
        </h2>
        <p className="text-gray-600 mb-6">
          {tCosts("orderNotFoundDescription")}
        </p>
        <Button asChild>
          <Link href="/costs/orders">
            {tCosts("back")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/costs/orders')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        {tCosts("back")}
                      </Button>
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-3xl font-bold text-gray-900">
                            {tCosts("order")} {order.orderNumber}
                          </h1>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {tCosts("date")}: {order.createdAt.toLocaleDateString(dateLocale)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="flex items-center gap-2"
                      >
                        <Printer size={16} />
                        {tCosts("print")}
                      </Button>
                      <Link href={`/costs/orders/${order.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Edit size={16} />
                          {tCosts("edit") || "Modifier"}
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        {tCosts("delete") || "Supprimer"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Informations principales */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Informations de la commande */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                          {tCosts("orderDetailsTitle")}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Fournisseur */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">{tCosts("supplier")}</h3>
                            </div>
                            <div className="ml-6 space-y-1">
                              <p className="font-medium">{order.supplier.name}</p>
                              {order.supplier.contactPerson && (
                                <p className="text-sm text-gray-600">
                                  {tCosts("contactPerson")}: {order.supplier.contactPerson}
                                </p>
                              )}
                              {order.supplier.email && (
                                <p className="text-sm text-gray-600">{order.supplier.email}</p>
                              )}
                              {order.supplier.phone && (
                                <p className="text-sm text-gray-600">{order.supplier.phone}</p>
                              )}
                            </div>
                            <div className="mt-3 ml-6">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/costs/suppliers/${order.supplier.id}`}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {tCosts("viewSupplier")}
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Dates */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <h3 className="font-medium text-gray-900">{tCosts("dates")}</h3>
                            </div>
                            <div className="ml-6 space-y-2">
                              <div>
                                <p className="text-sm text-gray-600">{tCosts("orderDate")}</p>
                                <p className="font-medium">
                                  {order.orderDate ? order.orderDate.toLocaleDateString(dateLocale) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">{tCosts("expectedDelivery")}</p>
                                <p className="font-medium">
                                  {order.expectedDelivery ? order.expectedDelivery.toLocaleDateString(dateLocale) : '-'}
                                </p>
                              </div>
                              {order.actualDelivery && (
                                <div>
                                  <p className="text-sm text-gray-600">{tCosts("actualDelivery")}</p>
                                  <p className="font-medium">
                                    {order.actualDelivery.toLocaleDateString(dateLocale)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Demandeur */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                          <h3 className="font-medium text-gray-900">{tCosts("requester")}</h3>
                            </div>
                            <div className="ml-6 space-y-1">
                              {order.createdBy ? (
                                <>
                                  <p className="font-medium">
                                    {order.createdBy.firstName} {order.createdBy.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {order.createdBy.email}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">{tCosts("requesterNotAvailable")}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Articles de la commande */}
                    <Card>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            {tCosts("orderItems")}: ({items.length})
                          </h2>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">{tCosts("material")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">{tCosts("quantity")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">{tCosts("unitPrice")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">{tCosts("total")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">{tCosts("notes")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item: OrderItem) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{item.material.name}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">
                                        {formatQuantityWithUnit(item.quantity, getItemUnit(item), locale)}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium">
                                      {item.unitPrice.toLocaleString(currencyLocale, {
                                        style: 'currency',
                                        currency: 'MAD'
                                      })}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium text-blue-600">
                                      {item.totalPrice.toLocaleString(currencyLocale, {
                                        style: 'currency',
                                        currency: 'MAD'
                                      })}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                      {item.notes || '—'}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        title={tCosts("view")}
                                      >
                                        <Link href={`/inventory/materials/${item.material.id}`}>
                                          <Eye className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {items.length === 0 && (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">{tCosts("noOrderItems")}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Résumé financier */}
                    <Card>
                      <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{tCosts("financialSummary")}</h2>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">{tCosts("total")}</span>
                            <span className="font-semibold">
                              {(order.totalAmount || 0).toLocaleString(currencyLocale, {
                                style: 'currency',
                                currency: 'MAD'
                              })}
                            </span>
                          </div>
                          
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>{tCosts("totalTaxIncluded")}</span>
                              <span className="text-blue-600">
                                {(order.totalAmount || 0).toLocaleString(currencyLocale, {
                                  style: 'currency',
                                  currency: 'MAD'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{tCosts("numberOfItems")}</span>
                              <span>{items.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{tCosts("lastUpdated")}</span>
                              <span>
                                {order.updatedAt.toLocaleDateString(dateLocale)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
    )
}
