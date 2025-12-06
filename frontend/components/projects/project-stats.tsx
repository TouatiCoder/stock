import { Card } from "@/components/ui/card"
import { Briefcase, AlertCircle, CheckCircle, Clock } from "lucide-react"

export function ProjectStats() {
  const stats = [
    {
      label: "Projets Actifs",
      value: "8",
      icon: Briefcase,
      color: "blue",
    },
    {
      label: "En Planification",
      value: "3",
      icon: Clock,
      color: "orange",
    },
    {
      label: "Complétés",
      value: "12",
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Hors Budget",
      value: "2",
      icon: AlertCircle,
      color: "red",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const colorMap = {
          blue: "bg-blue-50 text-blue-600",
          green: "bg-green-50 text-green-600",
          red: "bg-red-50 text-red-600",
          orange: "bg-orange-50 text-orange-600",
        }
        return (
          <Card key={i}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <div className={`p-2 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
