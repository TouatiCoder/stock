"use client"

import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { useCostsTranslations } from "@/components/LocaleProvider"

interface CostsDashboardProps {
  totalBudget: number
  totalSpent: number
  pendingInvoices: number
  pendingAmount: number
  paidInvoices: number
  paidAmount: number
  costData: Array<{ month: string; budget: number; actual: number; invoiced?: number }>
  supplierData: Array<{ name: string; percentage: number }>
  loading: boolean
}

export function CostsDashboard({
  totalBudget,
  totalSpent,
  pendingInvoices,
  pendingAmount,
  paidInvoices,
  paidAmount,
  costData,
  supplierData,
  loading
}: CostsDashboardProps) {
  const t = useCostsTranslations()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="p-6 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <div className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const chartData = costData.length > 0 ? costData : [
    { month: t("monthJan"), budget: 50000, actual: 48000, invoiced: 45000 },
    { month: t("monthFeb"), budget: 50000, actual: 52000, invoiced: 48000 },
    { month: t("monthMar"), budget: 50000, actual: 49500, invoiced: 47000 },
    { month: t("monthApr"), budget: 50000, actual: 55000, invoiced: 51000 },
  ]

  const chartSupplierData = supplierData.length > 0 ? supplierData : [
    { name: t("supplierA"), percentage: 35 },
    { name: t("supplierB"), percentage: 28 },
    { name: t("supplierC"), percentage: 22 },
    { name: t("supplierOther"), percentage: 15 },
  ]

  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t("totalBudget")}</p>
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalBudget.toLocaleString("fr-MA")} MAD
            </p>
            <p className="text-xs text-gray-500 mt-2">{t("allProjects")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t("spent")}</p>
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalSpent.toLocaleString("fr-MA")} MAD
            </p>
            <p className="text-xs text-green-600 mt-2">
              {t("budgetUsage").replace("{percent}", budgetPercentage.toFixed(1))}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t("pendingInvoices")}</p>
              <AlertTriangle size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingInvoices}</p>
            <p className="text-xs text-orange-600 mt-2">
              {pendingAmount.toLocaleString("fr-MA")} MAD
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t("paidInvoices")}</p>
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
            <p className="text-xs text-gray-500 mt-2">
              {paidAmount.toLocaleString("fr-MA")} MAD
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("costEvolution")}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="budget" stroke="#1e40af" strokeWidth={2} name={t("budgetLabel")} />
                <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name={t("actualLabel")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("supplierBreakdown")}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartSupplierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" name={t("percentLabel")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
