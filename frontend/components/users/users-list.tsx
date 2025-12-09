"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("users").select("*")
        if (data) setUsers(data as User[])
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
    const handleUpdate = () => {
    fetchUsers()
  }
  
  window.addEventListener('user-updated', handleUpdate)
  
  return () => {
    window.removeEventListener('user-updated', handleUpdate)
  }
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading users...</div>
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    chef_de_chantier: "bg-blue-100 text-blue-800",
    ingenieur_structure: "bg-green-100 text-green-800",
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="px-6 py-4 text-sm text-slate-900">{user.full_name}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
              <td className="px-6 py-4 text-sm">
                <Badge className={roleColors[user.role] || "bg-slate-100 text-slate-800"}>
                  {user.role.replace("_", " ")}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">{user.phone || "-"}</td>
              <td className="px-6 py-4 text-sm space-x-2">
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
