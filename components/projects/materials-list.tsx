import { Card } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

interface MaterialsListProps {
  projectId: string
}

export function MaterialsList({ projectId }: MaterialsListProps) {
  const materials = [
    { name: "Poutrelles HEB 200", spec: "Acier S235", qty: 45 },
    { name: "Dalle Béton", spec: "20cm, C25", qty: 500 },
    { name: "Briques", spec: "Rupt. 10 MPa", qty: 8000 },
    { name: "Finitions", spec: "Enduit + Peinture", qty: 2500 },
  ]

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Matériaux Standardisés</h2>
        </div>

        <div className="space-y-3">
          {materials.map((mat, i) => (
            <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-medium text-gray-900">{mat.name}</p>
              <p className="text-xs text-gray-600 mt-1">{mat.spec}</p>
              <p className="text-sm font-semibold text-orange-600 mt-2">{mat.qty} unités</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
