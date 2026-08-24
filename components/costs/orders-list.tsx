"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Package, Clock, CheckCircle, AlertTriangle, ArrowRight, ShoppingBag } from "lucide-react"
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

      setOrders(data.slice(0, 5) || [])
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400",
          icon: Package,
          label: tCosts("statusDraft"),
        }
      case "sent":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          dot: "bg-orange-500",
          icon: Package,
          label: tCosts("statusSent"),
        }
      case "received":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          dot: "bg-green-500",
          icon: CheckCircle,
          label: tCosts("statusReceived"),
        }
      case "ordered":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          dot: "bg-blue-500",
          icon: Package,
          label: tCosts("statusOrdered"),
        }
      case "partially_received":
        return {
          bg: "bg-sky-50",
          text: "text-sky-700",
          border: "border-sky-200",
          dot: "bg-sky-500",
          icon: Package,
          label: tCosts("statusPartiallyDelivered"),
        }
      case "approved":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          dot: "bg-blue-500",
          icon: CheckCircle,
          label: tCosts("statusApproved"),
        }
      case "pending":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          dot: "bg-amber-500",
          icon: Clock,
          label: tCosts("statusPending"),
        }
      case "cancelled":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          dot: "bg-red-500",
          icon: AlertTriangle,
          label: tCosts("statusCancelled"),
        }
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          dot: "bg-gray-500",
          icon: Package,
          label: status,
        }
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"
    return amount.toLocaleString(currencyLocale, { style: "currency", currency: "MAD" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"
    return date.toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {/* Desktop Loading */}
        <div className="hidden md:block">
          <Card className="overflow-hidden border border-slate-200/80 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="h-5 w-48 rounded-md bg-slate-200 animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                  <div className="flex gap-1.5 ml-auto">
                    <div className="h-8 w-8 rounded-lg bg-slate-200" />
                    <div className="h-8 w-8 rounded-lg bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Mobile Loading */}
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-5 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="flex gap-3">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border border-slate-200/80 shadow-sm bg-white">
          {/* Card Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{tCosts("order")}</h3>
                <p className="text-xs text-slate-500">{orders.length} {(orders.length > 1 ? tCosts("orders") : tCosts("order")).toLowerCase()}</p>
              </div>
            </div>
            <Link
              href="/costs/orders"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {tCosts("viewAllOrders")}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Table */}
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
                <Package className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">{tCosts("noOrdersFound")}</p>
              <p className="text-xs text-slate-400 mb-4">{tCosts("noOrdersYetHint")}</p>
              <Button size="sm" variant="outline" asChild className="text-xs">
                <Link href="/costs/orders/new">{tCosts("createOrderButton")}</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">{tCosts("order")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">{tCosts("supplier")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[14%]">{tCosts("date")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[16%]">{tCosts("amount")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">{tCosts("status")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[16%]">{tCosts("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon
                    return (
                      <tr
                        key={order.id}
                        className="group transition-all duration-200 hover:bg-slate-50/80"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-8 rounded-full ${statusConfig.dot} opacity-60`} />
                            <span className="text-sm font-semibold text-slate-800 tracking-tight truncate">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-700 font-medium">{order.supplier?.name || tCosts("notSpecified")}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-500">{order.orderDate ? formatDate(order.orderDate) : "—"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-slate-800">{formatCurrency(Number(order.totalAmount) || 0)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/costs/orders/${order.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            >
                              <Eye size={15} />
                            </Link>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingId === order.id}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                            >
                              {deletingId === order.id ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag size={14} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{tCosts("order")}</h3>
          </div>
          <Link
            href="/costs/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
          >
            {tCosts("viewAllOrders")}
            <ArrowRight size={12} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center border-slate-200/80">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">{tCosts("noOrdersFound")}</p>
          </Card>
        ) : (
          orders.map((order) => {
            const statusConfig = getStatusConfig(order.status)
            const StatusIcon = statusConfig.icon
            return (
              <Card key={order.id} className="overflow-hidden border-slate-200/80 hover:shadow-md transition-all duration-200">
                {/* Color accent top */}
                <div className={`h-1 ${statusConfig.dot}`} />
                <div className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{order.supplier?.name || tCosts("notSpecified")}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      <StatusIcon size={11} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{tCosts("date")}</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">{order.orderDate ? formatDate(order.orderDate) : "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{tCosts("amount")}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatCurrency(Number(order.totalAmount) || 0)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild className="flex-1 rounded-lg text-xs h-9 border-slate-200">
                      <Link href={`/costs/orders/${order.id}`} className="flex items-center justify-center gap-1.5">
                        <Eye size={14} />
                        {tCosts("view")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingId === order.id}
                      className="rounded-lg text-xs h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-3"
                    >
                      {deletingId === order.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
