// components/users/invite-user-dialog.tsx - VERSION CORRIGÉE
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("chef_de_chantier")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleInvite = async () => {
    // Validation
    if (!email.trim()) {
      setError("Email requis")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Veuillez entrer une adresse email valide")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setInvitationLink(null)
    setCopied(false)
    
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          role 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si c'est une erreur 207 (email échoué mais invitation créée)
        if (response.status === 207) {
          handlePartialSuccess(data)
          return
        }
        throw new Error(data.error || `Échec de l'invitation (${response.status})`)
      }

      // Succès complet
      handleSuccess(data, email)
      
    } catch (err: any) {
      console.error("Invite error:", err)
      setError(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handlePartialSuccess = (data: any) => {
    // Email échoué mais invitation créée
    setSuccess(`Invitation créée mais l'email n'a pas pu être envoyé`)
    
    // Afficher le lien pour le copier manuellement
    if (data.data?.invitationLink) {
      setInvitationLink(data.data.invitationLink)
    } else {
      // Générer un lien si non fourni
      const baseUrl = window.location.origin
      const token = data.data?.token || "token-manquant"
      setInvitationLink(`${baseUrl}/auth/signup?token=${token}`)
    }
    
    setEmail("")
  }

  const handleSuccess = (data: any, originalEmail: string) => {
    // Succès complet
    setSuccess(`Invitation envoyée à ${originalEmail}`)
    setEmail("")
    
    // Si on a un lien en dev, l'afficher
    if (process.env.NODE_ENV === 'development' && data.data?.invitationLink) {
      setInvitationLink(data.data.invitationLink)
    }
    
    // Rafraîchir la liste après 3 secondes
    setTimeout(() => {
      window.dispatchEvent(new Event('user-updated'))
      setOpen(false)
      setSuccess(null)
      setInvitationLink(null)
    }, 3000)
  }

  const copyToClipboard = async () => {
    if (!invitationLink) return
    
    try {
      await navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const resetDialog = () => {
    setError(null)
    setSuccess(null)
    setInvitationLink(null)
    setCopied(false)
    setEmail("")
    setRole("chef_de_chantier")
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} />
          Inviter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre d'équipe</DialogTitle>
          <DialogDescription>
            Envoyer une invitation à rejoindre BuildStock Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Messages d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Messages de succès */}
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Lien d'invitation à copier */}
          {invitationLink && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Lien d'invitation à partager :
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-100 p-2 rounded truncate">
                  {invitationLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Ce lien expire dans 7 jours
              </p>
            </div>
          )}

          {/* Formulaire (seulement si pas de succès avec lien) */}
          {!success && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="utilisateur@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rôle</label>
                <Select 
                  value={role} 
                  onValueChange={setRole}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Pas d'admin via invitation pour la sécurité */}
                    <SelectItem value="chef_de_chantier">Chef de Chantier</SelectItem>
                    <SelectItem value="ingenieur_structure">Ingénieur Structure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            {!success ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleInvite} 
                  disabled={loading || !email.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : "Envoyer l'invitation"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setOpen(false)}
                className="w-full"
              >
                {invitationLink ? "Fermer et copier le lien" : "Fermer"}
              </Button>
            )}
          </div>

          {/* Informations */}
          {!success && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                L'utilisateur recevra un email avec un lien d'activation valable 7 jours.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}