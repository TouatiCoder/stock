"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

// Props : userId actuel
interface RecentActivityProps {
  userId: string
}

// Type pour les données récupérées depuis Supabase
interface ActivityFromDB {
  id: string
  user_id: string
  action: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: any
  created_at: string
}

// Type pour le composant
interface Activity {
  id: string
  action: string
  description: string
  createdAt: string
  entityType?: string | null
  entityId?: string | null
  metadata?: any
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchActivities() {
      try {
        setError(null)

        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error

        if (data) {
          setActivities(
            data.map((a: ActivityFromDB) => ({
              id: a.id,
              action: a.action,
              description: a.description || "",
              createdAt: new Date(a.created_at).toLocaleString("fr-MA", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
              entityType: a.entity_type,
              entityId: a.entity_id,
              metadata: a.metadata,
            }))
          )
        } else {
          setActivities([])
        }
      } catch (err: any) {
        console.error("Error fetching activities:", err)
        setError(err.message || "Failed to load activities")
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800 mb-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">Error</p>
        </div>
        <p className="text-sm text-yellow-700">{error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return <p className="text-slate-500 text-center py-4">No recent activity.</p>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="pb-4 border-b border-slate-200 last:border-b-0">
          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
          <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
          <p className="text-xs text-slate-400 mt-2">{activity.createdAt}</p>
        </div>
      ))}
    </div>
  )
}
