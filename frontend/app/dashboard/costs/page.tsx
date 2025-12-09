// @/app/dashboard/costs/page.tsx - VERSION AVEC BACKEND
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CostsOverview } from "@/components/costs/costs-overview"
import { AddExpenseDialog } from "@/components/costs/add-expense-dialog"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Expense, Project } from "@/lib/types"

export default function CostsPage() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    thisMonthExpenses: 0,
    supplierCount: 0,
    budgetUsed: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // 1. Récupérer toutes les dépenses
        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("amount_mad, date")
        
        if (expensesError) throw expensesError
        
        // 2. Récupérer tous les projets
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("budget_mad")
        
        if (projectsError) throw projectsError
        
        // 3. Récupérer les fournisseurs
        const { data: suppliers, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id")
        
        if (suppliersError) throw suppliersError
        
        // 4. Calculer les statistiques
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const totalExpenses = expenses?.reduce((sum: number, expense: Expense) => 
          sum + expense.amount_mad, 0) || 0
        
        const thisMonthExpenses = expenses?.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear
        }).reduce((sum: number, expense: Expense) => sum + expense.amount_mad, 0) || 0
        
        const supplierCount = suppliers?.length || 0
        
        const totalBudget = projects?.reduce((sum: number, project: Project) => 
          sum + (project.budget_mad || 0), 0) || 0
        
        const budgetUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0
        
        setStats({
          totalExpenses,
          thisMonthExpenses,
          supplierCount,
          budgetUsed
        })
        
      } catch (err: any) {
        console.error("Error fetching costs stats:", err)
        setError(err.message || "Failed to load statistics")
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
    
    // Écouter les mises à jour
    const handleUpdate = () => {
      setLoading(true)
      fetchStats()
    }
    
    window.addEventListener('expense-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('expense-updated', handleUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">Costs & Expenses</h1>
            <p className="text-slate-500">Track project costs and manage suppliers</p>
          </div>
          <AddExpenseDialog />
        </div>
        <div className="text-center py-12 text-slate-500">
          Loading costs statistics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">Costs & Expenses</h1>
            <p className="text-slate-500">Track project costs and manage suppliers</p>
          </div>
          <AddExpenseDialog />
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error Loading Statistics</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Costs & Expenses</h1>
          <p className="text-slate-500">Track project costs and manage suppliers</p>
        </div>
        <AddExpenseDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="text-3xl font-bold text-slate-900">
            {stats.totalExpenses.toLocaleString('fr-MA')} MAD
          </p>
          <p className="text-xs text-slate-400">Year to date</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="text-3xl font-bold text-slate-900">
            {stats.thisMonthExpenses.toLocaleString('fr-MA')} MAD
          </p>
          <p className="text-xs text-green-600">Current month total</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Suppliers</p>
          <p className="text-3xl font-bold text-slate-900">{stats.supplierCount}</p>
          <p className="text-xs text-slate-400">Active partners</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Budget Used</p>
          <p className="text-3xl font-bold text-slate-900">
            {stats.budgetUsed.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">of total budget</p>
        </Card>
      </div>

      <CostsOverview />
    </div>
  )
}