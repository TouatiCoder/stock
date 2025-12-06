import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function CriticalThresholds() {
  const criticals = [
    { name: "Ciment", available: 250, minimum: 500, daysLeft: 2 },
    { name: "Briques", available: 80, minimum: 150, daysLeft: 3 },
    { name: "Acier", available: 45, minimum: 100, daysLeft: 4 },
  ]

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">Seuils Critiques</h3>
        </div>
        <div className="space-y-3">
          {criticals.map((item, i) => (
            <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{item.name}</p>
                <span className="text-xs font-bold text-red-600">{item.daysLeft}j</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {item.available}/{item.minimum}
              </p>
              <Button size="sm" className="w-full text-xs">
                Commander
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
