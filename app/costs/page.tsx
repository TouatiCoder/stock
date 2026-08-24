import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { OrdersList } from "@/components/costs/orders-list"
import { SuppliersList } from "@/components/costs/suppliers-list"
import { checkAuth } from "@/lib/auth/auth-utils"
import { redirect } from "next/navigation"
import { t } from "@/lib/server-i18n"

export default async function CostsPage() {
  const user = await checkAuth()
  if (!user) redirect("/login")

  const [purchaseOrders, suppliers] = await Promise.all([
    db.purchaseOrder.findMany({
      where: { companyId: user.companyId },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    }),
    db.supplier.findMany({
      where: { companyId: user.companyId },
      include: { purchaseOrders: true },
    }),
  ])

  const totalExpenses = purchaseOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)
  const pendingOrders = purchaseOrders.filter((o) => o.status === "pending").length

  const pageTitle = await t("costs", "pageTitle")
  const totalExpensesLabel = await t("costs", "totalExpenses")
  const totalExpensesTrend = await t("costs", "totalExpensesTrend")
  const pendingOrdersLabel = await t("costs", "pendingOrders")
  const pendingOrdersHint = await t("costs", "pendingOrdersHint")
  const activeSuppliersLabel = await t("costs", "activeSuppliers")
  const activeSuppliersHint = await t("costs", "activeSuppliersHint")

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">{await t("costs", "pageDescription") || "Gestion des commandes et des dépenses"}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{totalExpensesLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-gray-600 mt-1">{totalExpensesTrend}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{pendingOrdersLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-gray-600 mt-1">{pendingOrdersHint}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">{activeSuppliersLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-gray-600 mt-1">{activeSuppliersHint}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders - Full Width */}
      <div>
        <OrdersList searchTerm="" />
      </div>

      {/* Suppliers */}
      <div>
        <SuppliersList searchTerm="" limit={3} />
      </div>
    </div>
  )
}
