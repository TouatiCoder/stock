"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// ✅ Export du type
export interface ProjectData {
  id: string
  name: string
  budget_mad: number
  spent_mad: number
}

interface OverviewChartsProps {
  projects: ProjectData[]
}

export function OverviewCharts({ projects }: OverviewChartsProps) {
  const sortedProjects = [...projects].sort((a, b) => b.budget_mad - a.budget_mad)

  const data = sortedProjects.map((p) => ({
    name: p.name,
    budget: Number(p.budget_mad) || 0,
    spent: Number(p.spent_mad) || 0,
  }))

  if (data.length === 0) {
    return <p className="text-center text-slate-500">No project data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value) =>
            typeof value === "number" ? `${value.toLocaleString()} MAD` : value
          }
        />
        <Legend />
        <Bar dataKey="budget" fill="#3b82f6" name="Budget (MAD)" />
        <Bar dataKey="spent" fill="#ef4444" name="Spent (MAD)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
