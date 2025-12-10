"use client"

import { useState } from "react"
import type { Project } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit2, Trash2 } from "lucide-react"

interface ProjectsListProps {
  projects: Project[]
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const [search, setSearch] = useState("")

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search projects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:max-w-md"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-800">{p.name}</h2>
              <p className="text-sm text-gray-500">{p.location || "No location"}</p>
              <p className="text-sm text-gray-700 font-medium">
                Budget: {p.budget_mad.toLocaleString()} MAD
              </p>
              <Badge className={statusColors[p.status] || ""}>
                {p.status.replace("_", " ")}
              </Badge>
              <p className="text-sm text-gray-400">
                Duration: {p.start_date && p.end_date ? `${p.start_date} - ${p.end_date}` : "-"}
              </p>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="ghost" size="sm"><Eye size={16} /></Button>
              <Button variant="ghost" size="sm"><Edit2 size={16} /></Button>
              <Button variant="ghost" size="sm" className="text-red-600"><Trash2 size={16} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
