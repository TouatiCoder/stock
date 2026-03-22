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
  const pendingOrdersLabel = await t("costs", "pendingOrders")
  const activeSuppliersLabel = await t("costs", "activeSuppliers")

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{totalExpensesLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{pendingOrdersLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{activeSuppliersLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <OrdersList searchTerm="" />
        <SuppliersList searchTerm="" limit={3} />
      </div>
    </div>
  )
}
