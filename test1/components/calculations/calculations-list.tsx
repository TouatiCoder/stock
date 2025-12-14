"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Calculation } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit2, Trash2 } from "lucide-react"

export function CalculationsList() {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("calculations").select("*").order("created_at", { ascending: false })

        if (data) setCalculations(data as Calculation[])
      } catch (error) {
        console.error("Error fetching calculations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalculations()
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading calculations...</div>
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-800",
    completed: "bg-blue-100 text-blue-800",
    reviewed: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Title</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calculations.map((calc) => (
            <tr key={calc.id} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{calc.title}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{calc.calculation_type}</td>
              <td className="px-6 py-4 text-sm">
                <Badge className={statusColors[calc.status] || "bg-slate-100"}>{calc.status}</Badge>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">{new Date(calc.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
