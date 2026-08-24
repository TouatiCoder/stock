// app/costs/suppliers/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Building, Calendar, Check, DollarSign, Package, Trash2, RefreshCw, Power } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { getSupplierById, deleteSupplier, updateSupplier } from "@/app/actions/supplier-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider"

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  delivered: { label: "statusDelivered", className: "bg-green-100 text-green-700" },
  ordered: { label: "statusOrdered", className: "bg-blue-100 text-blue-700" },
  approved: { label: "statusApproved", className: "bg-purple-100 text-purple-700" },
  pending: { label: "statusPending", className: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "statusCancelled", className: "bg-red-100 text-red-700" },
  partially_delivered: { label: "statusPartiallyDelivered", className: "bg-orange-100 text-orange-700" },
}

function SupplierDetailSkeleton() {
  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-9 w-24" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const { locale, dir } = useLocale()

  const supplierId = params.id as string

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [supplier, setSupplier] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (supplierId && user?.companyId) {
      fetchSupplierData()
    }
  }, [supplierId, user?.companyId])

  const fetchSupplierData = async () => {
    try {
      setLoading(true)
      setFetchError(false)
      const result = await getSupplierById(supplierId)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch supplier")
      }

      const { orders: supplierOrders, ...supplierData } = result.data
      setSupplier(supplierData)
      setOrders(supplierOrders || [])
    } catch (error) {
      console.error("Error fetching supplier:", error)
      setFetchError(true)
      toast.error(tCosts("supplierLoadError"))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const result = await deleteSupplier(supplierId)
      if (!result.success) throw new Error(result.error || "Failed to delete")

      toast.success(tCosts("supplierDeletedSuccess"))
      router.push("/costs/suppliers")
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast.error(tCosts("supplierDeleteError"))
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async () => {
    try {
      setUpdatingStatus(true)
      const nextStatus = !supplier.isActive
      const result = await updateSupplier(supplierId, { isActive: nextStatus })
      if (!result.success) throw new Error(result.error || "Failed to update status")

      setSupplier((current: any) => ({ ...current, isActive: nextStatus }))
      toast.success(tCosts(nextStatus ? "supplierActivatedSuccess" : "supplierDeactivatedSuccess"))
    } catch (error) {
      console.error("Error updating supplier status:", error)
      toast.error(tCosts("supplierStatusUpdateError"))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const loc = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"
    return amount.toLocaleString(loc, { style: "currency", currency: "MAD", minimumFractionDigits: 0 })
  }

  const formatDate = (date: string | Date) => {
    const loc = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
    return new Date(date).toLocaleDateString(loc)
  }

  if (loading) return <SupplierDetailSkeleton />

  if (fetchError || !supplier) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto text-center py-16" dir={dir}>
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tCosts("supplierNotFound")}</h2>
          <p className="text-gray-600 mb-6">{tCosts("supplierNotFoundDesc")}</p>
          <div className="flex items-center justify-center gap-3">
            {fetchError && (
              <Button variant="outline" onClick={fetchSupplierData}>
                <RefreshCw className="h-4 w-4 me-2" />
                {tCosts("retryButton")}
              </Button>
            )}
            <Button asChild>
              <Link href="/costs/suppliers">{tCosts("backToList")}</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const completedOrders = orders.filter((order) => order.status === "received").length

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto" dir={dir}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/costs/suppliers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 me-2" />
                {tCosts("back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? tCosts("active") : tCosts("inactive")}
                </Badge>
                {supplier.contactPerson && (
                  <span className="text-gray-600">{supplier.contactPerson}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusChange}
              disabled={updatingStatus}
            >
              <Power className="h-4 w-4 me-2" />
              {tCosts(supplier.isActive ? "supplierDeactivate" : "supplierActivate")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {deleting ? tCosts("deleting") : tCosts("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tCosts("deleteSupplierTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{tCosts("deleteSupplierDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCosts("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {tCosts("confirmDelete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button asChild>
              <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                <Package className="h-4 w-4 me-2" />
                {tCosts("newOrder")}
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-lg mb-8">
            <TabsTrigger value="overview">{tCosts("overview")}</TabsTrigger>
            <TabsTrigger value="orders">
              {tCosts("orders")}
              {orders.length > 0 && (
                <span className="ms-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-medium">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {tCosts("supplierInfoTitle")}
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplier.contactPerson && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{tCosts("contactPerson")}</p>
                        <p className="font-medium">{supplier.contactPerson}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tCosts("supplierEmail")}</p>
                      {supplier.email ? (
                        <a
                          href={`mailto:${supplier.email}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {supplier.email}
                        </a>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">{tCosts("supplierPhone")}</p>
                    {supplier.phone ? (
                      <a
                        href={`tel:${supplier.phone}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {supplier.phone}
                      </a>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>

                  {supplier.address && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tCosts("supplierAddress")}</p>
                      <p className="font-medium">{supplier.address}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{tCosts("statistics")}</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{tCosts("totalOrders")}</span>
                    </div>
                    <span className="font-bold">{orders.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-600">{tCosts("completedOrders")}</span>
                    </div>
                    <span className="font-bold">{completedOrders}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-600">{tCosts("totalSpent")}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(totalSpent)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-600">{tCosts("since")}</span>
                    </div>
                    <span className="font-medium">{formatDate(supplier.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{tCosts("ordersHistory")}</h3>
                <Button asChild size="sm">
                  <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                    <Package className="h-4 w-4 me-2" />
                    {tCosts("newOrder")}
                  </Link>
                </Button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{tCosts("suppliersOrdersEmpty")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("order")}</th>
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("date")}</th>
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("amount")}</th>
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("status")}</th>
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("expectedDeliveryDate")}</th>
                        <th className="text-start py-3 px-4 text-sm font-medium text-gray-700">{tCosts("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const statusCfg = ORDER_STATUS_CONFIG[order.status]
                        return (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(order.orderDate)}</td>
                            <td className="py-3 px-4 font-medium">{formatCurrency(Number(order.totalAmount))}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  statusCfg?.className ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {statusCfg ? tCosts(statusCfg.label) : order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {order.expectedDelivery ? formatDate(order.expectedDelivery) : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/costs/orders/${order.id}`}>{tCosts("viewDetails")}</Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
