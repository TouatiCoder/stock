"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner" // ✅ إضافة التنبيهات

export default function SignupForm() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    companyName: "",
    siret: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdminExists, setIsAdminExists] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  // 🔒 Vérifier admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)

      if (data && data.length > 0) setIsAdminExists(true)
      setCheckingAdmin(false)
    }

    checkAdmin()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    setError("")

    if (!formData.companyName.trim()) {
      setError("Veuillez entrer le nom de votre entreprise")
      return false
    }

    if (formData.email.trim() === "") {
        setError("L'email est requis")
        return false
    }

    if (formData.password.length < 8) {
      setError("Mot de passe trop court (min 8 caractères)")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // 1️⃣ Création de l'entreprise d'abord
      // On a besoin de l'ID de l'entreprise pour créer l'utilisateur
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: formData.companyName,
          siret: formData.siret || null,
          is_active: true, // Important pour qu'elle soit active
          country: 'Maroc', // Valeurs par défaut
          currency: 'MAD'
        })
        .select()
        .single()

      if (companyError) throw new Error(`Erreur entreprise: ${companyError.message}`)

      // 2️⃣ Inscription Auth (Le Trigger SQL s'occupe de créer le profil public)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // ⚠️ IMPORTANT: On passe les infos ici pour que le Trigger les utilise
          data: {
            company_id: company.id,
            company_name: formData.companyName,
            role: 'admin',
            first_name: 'Admin',
            last_name: ''
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Erreur inconnue lors de l'inscription")

      // ✅ Succès : Notification et Redirection
      toast.success("Compte créé avec succès ! Veuillez vérifier votre email.")
      
      // On attend 2 secondes pour que l'utilisateur lise le message
      setTimeout(() => {
        router.push("/login")
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Erreur lors de l’inscription")
      // En cas d'erreur, on peut vouloir supprimer l'entreprise créée si elle existe (cleanup optionnel)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAdmin) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>

  if (isAdminExists) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-center">
        <p className="text-yellow-800 font-medium">Un administrateur existe déjà.</p>
        <p className="text-sm text-yellow-600 mt-2">Cette application est configurée pour une seule entreprise/admin.</p>
        <Button onClick={() => router.push("/login")} className="mt-4 w-full">
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {step === 1 ? (
        <>
          <div className="space-y-2">
            <Input 
                name="companyName" 
                placeholder="Nom de l'entreprise" 
                value={formData.companyName} 
                onChange={handleChange} 
                required
            />
          </div>
          <div className="space-y-2">
             <Input 
                name="siret" 
                placeholder="SIRET / RC (Optionnel)" 
                value={formData.siret} 
                onChange={handleChange} 
             />
          </div>
          <div className="space-y-2">
            <Input 
                name="email" 
                type="email" 
                placeholder="Email professionnel" 
                value={formData.email} 
                onChange={handleChange} 
                required
            />
          </div>
          <div className="space-y-2">
            <PasswordInput 
                name="password" 
                placeholder="Mot de passe" 
                value={formData.password} 
                onChange={handleChange} 
            />
          </div>
          <div className="space-y-2">
            <PasswordInput 
                name="confirmPassword" 
                placeholder="Confirmer le mot de passe" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
            />
          </div>

          <Button type="button" onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700">
            S'inscrire
          </Button>
        </>
      ) : (
        <div className="space-y-4 text-center">
             <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900">Confirmation</p>
                <p className="text-sm text-blue-700 mt-1">Vous allez créer un compte administrateur pour <strong>{formData.companyName}</strong>.</p>
             </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? "Création en cours..." : "Confirmer et créer mon compte"}
          </Button>
          
          <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-full" disabled={isLoading}>
            Retour
          </Button>
        </div>
      )}
    </form>
  )
}