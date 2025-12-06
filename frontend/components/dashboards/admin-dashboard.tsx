"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Package, AlertTriangle } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export function AdminDashboard() {
  // Données simulées pour les graphiques
  const costData = [
    { month: "Jan", budget: 50000, actual: 45000 },
    { month: "Feb", budget: 50000, actual: 52000 },
    { month: "Mar", budget: 50000, actual: 48000 },
    { month: "Apr", budget: 50000, actual: 55000 },
    { month: "May", budget: 50000, actual: 51000 },
  ]

  const inventoryData = [
    { name: "Acier", value: 35 },
    { name: "Béton", value: 25 },
    { name: "Finitions", value: 20 },
    { name: "Électrique", value: 20 },
  ]

  const COLORS = ["#1e40af", "#3b82f6", "#93c5fd", "#dbeafe"]

  return (
    <div className="space-y-6">
      {/* Section 1: KPIs de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Coût Total du Projet</p>
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">284,500 MAD</p>
            <p className="text-xs text-gray-500 mt-2">vs Budget: 300,000 MAD</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "95%" }}></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Marge Nette Estimée</p>
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">45,300 MAD</p>
            <p className="text-xs text-green-600 mt-2">+12% par rapport au mois dernier</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Valeur Inventaire</p>
              <Package size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">125,750 MAD</p>
            <p className="text-xs text-gray-500 mt-2">Stock actuel valorisé</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Employés Actifs</p>
              <AlertCircle size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500 mt-2">2 rôles en attente</p>
            <Button className="w-full mt-3 text-xs bg-transparent" variant="outline">
              Gérer les utilisateurs
            </Button>
          </div>
        </Card>
      </div>

      {/* Section 2: Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coût vs Budget */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Coût vs Budget</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" fill="#1e40af" name="Budget" />
                <Bar dataKey="actual" fill="#ef4444" name="Réel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Répartition Inventaire */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition Inventaire</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Section 3: Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Projets Hors Budget</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Projet A - Dammam", budget: 150000, actual: 157000, gap: 7000 },
                { name: "Projet B - Doha", budget: 120000, actual: 125000, gap: 5000 },
              ].map((project, i) => (
                <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <span className="text-xs font-bold text-orange-600">+{project.gap.toLocaleString()} MAD</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {((project.gap / project.budget) * 100).toFixed(1)}% de dépassement
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Alertes Critiques</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: "Stock Critique: Ciment", status: "Urgent", days: "2 jours" },
                { title: "Factures Impayées", status: "En Attente", days: "5 factures" },
              ].map((alert, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <span className="text-xs font-bold text-red-600">{alert.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{alert.days}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Section 4: Accès Rapide */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Accès Rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button className="w-full">Générer Rapports Financiers</Button>
            <Button variant="outline" className="w-full bg-transparent">
              Paramètres Globaux
            </Button>
            <Button variant="outline" className="w-full bg-transparent">
              Gestion des Utilisateurs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
