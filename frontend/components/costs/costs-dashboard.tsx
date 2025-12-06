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

export function CostsDashboard() {
  const costData = [
    { month: "Jan", budget: 50000, actual: 48000, invoiced: 45000 },
    { month: "Feb", budget: 50000, actual: 52000, invoiced: 48000 },
    { month: "Mar", budget: 50000, actual: 49500, invoiced: 47000 },
    { month: "Apr", budget: 50000, actual: 55000, invoiced: 51000 },
  ]

  const supplierData = [
    { name: "Fournisseur A", percentage: 35 },
    { name: "Fournisseur B", percentage: 28 },
    { name: "Fournisseur C", percentage: 22 },
    { name: "Autres", percentage: 15 },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">250,000 MAD</p>
            <p className="text-xs text-gray-500 mt-2">Tous projets</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Dépensé</p>
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">206,500 MAD</p>
            <p className="text-xs text-green-600 mt-2">82.6% du budget</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Factures en Attente</p>
              <AlertTriangle size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">8</p>
            <p className="text-xs text-orange-600 mt-2">45,000 MAD</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Payées</p>
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">42</p>
            <p className="text-xs text-gray-500 mt-2">161,500 MAD</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des Coûts</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="budget" stroke="#1e40af" strokeWidth={2} name="Budget" />
                <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Réel" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition par Fournisseur</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" name="%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
