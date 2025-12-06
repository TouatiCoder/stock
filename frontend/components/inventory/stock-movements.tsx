import { Card } from "@/components/ui/card"
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react"

export function StockMovements() {
  const movements = [
    { date: "Aujourd'hui", type: "out", material: "Ciment", qty: 50, site: "Chantier A" },
    { date: "Hier", type: "in", material: "Acier", qty: 20, supplier: "Fournisseur X" },
    { date: "Il y a 2j", type: "return", material: "Briques", qty: 10, site: "Chantier B" },
  ]

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mouvements Récents</h3>
        <div className="space-y-3">
          {movements.map((mov, i) => {
            const IconComponent = mov.type === "out" ? ArrowDown : mov.type === "in" ? ArrowUp : RotateCcw
            const colorClass =
              mov.type === "out"
                ? "text-red-600 bg-red-50"
                : mov.type === "in"
                  ? "text-green-600 bg-green-50"
                  : "text-blue-600 bg-blue-50"

            return (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{mov.material}</p>
                  <p className="text-xs text-gray-500">
                    {mov.qty} unités • {mov.date}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
