"use client"

import { Card } from "@/components/ui/card"
import { Edit2, Trash2 } from "lucide-react"

interface InventoryListProps {
  searchTerm: string
  filterCategory: string
}

export function InventoryList({ searchTerm, filterCategory }: InventoryListProps) {
  const materials = [
    { id: 1, name: "Ciment Portland", category: "concrete", unit: "sacs", available: 250, minimum: 500, price: 85 },
    { id: 2, name: "Acier HA 500", category: "steel", unit: "tonnes", available: 45, minimum: 100, price: 4200 },
    { id: 3, name: "Sable Fin", category: "concrete", unit: "m³", available: 120, minimum: 200, price: 350 },
    {
      id: 4,
      name: "Briques Creuses",
      category: "finishing",
      unit: "palette",
      available: 80,
      minimum: 150,
      price: 1200,
    },
    { id: 5, name: "Tubes PVC", category: "electrical", unit: "mètres", available: 500, minimum: 300, price: 25 },
  ]

  const filtered = materials.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = filterCategory === "all" || m.category === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Matériau</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Disponible</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Minimum</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valeur Unitaire</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">État</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((mat) => {
              const isLow = mat.available < mat.minimum
              const statusColor = isLow ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              const statusText = isLow ? "Critique" : "Normal"
              return (
                <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{mat.name}</p>
                      <p className="text-xs text-gray-500">{mat.unit}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{mat.available}</td>
                  <td className="px-6 py-4 text-gray-600">{mat.minimum}</td>
                  <td className="px-6 py-4 text-gray-900">{mat.price} MAD</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                    >
                      {statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
