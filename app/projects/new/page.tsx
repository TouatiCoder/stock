// app/projects/new/page.tsx (version corrigée)
"use client"

import { useState, useEffect } from "react" // Ajoutez useEffect
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, X, Info, AlertCircle } from "lucide-react"
import { projectService, type Project } from "@/lib/services/projectService"
import { toast } from "sonner"
import Link from "next/link"
import { supabase } from "@/lib/supabase" 

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null) // Pour afficher les erreurs détaillées
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_name: "",
    client_email: "", // Ajoutez ce champ
    client_phone: "", // Ajoutez ce champ
    address: "",
    city: "",
    postal_code: "",
    project_type: "R+2" as Project['project_type'],
    total_budget: "",
    start_date: "",
    planned_end_date: "",
    status: "planning" as Project['status']
  })

  // Log pour débogage
  useEffect(() => {
    console.log('Page NewProject chargée')
    checkAuth()
  }, [])
    const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Session actuelle:', session)
      
      if (!session) {
        console.log('⚠️ Non authentifié, redirection...')
        router.push('/login')
        return
      }
      
      setIsAuthenticated(true)
      
      // Vérifiez aussi le profil utilisateur
      const { data: profile } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()
      
      console.log('👤 Profil utilisateur:', profile)
      
    } catch (error) {
      console.error('❌ Erreur vérification auth:', error)
    }
  }
  
  // Si non authentifié, affichez un message
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Effacer l'erreur quand l'utilisateur modifie
    if (submitError) setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom du projet est obligatoire")
      return
    }

    try {
      setLoading(true)
      setSubmitError(null)
      console.log("Tentative de création du projet...")
      
      // Préparer les données
      const projectData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        client_name: formData.client_name.trim() || null,
        client_email: formData.client_email.trim() || null, // Ajout
        client_phone: formData.client_phone.trim() || null, // Ajout
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        project_type: formData.project_type,
        status: formData.status,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        start_date: formData.start_date || null,
        planned_end_date: formData.planned_end_date || null,
        // current_cost et progress_percentage seront définis par le service
      }

      console.log("Données envoyées au service:", projectData)
      
      const createdProject = await projectService.createProject(projectData)
      console.log("Projet créé avec succès:", createdProject)
      
      toast.success("Projet créé avec succès ! Redirection...")
      
      // Petite pause pour que l'utilisateur voie le message
      setTimeout(() => {
        router.push(`/projects`)
      }, 1500)
      
    } catch (error: any) {
      console.error("ERREUR DÉTAILLÉE dans handleSubmit:", {
        message: error.message,
        details: error.details,
        code: error.code,
        stack: error.stack
      })
      
      // Afficher une erreur plus détaillée
      let errorMessage = error.message || "Erreur lors de la création"
      
      // Messages plus clairs selon le code d'erreur
      if (error.code === '23503') {
        errorMessage = "Erreur de référence. Vérifiez que tous les champs obligatoires sont remplis."
      } else if (error.code === '23505') {
        errorMessage = "Un projet avec ce nom existe déjà."
      } else if (error.code === '42501') {
        errorMessage = "Vous n'avez pas les permissions nécessaires."
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Erreur de connexion. Vérifiez votre internet."
      }
      
      setSubmitError(`${errorMessage} (Code: ${error.code || 'N/A'})`)
      toast.error(errorMessage)
      
    } finally {
      // Toujours réinitialiser le loading
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (formData.name || formData.client_name) {
      if (confirm("Voulez-vous annuler ? Les modifications seront perdues.")) {
        router.push("/projects")
      }
    } else {
      router.push("/projects")
    }
  }

  // Date minimale pour aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/projects">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Nouveau Projet</h1>
                      <p className="text-gray-600">Créez un nouveau projet ou chantier</p>
                    </div>
                  </div>
                </div>

                {/* Afficher l'erreur détaillée si présente */}
                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-red-900 mb-1">
                          Erreur de création
                        </h3>
                        <p className="text-sm text-red-700">{submitError}</p>
                        <p className="text-xs text-red-600 mt-2">
                          Vérifiez votre connexion et que vous êtes bien connecté.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulaire */}
                <Card>
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-8">
                      {/* Informations de base */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          Informations de base
                        </h2>
                        
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-1">
                            Nom du projet <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Construction Résidence Les Oliviers"
                            required
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="client_name">Nom du client</Label>
                          <Input
                            id="client_name"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleChange}
                            placeholder="Ex: M. Dupont"
                            disabled={loading}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="client_email">Email du client</Label>
                            <Input
                              id="client_email"
                              name="client_email"
                              type="email"
                              value={formData.client_email}
                              onChange={handleChange}
                              placeholder="client@example.com"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="client_phone">Téléphone client</Label>
                            <Input
                              id="client_phone"
                              name="client_phone"
                              value={formData.client_phone}
                              onChange={handleChange}
                              placeholder="+212 6 XX XX XX XX"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="project_type">Type de projet</Label>
                            <select
                              id="project_type"
                              name="project_type"
                              value={formData.project_type}
                              onChange={handleChange}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="R+2">R+2 (Résidentiel)</option>
                              <option value="Villa">Villa</option>
                              <option value="Immeuble">Immeuble</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Industrial">Industriel</option>
                              <option value="Other">Autre</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status">Statut initial</Label>
                            <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="planning">Planification</option>
                              <option value="active">En cours</option>
                              <option value="paused">En pause</option>
                              <option value="completed">Terminé</option>
                              <option value="cancelled">Annulé</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Localisation */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          Localisation
                        </h2>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address">Adresse</Label>
                          <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Ex: 123 Avenue Hassan II"
                            disabled={loading}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              placeholder="Ex: Casablanca"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="postal_code">Code postal</Label>
                            <Input
                              id="postal_code"
                              name="postal_code"
                              value={formData.postal_code}
                              onChange={handleChange}
                              placeholder="Ex: 20000"
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          Budget
                        </h2>
                        
                        <div className="space-y-2">
                          <Label htmlFor="total_budget">Budget total (MAD)</Label>
                          <Input
                            id="total_budget"
                            name="total_budget"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.total_budget}
                            onChange={handleChange}
                            placeholder="Ex: 1500000.00"
                            disabled={loading}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Laissez vide si le budget n'est pas encore défini
                          </p>
                        </div>
                      </div>

                      {/* Calendrier */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          Calendrier
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_date">Date de début</Label>
                            <Input
                              id="start_date"
                              name="start_date"
                              type="date"
                              value={formData.start_date}
                              onChange={handleChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="planned_end_date">Date de fin prévue</Label>
                            <Input
                              id="planned_end_date"
                              name="planned_end_date"
                              type="date"
                              value={formData.planned_end_date}
                              onChange={handleChange}
                              min={formData.start_date || today}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                          Description
                        </h2>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description du projet</Label>
                          <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Décrivez les objectifs, caractéristiques, exigences particulières, etc."
                            rows={4}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Création en cours...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Créer le projet
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}