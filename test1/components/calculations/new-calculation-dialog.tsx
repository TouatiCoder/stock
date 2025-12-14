// @/components/calculations/new-calculation-dialog.tsx - CORRIGÉ
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

const calculationTypes = [
  "Load Calculation",
  "Beam Analysis",
  "Column Design",
  "Foundation Design",
  "Roof Load",
  "Floor Load",
  "Wall Stress",
  "Custom",
]

interface Project {
  id: string
  name: string
}

export function NewCalculationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    type: calculationTypes[0],
    description: "",
    projectId: "no-project", // "no-project" par défaut au lieu de ""
  })

  // Récupérer les projets quand le dialog s'ouvre
  useEffect(() => {
    const fetchProjects = async () => {
      if (!open) return
      
      setProjectsLoading(true)
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("projects")
          .select("id, name")
          .order("name")
        
        if (error) throw error
        if (data) setProjects(data)
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setProjectsLoading(false)
      }
    }
    
    fetchProjects()
  }, [open])

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert("Please fill in the title")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      // 1. Session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert("You must be logged in")
        setLoading(false)
        return
      }

      // 2. Préparer les données
      const calculationData: any = {
        title: formData.title.trim(),
        calculation_type: formData.type,
        description: formData.description.trim(),
        created_by: session.user.id,
        parameters: {},
        status: "draft",
        created_at: new Date().toISOString(),
      }

      // 3. Gérer project_id (optionnel)
      // "no-project" signifie pas de projet associé
      if (formData.projectId && formData.projectId !== "no-project") {
        calculationData.project_id = formData.projectId.trim()
      }
      // Si project_id est "no-project", ne pas inclure le champ

      console.log("🔍 Insert data:", calculationData)

      // 4. Insérer
      const { error } = await supabase
        .from("calculations")
        .insert([calculationData])

      if (error) {
        console.error("❌ Insert error:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("✅ Calculation created!")
      
      // 5. Succès
      window.dispatchEvent(new Event('calculation-updated'))
      setOpen(false)
      setFormData({
        title: "",
        type: calculationTypes[0],
        description: "",
        projectId: "no-project", // Réinitialiser à "no-project"
      })
      alert("✅ Calculation created successfully!")
      
    } catch (error: any) {
      console.error("❌ Error:", error)
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
          New Calculation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Calculation</DialogTitle>
          <DialogDescription>Start a new structural calculation</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g., Main Beam Load Analysis"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Calculation Type</label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calculationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project (Optional)</label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              disabled={projectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  projectsLoading ? "Loading projects..." : "Select a project (optional)"
                } />
              </SelectTrigger>
              <SelectContent>
                {/* CORRECTION : Utiliser "no-project" au lieu de "" */}
                <SelectItem value="no-project">No project (General)</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectsLoading && (
              <p className="text-xs text-slate-500">Loading projects...</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Add any notes or details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading || !formData.title.trim()}>
              {loading ? "Creating..." : "Create Calculation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}