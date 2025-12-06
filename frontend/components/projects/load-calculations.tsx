import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

interface LoadCalculationsProps {
  projectId: string
}

export function LoadCalculations({ projectId }: LoadCalculationsProps) {
  const calculations = [
    { type: "Charge Permanente", value: "500 kg/m²", factor: "1.35" },
    { type: "Charge Variable", value: "250 kg/m²", factor: "1.50" },
    { type: "ELU", value: "925 kg/m²" },
    { type: "ELS", value: "750 kg/m²" },
  ]

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Calculs de Charges</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {calculations.map((calc, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{calc.type}</p>
              <p className="text-lg font-bold text-gray-900">{calc.value}</p>
              {calc.factor && <p className="text-xs text-gray-500 mt-1">Facteur: {calc.factor}</p>}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 flex items-center justify-center gap-2">
            <Calculator size={16} />
            Calculatrice
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Exporter
          </Button>
        </div>
      </div>
    </Card>
  )
}
