"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Trash2, Mail, User, Clock } from "lucide-react"
import { invitationService } from "@/lib/services/invitationService"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'admin' | 'site_manager' | 'structural_engineer'
  is_active: boolean
  created_at: string
}

interface Invitation {
  id: string
  email: string
  token: string
  role: 'site_manager' | 'structural_engineer'
  expires_at: string
  accepted_at?: string
  created_at: string
  inviter?: {
    first_name: string
    last_name: string
  }
}

export function AdminSettings() {
  const { user } = useAuth()
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [companyName, setCompanyName] = useState("Votre entreprise") // AJOUTÉ

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "site_manager" as 'site_manager' | 'structural_engineer',
  })

  useEffect(() => {
    if (user?.company_id) {
      fetchCompanyName()
      fetchEmployees()
      fetchInvitations()
    }
  }, [user?.company_id])

  // AJOUTÉ: Récupérer le nom de l'entreprise
  const fetchCompanyName = async () => {
    try {
      if (!user?.company_id) return
      
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', user.company_id)
        .single()

      if (error) throw error
      if (data?.name) setCompanyName(data.name)
    } catch (error) {
      console.error('Error fetching company name:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, is_active, created_at')
        .eq('company_id', user?.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Erreur lors du chargement des employés')
    }
  }

  const fetchInvitations = async () => {
    try {
      if (!user?.company_id) return
      
      const data = await invitationService.getCompanyInvitations(user.company_id)
      setInvitations(data)
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInviteForm((prev) => ({ ...prev, [name]: value }))
  }

// Dans AdminSettings.tsx - améliorez handleSendInvite
const handleSendInvite = async () => {
  if (!user?.id || !user?.company_id) {
    toast.error('Erreur d\'authentification')
    return
  }

  if (!inviteForm.email.trim()) {
    toast.error('Veuillez saisir un email')
    return
  }

  // Validation email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(inviteForm.email)) {
    toast.error('Format d\'email invalide')
    return
  }

  try {
    setLoading(true)

    // Créer l'invitation
    const invitation = await invitationService.createInvitation(
      inviteForm.email,
      inviteForm.role,
      user.company_id,
      user.id
    )

    toast.loading(`Envoi de l'invitation à ${inviteForm.email}...`)
    
    // Envoyer l'email
    const result = await invitationService.sendInvitationEmail(
      invitation,
      companyName,
      `${user.first_name} ${user.last_name}`
    )

    // Afficher le succès
    toast.dismiss()
    toast.success(`✅ Invitation envoyée !`, {
      description: `Un email a été envoyé à ${inviteForm.email}`,
      duration: 5000
    })

    // En développement, afficher aussi le lien
    if (process.env.NODE_ENV === 'development' && result.invitationLink) {
      console.log('🔗 Lien d\'invitation (dev):', result.invitationLink)
      toast.info(`Lien d'invitation (mode dev): ${result.invitationLink}`, {
        duration: 10000
      })
    }
    
    // Réinitialiser le formulaire
    setInviteForm({ email: "", role: "site_manager" })
    setShowInviteForm(false)
    
    // Rafraîchir la liste des invitations
    fetchInvitations()

  } catch (error: any) {
    console.error('❌ Error sending invitation:', error)
    toast.dismiss()
    
    // Messages d'erreur spécifiques
    if (error.message.includes('existe déjà')) {
      toast.error('Email déjà existant', {
        description: 'Un utilisateur avec cet email existe déjà dans cette entreprise.'
      })
    } else if (error.message.includes('RESEND_API_KEY')) {
      toast.error('Configuration manquante', {
        description: 'La clé API Resend n\'est pas configurée. Vérifiez vos variables d\'environnement.'
      })
    } else {
      toast.error('Erreur d\'envoi', {
        description: error.message || 'Impossible d\'envoyer l\'invitation. Veuillez réessayer.'
      })
    }
  } finally {
    setLoading(false)
  }
}

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Annuler l'invitation pour ${email} ?`)) return

    try {
      await invitationService.cancelInvitation(invitationId)
      toast.success('Invitation annulée')
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Erreur lors de l\'annulation')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays <= 0) return 'Expiré'
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur'
      case 'site_manager': return 'Chef de Chantier'
      case 'structural_engineer': return 'Ingénieur Structure'
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Invitation */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inviter un Employé</h2>

          {!showInviteForm ? (
            <Button 
              onClick={() => setShowInviteForm(true)} 
              className="flex items-center gap-2"
            >
              <Mail size={18} />
              Inviter un nouvel employé
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email de l'employé *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInviteChange}
                  placeholder="employe@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Rôle *
                </label>
                <select
                  name="role"
                  value={inviteForm.role}
                  onChange={handleInviteChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                  required
                >
                  <option value="site_manager">Chef de Chantier</option>
                  <option value="structural_engineer">Ingénieur Structure</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendInvite} 
                  disabled={loading || !inviteForm.email}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Envoyer l'invitation
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Invitations en attente */}
      {invitations.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Invitations en attente</h2>
            </div>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invitation.accepted_at 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {invitation.accepted_at ? 'Acceptée' : 'En attente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Rôle: {getRoleDisplay(invitation.role)}</span>
                      <span>•</span>
                      <span>Envoyée le: {formatDate(invitation.created_at)}</span>
                      <span>•</span>
                      {!invitation.accepted_at && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Expire dans: {getTimeRemaining(invitation.expires_at)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      {invitation.inviter && (
                        <span>
                          Par: {invitation.inviter.first_name} {invitation.inviter.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {!invitation.accepted_at && (
                    <button 
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      className="p-2 hover:bg-orange-100 rounded-lg transition-colors ml-4"
                      title="Annuler l'invitation"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Liste des employés */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Employés ({employees.length})</h2>
          </div>
          <div className="space-y-3">
            {employees.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun employé trouvé</p>
            ) : (
              employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-900">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        emp.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {emp.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{emp.email}</span>
                      <span>•</span>
                      <span>Rôle: {getRoleDisplay(emp.role)}</span>
                      <span>•</span>
                      <span>Depuis: {formatDate(emp.created_at)}</span>
                    </div>
                  </div>
                  {emp.id !== user?.id && (
                    <button 
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-4"
                      title="Supprimer l'employé"
                      onClick={() => {
                        if (confirm(`Supprimer ${emp.first_name} ${emp.last_name} ?`)) {
                          // Logique de suppression à implémenter
                          toast.info('Fonctionnalité de suppression à implémenter')
                        }
                      }}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}