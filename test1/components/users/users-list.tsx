"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Mail, Phone, User as UserIcon, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { data, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (supabaseError) throw supabaseError
      setUsers(data as User[] || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Impossible de charger les utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    
    const handleUpdate = () => {
      fetchUsers()
    }
    
    window.addEventListener('user-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('user-updated', handleUpdate)
    }
  }, [])

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    setDeleting(true)
    try {
      const supabase = getSupabaseClient()
      
      // Note: Pour supprimer aussi le compte auth, il faudrait utiliser l'API admin
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id)

      if (error) throw error
      
      // Mettre à jour la liste locale
      setUsers(users.filter(u => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      
    } catch (err) {
      console.error("Delete error:", err)
      setError("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-red-100", text: "text-red-800" },
    chef_de_chantier: { bg: "bg-blue-100", text: "text-blue-800" },
    ingenieur_structure: { bg: "bg-green-100", text: "text-green-800" },
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-"
    // Format simple pour affichage
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-slate-600">Chargement des utilisateurs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <Button 
          variant="outline" 
          onClick={fetchUsers}
          className="mt-4"
        >
          Réessayer
        </Button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
          <UserIcon className="h-6 w-6 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Aucun utilisateur</h3>
        <p className="text-slate-600 mt-1">Commencez par inviter des membres d'équipe</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-medium text-blue-600">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">
                        {user.full_name || "Sans nom"}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    className={`${roleColors[user.role]?.bg || "bg-slate-100"} ${
                      roleColors[user.role]?.text || "text-slate-800"
                    } capitalize`}
                  >
                    {user.role.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatPhone(user.phone)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteClick(user)}
                      title="Supprimer"
                      disabled={user.role === 'admin'} // Empêcher suppression admin
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {userToDelete?.full_name || userToDelete?.email} ?
              Cette action est irréversible. L'utilisateur perdra l'accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}