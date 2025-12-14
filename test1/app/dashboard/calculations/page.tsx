// @/app/calculations/page.tsx - VERSION AVEC BACKEND
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CalculationsList } from "@/components/calculations/calculations-list"
import { NewCalculationDialog } from "@/components/calculations/new-calculation-dialog"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Calculation } from "@/lib/types"

export default function CalculationsPage() {
  const [stats, setStats] = useState({
    totalCalculations: 0,
    pendingReview: 0,
    approved: 0,
    completed: 0,
    draft: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // Récupérer tous les calculs
        const { data: calculations, error: fetchError } = await supabase
          .from("calculations")
          .select("status")
        
        if (fetchError) {
          throw new Error(`Database error: ${fetchError.message}`)
        }
        
        if (calculations) {
          const totalCalculations = calculations.length
          
          // Compter par statut
          const statusCounts = calculations.reduce((acc: Record<string, number>, calc: Calculation) => {
            acc[calc.status] = (acc[calc.status] || 0) + 1
            return acc
          }, {})
          
          // Pending = draft + reviewed
          const pendingReview = (statusCounts.draft || 0) + (statusCounts.reviewed || 0)
          
          setStats({
            totalCalculations,
            pendingReview,
            approved: statusCounts.approved || 0,
            completed: statusCounts.completed || 0,
            draft: statusCounts.draft || 0
          })
        }
      } catch (err: any) {
        console.error("Error fetching calculations stats:", err)
        setError(err.message || "Failed to load statistics")
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
    
    // Écouter les mises à jour
    const handleUpdate = () => {
      setLoading(true)
      setError(null)
      fetchStats()
    }
    
    window.addEventListener('calculation-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('calculation-updated', handleUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">Structural Calculations</h1>
            <p className="text-slate-500">Manage structural analysis and calculations</p>
          </div>
          <NewCalculationDialog />
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="mt-2 text-slate-500">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">Structural Calculations</h1>
            <p className="text-slate-500">Manage structural analysis and calculations</p>
          </div>
          <NewCalculationDialog />
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error Loading Statistics</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
        <Card>
          <CalculationsList />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Structural Calculations</h1>
          <p className="text-slate-500">Manage structural analysis and calculations</p>
        </div>
        <NewCalculationDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalCalculations}</p>
          <p className="text-xs text-slate-400">All calculations</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-sm text-slate-500">Draft</p>
          <p className="text-2xl font-bold text-slate-600">{stats.draft}</p>
          <p className="text-xs text-slate-400">In progress</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
          <p className="text-xs text-yellow-600">Need review</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          <p className="text-xs text-blue-600">Ready</p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-xs text-green-600">Finalized</p>
        </Card>
      </div>

      <Card>
        <CalculationsList />
      </Card>
    </div>
  )
}