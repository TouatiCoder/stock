import { Card } from "@/components/ui/card"
import { Package, TrendingDown, AlertTriangle, ShoppingCart } from "lucide-react"

export function InventoryStats() {
  const stats = [
    {
      label: "Valeur Inventaire",
      value: "125,750 MAD",
      icon: Package,
      color: "blue",
      change: "+5.2%",
    },
    {
      label: "Quantité Totale",
      value: "2,450 unités",
      icon: TrendingDown,
      color: "green",
      change: "-2.1%",
    },
    {
      label: "Seuils Critiques",
      value: "3 matériaux",
      icon: AlertTriangle,
      color: "red",
      change: "Urgent",
    },
    {
      label: "Commandes Ouvertes",
      value: "5 en cours",
      icon: ShoppingCart,
      color: "orange",
      change: "2 arriérées",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const colorMap = {
          blue: "bg-blue-50 text-blue-600",
          green: "bg-green-50 text-green-600",
          red: "bg-red-50 text-red-600",
          orange: "bg-orange-50 text-orange-600",
        }
        return (
          <Card key={i}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <div className={`p-2 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
