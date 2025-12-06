import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informations du Projet</h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Nom du Projet</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">Bâtiment Commercial - Dammam</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Location</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">Dammam, Arabie Saoudite</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Budget Total</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">500,000 MAD</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Dépensé</label>
            <p className="text-lg font-semibold text-green-600 mt-1">485,000 MAD (97%)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Date Début</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">15 Janvier 2024</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Date Fin</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">30 Juin 2025</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button className="w-full">Modifier le Projet</Button>
        </div>
      </div>
    </Card>
  )
}
