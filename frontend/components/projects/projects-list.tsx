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

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

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
        className="border px-3 py-2 rounded max-w-md"
      />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Budget</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.location || "-"}</td>
              <td>{p.budget_mad.toLocaleString()} MAD</td>
              <td>
                <Badge className={statusColors[p.status] || ""}>{p.status.replace("_", " ")}</Badge>
              </td>
              <td>{p.start_date && p.end_date ? `${p.start_date} - ${p.end_date}` : "-"}</td>
              <td>
                <Button variant="ghost"><Eye size={16} /></Button>
                <Button variant="ghost"><Edit2 size={16} /></Button>
                <Button variant="ghost" className="text-red-600"><Trash2 size={16} /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
