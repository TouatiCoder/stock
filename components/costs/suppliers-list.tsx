"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  Clock,
  Package,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  ShoppingCart,
} from "lucide-react"
import { costService } from "@/lib/services/costService"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider"

interface SuppliersListProps {
  searchTerm: string
  limit?: number
}

export function SuppliersList({ searchTerm, limit = 3 }: SuppliersListProps) {
  const { user } = useAuth()
  const tCosts = useCostsTranslations()
  const { locale } = useLocale()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [supplierStats, setSupplierStats] = useState<Record<string, any>>({})

  useEffect(() => {
    if (user?.companyId) {
      fetchSuppliers()
    }
  }, [user?.companyId, searchTerm])

  useEffect(() => {
    if (suppliers.length > 0) {
      fetchSuppliersStats()
    }
  }, [suppliers])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const companyId = user?.companyId
      if (!companyId) return

      const data = await costService.getSuppliers(companyId, { search: searchTerm || undefined })
      setSuppliers(data.slice(0, limit) || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliersStats = async () => {
    try {
      const stats: Record<string, any> = {}

      for (const supplier of suppliers) {
        try {
          const details = await costService.getSupplier(supplier.id)
          const orders = details.purchaseOrders || []

          const totalSpent = orders.reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0)
          const completedOrders = orders.filter((order: any) => order.status === "received" || order.status === "completed").length

          stats[supplier.id] = {
            totalOrders: orders.length,
            completedOrders,
            totalSpent,
            onTimeRate: 0,
            qualityRate: 0,
            deliveryScore: 0,
          }
        } catch (error) {
          console.error(`Error fetching stats for supplier ${supplier.id}:`, error)
          stats[supplier.id] = {
            totalOrders: 0,
            completedOrders: 0,
            totalSpent: 0,
            onTimeRate: 0,
            qualityRate: 0,
            deliveryScore: 0,
          }
        }
      }

      setSupplierStats(stats)
    } catch (error) {
      console.error("Error fetching suppliers stats:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyLocale = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US"
    return amount.toLocaleString(currencyLocale, {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    })
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="animate-pulse p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="mb-2 h-5 w-32 rounded bg-gray-200"></div>
                    <div className="h-4 w-24 rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="h-6 w-16 rounded bg-gray-200"></div>
              </div>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="h-8 w-32 rounded bg-gray-200"></div>
                <div className="h-8 w-24 rounded bg-gray-200"></div>
                <div className="h-8 w-28 rounded bg-gray-200"></div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="mb-1 h-3 w-20 rounded bg-gray-200"></div>
                    <div className="h-4 w-12 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
              <div className="h-10 rounded bg-gray-200"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (suppliers.length === 0 && !loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">{tCosts("noSuppliersFound")}</h3>
          <p className="mb-6 text-gray-600">
            {searchTerm ? tCosts("noResultsFor").replace("{term}", searchTerm) : tCosts("startByAddingFirstSupplier")}
          </p>
          <Button asChild>
            <Link href="/costs/suppliers/new">{tCosts("addSupplier")}</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full max-w-full">
      {suppliers.map((supplier) => {
        const stats = supplierStats[supplier.id] || {}
        return (
          <Card key={supplier.id} className="overflow-hidden transition-shadow duration-200 hover:shadow-lg">
            <div className="p-4 md:p-6">
              {/* Header Section */}
              <div className="mb-4 md:mb-6 space-y-3 md:space-y-0 md:flex md:items-start md:justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <Avatar className="h-12 md:h-14 w-12 md:w-14 border-2 border-gray-100 shrink-0">
                    <AvatarFallback
                      className="text-base md:text-lg font-semibold"
                      style={{
                        backgroundColor: supplier.isActive ? "#DCFCE7" : "#F3F4F6",
                        color: supplier.isActive ? "#166534" : "#6B7280",
                      }}
                    >
                      {getInitials(supplier.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">{supplier.name}</h3>
                      {supplier.contactPerson && <span className="text-xs md:text-sm text-gray-600 truncate">({supplier.contactPerson})</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={supplier.isActive ? "default" : "secondary"}
                        className={supplier.isActive ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"}
                      >
                        {supplier.isActive ? tCosts("active") : tCosts("inactive")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs md:text-sm">
                  <div className="text-gray-500">{tCosts("since")}</div>
                  <div className="font-medium text-gray-900">{new Date(supplier.createdAt).toLocaleDateString(dateLocale)}</div>
                </div>
              </div>

              {/* Contact Info - Responsive */}
              <div className="mb-4 md:mb-6">
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 rounded-full bg-blue-50 px-2 md:px-3 py-1.5 text-xs md:text-sm text-blue-700">
                      <Phone size={12} className="md:block hidden" />
                      <Phone size={10} className="md:hidden block" />
                      <span className="truncate">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 rounded-full bg-purple-50 px-2 md:px-3 py-1.5 text-xs md:text-sm text-purple-700">
                      <Mail size={12} className="md:block hidden" />
                      <Mail size={10} className="md:hidden block" />
                      <span className="truncate max-w-[150px] md:max-w-[180px]">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 rounded-full bg-amber-50 px-2 md:px-3 py-1.5 text-xs md:text-sm text-amber-700">
                      <MapPin size={12} className="md:block hidden" />
                      <MapPin size={10} className="md:hidden block" />
                      <span className="truncate max-w-[120px] md:max-w-[150px]">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Section */}
              <div className="mb-4 md:mb-6">
                <h4 className="mb-3 md:mb-4 text-xs md:text-sm font-semibold uppercase tracking-wider text-gray-700">{tCosts("performance")}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div className="rounded-lg bg-gray-50 p-2 md:p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Clock size={14} className="text-blue-600 hidden md:inline" />
                      <Clock size={12} className="text-blue-600 md:hidden" />
                      <p className="text-xs md:text-xs text-gray-600 line-clamp-1">{tCosts("punctuality")}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.onTimeRate || 0}%</p>
                      <span className="text-xs text-gray-500 hidden md:inline">/100%</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 md:p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Star size={14} className="text-amber-600 hidden md:inline" />
                      <Star size={12} className="text-amber-600 md:hidden" />
                      <p className="text-xs md:text-xs text-gray-600 line-clamp-1">{tCosts("quality")}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.qualityRate || 0}%</p>
                      <span className="text-xs text-gray-500 hidden md:inline">/100%</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 md:p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Package size={14} className="text-green-600 hidden md:inline" />
                      <Package size={12} className="text-green-600 md:hidden" />
                      <p className="text-xs md:text-xs text-gray-600 line-clamp-1">{tCosts("orders")}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-2 md:p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <TrendingUp size={14} className="text-purple-600 hidden md:inline" />
                      <TrendingUp size={12} className="text-purple-600 md:hidden" />
                      <p className="text-xs md:text-xs text-gray-600 line-clamp-1">{tCosts("totalSpent")}</p>
                    </div>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-1">{formatCurrency(stats.totalSpent || 0)}</p>
                  </div>
                </div>
              </div>

              <Separator className="mb-3 md:mb-4" />

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs md:text-sm" asChild>
                  <Link href={`/costs/suppliers/${supplier.id}`}>
                    <Eye size={14} />
                    <span className="hidden md:inline">{tCosts("viewDetails")}</span>
                    <span className="md:hidden">{tCosts("detailsShort")}</span>
                  </Link>
                </Button>
                <Button size="sm" className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm" asChild>
                  <Link href={`/costs/orders/new?supplier=${supplier.id}`}>
                    <ShoppingCart size={14} />
                    <span className="hidden md:inline">{tCosts("newOrder")}</span>
                    <span className="md:hidden">{tCosts("orderShort")}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {suppliers.length > 0 && (
        <div className="pt-3 md:pt-4 text-center">
          <Button variant="outline" size="sm" asChild className="gap-2 text-xs md:text-sm">
            <Link href="/costs/suppliers">
              {tCosts("viewAllSuppliers")} ({suppliers.length})
              <TrendingUp size={14} className="hidden md:inline" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
