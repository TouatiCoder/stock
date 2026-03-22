// app/costs/suppliers/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createSupplier } from "@/app/actions/supplier-actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Save, 
  X, 
  Building, 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Percent,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  Star
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewSupplierPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    tax_id: "",
    payment_terms: "30 jours",
    notes: "",
    rating: "0",
    delivery_score: "0",
    quality_score: "0"
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du fournisseur est obligatoire"
    }
    
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = "Le contact est obligatoire"
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }
    
    if (formData.phone && !/^[\d\s\-+()]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Format de téléphone invalide"
    }
    
    const rating = parseFloat(formData.rating)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      newErrors.rating = "Note invalide (0-5)"
    }
    
    const deliveryScore = parseInt(formData.delivery_score)
    if (isNaN(deliveryScore) || deliveryScore < 0 || deliveryScore > 100) {
      newErrors.delivery_score = "Score invalide (0-100)"
    }
    
    const qualityScore = parseInt(formData.quality_score)
    if (isNaN(qualityScore) || qualityScore < 0 || qualityScore > 100) {
      newErrors.quality_score = "Score invalide (0-100)"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.companyId) {
      toast.error("Vous devez être connecté pour ajouter un fournisseur")
      return
    }
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }
    
    try {
      setLoading(true)
      
      console.log("📦 Préparation des données fournisseur...")
      
      const supplierData = {
        name: formData.name.trim(),
        contactPerson: formData.contact_person.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        isActive: true,
        companyId: user.companyId,
        updatedAt: new Date()
      }
      
      console.log("📤 Envoi des données:", supplierData)
      
      const result = await createSupplier(supplierData)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create supplier")
      }

      const data = result.data
      
      console.log("✅ Fournisseur créé:", data)
      
      toast.success("Fournisseur créé avec succès !", {
        description: `"${data.name}" a été ajouté à votre liste.`,
        action: {
          label: "Voir",
          onClick: () => router.push(`/costs/suppliers/${data.id}`)
        }
      })
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push("/costs/suppliers")
      }, 2000)
      
    } catch (error: any) {
      console.error("💥 Erreur création fournisseur:", error)
      toast.error(error.message || "Une erreur est survenue lors de la création")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/costs/suppliers")
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/costs/suppliers">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                    </Link>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Nouveau Fournisseur</h1>
                      <p className="text-gray-600">Ajouter un nouveau fournisseur à votre entreprise</p>
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <Card>
                  <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-8">
                      {/* Section Informations Générales */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Informations Générales
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-1">
                              Nom du fournisseur <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Ex: AcierPro SARL"
                              required
                              disabled={loading}
                              className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="contact_person" className="flex items-center gap-1">
                              Personne de contact <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="contact_person"
                              name="contact_person"
                              value={formData.contact_person}
                              onChange={handleChange}
                              placeholder="Ex: Mohamed Alami"
                              required
                              disabled={loading}
                              className={errors.contact_person ? "border-red-500" : ""}
                            />
                            {errors.contact_person && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.contact_person}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section Contact */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          Coordonnées
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-1">
                              <Mail size={14} className="mr-1" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="contact@fournisseur.ma"
                              disabled={loading}
                              className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.email}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-1">
                              <Phone size={14} className="mr-1" />
                              Téléphone
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="05 22 33 44 55"
                              disabled={loading}
                              className={errors.phone ? "border-red-500" : ""}
                            />
                            {errors.phone && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section Adresse */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Adresse
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="address">Adresse complète</Label>
                            <Input
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="123 Avenue Hassan II"
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
                                placeholder="Casablanca"
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
                                placeholder="20000"
                                disabled={loading}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="tax_id">ICE / IF</Label>
                              <Input
                                id="tax_id"
                                name="tax_id"
                                value={formData.tax_id}
                                onChange={handleChange}
                                placeholder="ICE123456789"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section Conditions */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Conditions Commerciales
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="payment_terms">Conditions de paiement</Label>
                            <Input
                              id="payment_terms"
                              name="payment_terms"
                              value={formData.payment_terms}
                              onChange={handleChange}
                              placeholder="30 jours net"
                              disabled={loading}
                            />
                            <p className="text-xs text-gray-500">Ex: 30 jours, 50% à la commande...</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes et commentaires</Label>
                            <Textarea
                              id="notes"
                              name="notes"
                              value={formData.notes}
                              onChange={handleChange}
                              placeholder="Informations supplémentaires, conditions spéciales..."
                              rows={3}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Résumé */}
                      <Card className="bg-blue-50 border-blue-200">
                        <div className="p-4">
                          <h4 className="font-bold text-blue-900 mb-2">Résumé</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-700">Fournisseur:</div>
                            <div className="font-medium">{formData.name || "—"}</div>
                            
                            <div className="text-gray-700">Contact:</div>
                            <div className="font-medium">{formData.contact_person || "—"}</div>
                            
                            <div className="text-gray-700">Email:</div>
                            <div className="font-medium">{formData.email || "—"}</div>
                            
                            <div className="text-gray-700">Téléphone:</div>
                            <div className="font-medium">{formData.phone || "—"}</div>
                          </div>
                        </div>
                      </Card>

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
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 min-w-32"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Création...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Créer le fournisseur
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
      </div>
    </div>
  )
}
