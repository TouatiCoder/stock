"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, BookOpen } from "lucide-react"

export function EngineerDashboard() {
  return (
    <div className="space-y-6">
      {/* Outils Techniques */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Outils de Calcul</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="flex items-center justify-center gap-2">
              <Calculator size={18} />
              Calculatrice de Charges
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 bg-transparent">
              <BookOpen size={18} />
              Bibliothèque de Matériaux
            </Button>
          </div>
        </div>
      </Card>

      {/* Matériaux Standardisés */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Matériaux Standardisés</h3>
          <div className="space-y-3">
            {[
              { name: "Poutrelles HEB", spec: "HEB 200" },
              { name: "Dalle béton", spec: "200 mm", capacity: "600 kg/m²" },
              { name: "Briques", spec: "Rupt. 10 MPa" },
            ].map((mat, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{mat.name}</p>
                <p className="text-xs text-gray-600 mt-1">{mat.spec}</p>
                {mat.capacity && <p className="text-xs text-gray-600">{mat.capacity}</p>}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Projets Actifs */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Projets Actifs</h3>
          <div className="space-y-3">
            {[
              { name: "Bâtiment Commercial - Dammam", status: "En cours" },
              { name: "Résidence - Doha", status: "Planification" },
            ].map((proj, i) => (
              <Button key={i} variant="outline" className="w-full text-left h-auto py-3 justify-start bg-transparent">
                <div>
                  <p className="font-medium text-gray-900">{proj.name}</p>
                  <p className="text-xs text-gray-600">{proj.status}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
