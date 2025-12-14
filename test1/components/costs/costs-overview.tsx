"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Expense } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Trash2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["#0ea5e9", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function CostsOverview() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("expenses").select("*").order("date", { ascending: false })

        if (data) setExpenses(data as Expense[])
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const categoryTotals = expenses.reduce(
    (acc, exp) => {
      const existing = acc.find((item) => item.name === exp.category)
      if (existing) {
        existing.value += exp.amount_mad
      } else {
        acc.push({ name: exp.category, value: exp.amount_mad })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.description.toLowerCase().includes(search.toLowerCase()) ||
      exp.category.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading expenses...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Expenses by Category</h3>
        {categoryTotals.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTotals}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}K`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryTotals.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${(value / 1000).toFixed(1)}K MAD`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500">No data available</div>
        )}
      </Card>

      <Card className="lg:col-span-2 p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Recent Expenses</h3>

        <Input
          type="search"
          placeholder="Search by description or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredExpenses.slice(0, 10).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                <p className="text-xs text-slate-500">{expense.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-bold text-slate-900">{expense.amount_mad.toLocaleString()} MAD</p>
                <div className="space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
