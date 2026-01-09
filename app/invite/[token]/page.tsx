"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, Building, Mail, User, Lock, ArrowRight, CheckCircle } from "lucide-react"
import { invitationService } from "@/lib/services/invitationService"
import { toast } from "sonner"

export default function InviteTokenPage() {
  const router = useRouter()
  const params = useParams()
  // فك تشفير التوكن في حالة وجود رموز خاصة، رغم أن UUID عادة آمن
  const token = decodeURIComponent(params.token as string)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: ""
  })

  // 1. التحقق من التوكن
  useEffect(() => {
    let mounted = true;

    const validate = async () => {
      try {
        if (!token) return
        const data = await invitationService.validateInvitation(token)
        if(mounted) setInvitationData(data)
      } catch (err: any) {
        console.error("Page Validation Error:", err)
        if(mounted) setError(err.message || "Rien trouvé")
      } finally {
        if(mounted) setLoading(false)
      }
    }
    validate()

    return () => { mounted = false }
  }, [token])

  // 2. معالجة التسجيل
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }
    if (formData.password.length < 8) {
      toast.error("Mot de passe trop court (min 8)")
      return
    }

    setSubmitting(true)
    try {
      await invitationService.acceptInvitation(
        token,
        formData.password,
        formData.firstName,
        formData.lastName
      )
      toast.success("Compte créé avec succès !")
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création")
      setSubmitting(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>

  if (error) return (
    <div className="h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full border-red-200 bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Lien Invalide</h2>
        <p className="text-red-700 mb-6">{error}</p>
        <Button onClick={() => router.push('/login')} variant="outline" className="w-full">Retour</Button>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full inline-block mb-3">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">{invitationData?.company?.name}</h1>
          <p className="text-gray-500">Créer votre compte employé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input value={invitationData?.email} disabled className="pl-9 bg-gray-100" />
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Prénom</Label>
                <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Nom</Label>
                <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
             <Label>Mot de passe</Label>
             <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input type="password" required className="pl-9" minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Confirmer mot de passe</Label>
             <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input type="password" required className="pl-9" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
             </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <>Créer mon compte <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </Card>
    </div>
  )
}