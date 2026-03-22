"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { costService } from "@/lib/services/costService"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider"

interface OrdersListProps {
  searchTerm: string
}

export function OrdersList({ searchTerm }: OrdersListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const tCosts = useCostsTranslations()
  const { locale } = useLocale()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.companyId) {
      fetchOrders()
    }
  }, [user?.companyId, searchTerm])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const companyId = user?.companyId
      if (!companyId) return

      const data = await costService.getPurchaseOrders(companyId, {
        search: searchTerm || undefined,
      })

      setOrders(data.slice(0, 3) || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: tCosts("error"),
        description: tCosts("unableToLoadOrders"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(tCosts("deleteOrderConfirm"))) return

    try {
      setDeletingId(orderId)
      const companyId = user?.companyId
      if (!companyId) throw new Error(tCosts("notAuthenticated"))

      await costService.deletePurchaseOrder(companyId, orderId)
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))

      toast({
        title: tCosts("success"),
        description: tCosts("orderDeletedSuccess"),
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: tCosts("error"),
        description: tCosts("unableToDeleteOrder"),
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-green-50 text-green-700"
      case "ordered":
      case "partially_received":
        return "bg-blue-50 text-blue-700"
      case "approved":
        return "bg-purple-50 text-purple-700"
      case "pending":
        return "bg-yellow-50 text-yellow-700"
      case "cancelled":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "received":
        return tCosts("statusDelivered")
      case "ordered":
        return tCosts("statusOrdered")
      case "partially_received":
        return tCosts("statusPartiallyDelivered")
      case "approved":
        return tCosts("statusApproved")
      case "pending":
        return tCosts("statusPending")
      case "cancelled":
        return tCosts("statusCancelled")
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return CheckCircle
      case "ordered":
      case "partially_received":
        return Package
      case "approved":
        return CheckCircle
      case "pending":
        return Clock
      case "cancelled":
        return AlertTriangle
      default:
        return Package
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"
    return amount.toLocaleString(currencyLocale, { style: "currency", currency: "MAD" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
    return date.toLocaleDateString(dateLocale)
  }

  const headers = [
    tCosts("order"),
    tCosts("supplier"),
    tCosts("date"),
    tCosts("amount"),
    tCosts("status"),
    tCosts("actions"),
  ]

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <Card>
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-200"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-gray-200"></div></td>
                  <td className="px-6 py-4"><div className="h-6 w-20 rounded bg-gray-200"></div></td>
                  <td className="px-6 py-4"><div className="flex gap-2"><div className="h-8 w-8 rounded bg-gray-200"></div><div className="h-8 w-8 rounded bg-gray-200"></div></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Card>
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{tCosts("noOrdersFound")}</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{order.order_number}</div>
                          {order.project?.name && <div className="text-xs text-gray-500">{order.project.name}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{order.supplier?.name || tCosts("notSpecified")}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(order.order_date)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(order.total_amount || 0)}</td>
                      <td className="px-6 py-4">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          <StatusIcon size={12} />
                          {getStatusText(order.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                            <Link href={`/costs/orders/${order.id}`}>
                              <Eye size={16} className="text-gray-600" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingId === order.id}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                          >
                            {deletingId === order.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <Trash2 size={16} className="text-red-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {orders.length > 0 && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/costs/orders">{tCosts("viewAllOrders")}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
