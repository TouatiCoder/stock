"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Package } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { getSupplierById } from "@/app/actions/supplier-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider"

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  ordered: "bg-blue-100 text-blue-700",
  approved: "bg-purple-100 text-purple-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  partially_delivered: "bg-orange-100 text-orange-700",
}

export default function SupplierOrdersPage() {
  const params = useParams()
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const { locale } = useLocale()

  const supplierId = params.id as string

  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (supplierId && user?.companyId) {
      fetchData()
    }
  }, [supplierId, user?.companyId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await getSupplierById(supplierId)
      if (!result.success || !result.data) throw new Error(result.error || "Failed")
      const { orders: supplierOrders, ...supplierData } = result.data
      setSupplier(supplierData)
      setOrders(supplierOrders || [])
    } catch (error) {
      console.error("Error fetching supplier orders:", error)
      toast.error(tCosts("unableToLoadOrders"))
    } finally {
      setLoading(false)
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

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      delivered: tCosts("statusDelivered"),
      ordered: tCosts("statusOrdered"),
      approved: tCosts("statusApproved"),
      pending: tCosts("statusPending"),
      cancelled: tCosts("statusCancelled"),
      partially_delivered: tCosts("statusPartiallyDelivered"),
    }
    return map[status] ?? status
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!supplier) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto text-center py-16">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fournisseur non trouvé</h2>
          <p className="text-gray-600 mb-6">
            Le fournisseur que vous recherchez n'existe pas ou vous n'avez pas accès.
          </p>
          <Button asChild>
            <Link href="/costs/suppliers">Retour à la liste</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/costs/suppliers/${supplierId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {supplier.name}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tCosts("suppliersOrdersTitle")}
              </h1>
              <p className="text-gray-600 mt-1">{supplier.name}</p>
            </div>
          </div>

          <Button asChild>
            <Link href={`/costs/orders/new?supplier=${supplierId}`}>
              <Package className="h-4 w-4 mr-2" />
              {tCosts("newOrder")}
            </Link>
          </Button>
        </div>

        {/* Orders */}
        <Card className="p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{tCosts("suppliersOrdersEmpty")}</p>
              <Button asChild>
                <Link href={`/costs/orders/new?supplier=${supplierId}`}>
                  {tCosts("newOrder")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("order")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("date")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("amount")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("status")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("expectedDeliveryDate")}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      {tCosts("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(order.orderDate)}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {order.expectedDelivery ? formatDate(order.expectedDelivery) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/costs/orders/${order.id}`}>
                            {tCosts("viewDetails")}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  )
}
