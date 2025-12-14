"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"
import type { Project } from "@/lib/types"

interface NewProjectDialogProps {
  onProjectCreated?: (project: Project) => void
}

export function NewProjectDialog({ onProjectCreated }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    budget_mad: "",
    start_date: "",
    end_date: "",
    description: "",
  })

  const handleCreate = async () => {
    if (!formData.name) {
      alert("Please enter a project name")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: insertedData, error } = await supabase
        .from("projects")
        .insert([
          {
            name: formData.name,
            location: formData.location,
            budget_mad: Number.parseFloat(formData.budget_mad) || 0,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            description: formData.description,
            created_by: user.id,
            assigned_to: [user.id],
            status: "active",
          },
        ])
        .select()
        .single() // récupère le projet inséré
        const project: Project | null = insertedData ?? null;

if (project && onProjectCreated) {
  onProjectCreated(project)
}

      if (error) throw error

      // Mettre à jour la liste côté client
      if (insertedData && onProjectCreated) {
        onProjectCreated(insertedData)
      }

      setFormData({
        name: "",
        location: "",
        budget_mad: "",
        start_date: "",
        end_date: "",
        description: "",
      })
      setOpen(false)
      alert("Project created successfully!")
    } catch (err) {
      console.error("Error creating project:", err)
      alert("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Start a new construction project</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Project Name *</label>
            <Input
              placeholder="e.g., Al Ferdous Tower"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g., Casablanca"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Budget (MAD)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.budget_mad}
              onChange={(e) => setFormData({ ...formData, budget_mad: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Project details and notes"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
