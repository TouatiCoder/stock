"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, TrendingDown } from "lucide-react"

export function SupervisorDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs Opérationnels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Stock Disponible</p>
              <Package size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">2,450 unités</p>
            <p className="text-xs text-gray-500 mt-2">Tous les matériaux</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Seuils Critiques</p>
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-xs text-red-600 mt-2">Matériaux en danger</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Commandes En Cours</p>
              <TrendingDown size={18} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500 mt-2">Livraisons attendues</p>
          </div>
        </Card>
      </div>

      {/* Saisie Rapide */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Saisie Rapide de Consommation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="w-full bg-transparent" variant="outline">
              Enregistrer Sortie Stock
            </Button>
            <Button className="w-full bg-transparent" variant="outline">
              Créer Commande Fournisseur
            </Button>
          </div>
        </div>
      </Card>

      {/* Matériaux Critiques */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Matériaux Critiques</h3>
          <div className="space-y-3">
            {[
              { name: "Ciment (tonnes)", available: 50, minimum: 100, days: "2 jours" },
              { name: "Acier (tonnes)", available: 120, minimum: 200, days: "4 jours" },
              { name: "Sable (m³)", available: 80, minimum: 150, days: "3 jours" },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <span className="text-xs font-bold text-red-600">Rupture en {item.days}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Dispo: {item.available} / Min: {item.minimum}
                  </span>
                  <Button size="sm" variant="outline">
                    Commander
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
