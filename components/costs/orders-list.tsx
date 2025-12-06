import { Card } from "@/components/ui/card"
import { Eye, Trash2 } from "lucide-react"

export function OrdersList() {
  const orders = [
    {
      id: "CMD-001",
      supplier: "Matériaux Pro",
      date: "2024-12-01",
      amount: 25000,
      status: "Livrée",
      items: 5,
    },
    {
      id: "CMD-002",
      supplier: "Construction Plus",
      date: "2024-11-28",
      amount: 18500,
      status: "En cours",
      items: 3,
    },
    {
      id: "CMD-003",
      supplier: "Fournisseur Elite",
      date: "2024-11-25",
      amount: 35000,
      status: "En attente",
      items: 8,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livrée":
        return "bg-green-50 text-green-700"
      case "En cours":
        return "bg-blue-50 text-blue-700"
      case "En attente":
        return "bg-orange-50 text-orange-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  return (
    <div className="overflow-x-auto">
      <Card>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Commande</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fournisseur</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{order.id}</td>
                <td className="px-6 py-4 text-gray-600">{order.supplier}</td>
                <td className="px-6 py-4 text-gray-600">{order.date}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{order.amount.toLocaleString()} MAD</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
