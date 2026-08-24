// app/costs/orders/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Plus,
  Package,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  Calendar,
  Building,
  User,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { getOrders, deleteOrder } from "@/app/actions/order-actions"
import { useCostsTranslations } from "@/components/LocaleProvider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: any // Decimal from Prisma
  orderDate: Date | null
  expectedDelivery: Date | null
  createdAt: Date
  supplier: {
    id: string
    name: string
  }
  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  items: any[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.companyId) {
      fetchOrders()
    }
  }, [user?.companyId, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      console.log("fetchOrders called, user:", user)
      console.log("user.companyId:", user?.companyId)

      if (!user?.companyId) {
        console.log("No companyId, returning")
        return
      }

      const result = await getOrders(user.companyId, {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      })

      console.log("getOrders result:", result)

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch orders")
      }

      setOrders(result.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error(tCosts("unableToLoadOrders"))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(tCosts("deleteOrderConfirm"))) return

    try {
      setDeletingId(orderId)
      const result = await deleteOrder(orderId)

      if (result.success) {
        toast.success(tCosts("orderDeletedSuccess"))
        fetchOrders()
      } else {
        toast.error(result.error || tCosts("unableToDeleteOrder"))
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error(tCosts("unableToDeleteOrder"))
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return tCosts("notSpecified")
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return tCosts("notSpecified")
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: tCosts("statusDraft"), className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
      pending: { label: tCosts("statusPending"), className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      approved: { label: tCosts("statusApproved"), className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      sent: { label: tCosts("statusSent"), className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      received: { label: tCosts("statusReceived"), className: "bg-green-100 text-green-800 hover:bg-green-100" },
      cancelled: { label: tCosts("statusCancelled"), className: "bg-red-100 text-red-800 hover:bg-red-100" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "bg-gray-100 text-gray-700 hover:bg-gray-100" }

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        order.supplier.name.toLowerCase().includes(q) ||
        order.orderNumber.toLowerCase().includes(q)
      )
    }
    return true
  })

  const ordersContent = (() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">{tCosts("loading")}</div>
        </div>
      )
    }

    if (filteredOrders.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{tCosts("suppliersOrdersEmpty")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{tCosts("startByAddingFirstSupplier")}</p>
          <Button asChild className="mt-4">
            <Link href="/costs/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              {tCosts("createOrderButton")}
            </Link>
          </Button>
        </Card>
      )
    }

    return (
      <>
        <div className="hidden md:block overflow-x-auto bg-slate-50 p-2 rounded-xl w-full max-w-full">
          <Card className="bg-white border border-slate-200 shadow-sm w-full max-w-full">
            <table className="w-full bg-white">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("order")}</th>
                  <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("supplier")}</th>
                  <th className="hidden lg:table-cell px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("date")}</th>
                  <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("amount")}</th>
                  <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("status")}</th>
                  <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-900">{tCosts("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-3 md:px-4 lg:px-6 py-4">
                      <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                      <div className="lg:hidden text-xs text-gray-500 mt-0.5">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-4 text-gray-900 truncate max-w-[160px]">{order.supplier.name}</td>
                    <td className="hidden lg:table-cell px-3 md:px-4 lg:px-6 py-4 text-gray-600">{formatDate(order.orderDate)}</td>
                    <td className="px-3 md:px-4 lg:px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-3 md:px-4 lg:px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-3 md:px-4 lg:px-6 py-4">
                      <div className="flex gap-1 lg:gap-2">
                        <Link href={`/costs/orders/${order.id}`} className="inline-flex items-center justify-center p-1.5 lg:p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                          <Eye size={16} className="text-gray-600" />
                        </Link>
                        <Link href={`/costs/orders/${order.id}/print`} target="_blank" className="inline-flex items-center justify-center p-1.5 lg:p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                          <Printer size={16} className="text-gray-600" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deletingId === order.id}
                          className="inline-flex items-center justify-center p-1.5 lg:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                  <p className="text-sm text-muted-foreground">{order.supplier.name}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{tCosts("date")}</p>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tCosts("amount")}</p>
                  <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/costs/orders/${order.id}`} className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <Eye size={16} />
                </Link>
                <Link href={`/costs/orders/${order.id}/print`} className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  <Printer size={16} />
                </Link>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  disabled={deletingId === order.id}
                  className="flex-1 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </>
    )
  })()

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tCosts("orders")}</h1>
          <p className="text-muted-foreground">
            {tCosts("suppliersOrdersTitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/costs/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            {tCosts("newOrder")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCosts("supplierSearchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">{tCosts("supplierTabAll")}</TabsTrigger>
            <TabsTrigger value="draft">{tCosts("statusDraft")}</TabsTrigger>
            <TabsTrigger value="pending">{tCosts("statusPending")}</TabsTrigger>
            <TabsTrigger value="approved">{tCosts("statusApproved")}</TabsTrigger>
            <TabsTrigger value="sent">{tCosts("statusSent")}</TabsTrigger>
            <TabsTrigger value="received">{tCosts("statusReceived")}</TabsTrigger>
            <TabsTrigger value="cancelled">{tCosts("statusCancelled")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {ordersContent}
      </div>
    </div>
  )
}
