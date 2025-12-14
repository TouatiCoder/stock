// @/components/costs/add-expense-dialog.tsx - VERSION COMPLÈTE
"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
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
import { Plus } from "lucide-react"

const expenseCategories = [
  "Matériel et équipement",
  "Main d'œuvre",
  "Matériaux",
  "Transport",
  "Location équipement",
  "Permis et autorisations",
  "Services",
  "Autre",
]

interface Project {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
}

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingData, setLoadingData] = useState(false)
  
  const [formData, setFormData] = useState({
    description: "",
    category: expenseCategories[0],
    amount_mad: "",
    date: new Date().toISOString().split("T")[0],
    projectId: "no-project", // "no-project" par défaut
    supplierId: "no-supplier", // "no-supplier" par défaut
  })

  // Charger projets et fournisseurs quand le dialog s'ouvre
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return
      
      setLoadingData(true)
      try {
        const supabase = getSupabaseClient()
        
        // Récupérer les projets
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, name")
          .order("name")
        
        if (projectsError) throw projectsError
        if (projectsData) setProjects(projectsData)
        
        // Récupérer les fournisseurs
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id, name")
          .order("name")
        
        if (suppliersError) throw suppliersError
        if (suppliersData) setSuppliers(suppliersData)
        
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchData()
  }, [open])

  const handleSubmit = async () => {
    // Validation
    if (!formData.description.trim()) {
      alert("Please enter a description")
      return
    }
    
    if (!formData.amount_mad || Number.parseFloat(formData.amount_mad) <= 0) {
      alert("Please enter a valid amount")
      return
    }
    
    if (!formData.date) {
      alert("Please select a date")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      // 1. Vérifier l'authentification
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error("Auth error:", userError)
        throw new Error("Authentication failed. Please try logging in again.")
      }
      
      if (!user) {
        throw new Error("You must be logged in to add expenses.")
      }

      // 2. Préparer les données
      const expenseData: any = {
        description: formData.description.trim(),
        category: formData.category,
        amount_mad: Number.parseFloat(formData.amount_mad),
        date: formData.date,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }

      // 3. Gérer project_id (optionnel)
      if (formData.projectId && formData.projectId !== "no-project") {
        expenseData.project_id = formData.projectId
      }

      // 4. Gérer supplier_id (optionnel)
      if (formData.supplierId && formData.supplierId !== "no-supplier") {
        expenseData.supplier_id = formData.supplierId
      }

      console.log("🔍 Expense data to insert:", expenseData)

      // 5. Insérer dans la base de données
      const { error } = await supabase
        .from("expenses")
        .insert([expenseData])

      if (error) {
        console.error("❌ Database error:", error)
        
        // Vérifier si c'est une erreur de table inexistante
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          throw new Error("The 'expenses' table doesn't exist. Please create it in Supabase first.")
        }
        
        // Vérifier si c'est une erreur NOT NULL
        if (error.message.includes("null value") && error.message.includes("not-null constraint")) {
          throw new Error(`Database constraint error: ${error.message}`)
        }
        
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("✅ Expense added successfully!")
      
      // 6. Succès - rafraîchir les données
      window.dispatchEvent(new Event('expense-updated'))
      
      // 7. Reset et fermeture
      setFormData({
        description: "",
        category: expenseCategories[0],
        amount_mad: "",
        date: new Date().toISOString().split("T")[0],
        projectId: "no-project",
        supplierId: "no-supplier",
      })
      setOpen(false)
      
      // 8. Notification
      alert("✅ Expense added successfully!")
      
    } catch (error: any) {
      console.error("❌ Error adding expense:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a new expense for your project. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Concrete delivery for foundation"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Amount (MAD) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.amount_mad}
              onChange={(e) => setFormData({ ...formData, amount_mad: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Project (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project (Optional)</label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              disabled={loading || loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingData ? "Loading projects..." : "Select a project"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No project (General)</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier (Optional)</label>
            <Select 
              value={formData.supplierId} 
              onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              disabled={loading || loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingData ? "Loading suppliers..." : "Select a supplier"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-supplier">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boutons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={
                loading || 
                loadingData || 
                !formData.description.trim() || 
                !formData.amount_mad || 
                Number.parseFloat(formData.amount_mad) <= 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Adding Expense..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}