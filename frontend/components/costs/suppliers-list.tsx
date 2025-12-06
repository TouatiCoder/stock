import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Clock } from "lucide-react"

export function SuppliersList() {
  const suppliers = [
    {
      id: 1,
      name: "Matériaux Pro",
      rating: 4.8,
      onTimeRate: 95,
      qualityRate: 98,
      totalOrders: 45,
      totalSpent: 75000,
      status: "Actif",
    },
    {
      id: 2,
      name: "Construction Plus",
      rating: 4.5,
      onTimeRate: 88,
      qualityRate: 92,
      totalOrders: 32,
      totalSpent: 52000,
      status: "Actif",
    },
    {
      id: 3,
      name: "Fournisseur Elite",
      rating: 4.9,
      onTimeRate: 99,
      qualityRate: 99,
      totalOrders: 28,
      totalSpent: 61000,
      status: "Actif",
    },
  ]

  return (
    <div className="space-y-4">
      {suppliers.map((supplier) => (
        <Card key={supplier.id}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.floor(supplier.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{supplier.rating}/5</span>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                {supplier.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Taux de Ponctualité</p>
                <div className="flex items-center gap-1">
                  <Clock size={16} className="text-blue-600" />
                  <p className="font-bold text-gray-900">{supplier.onTimeRate}%</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Qualité</p>
                <p className="font-bold text-gray-900">{supplier.qualityRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Commandes</p>
                <p className="font-bold text-gray-900">{supplier.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Dépensé</p>
                <p className="font-bold text-gray-900">{supplier.totalSpent.toLocaleString()} MAD</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent">
                Voir Historique
              </Button>
              <Button className="flex-1">Nouvelle Commande</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
