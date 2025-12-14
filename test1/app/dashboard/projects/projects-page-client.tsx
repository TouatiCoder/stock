"use client"

import { useState } from "react"
import type { Project } from "@/lib/types"
import { ProjectsList } from "@/components/projects/projects-list"
import { NewProjectDialog } from "@/components/projects/new-project-dialog"

interface ProjectsPageClientProps {
  initialProjects: Project[]
}

export function ProjectsPageClient({ initialProjects }: ProjectsPageClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const handleProjectCreated = (project: Project) => {
  setProjects(prev => {
    // Supprime tout éventuel doublon
    const filtered = prev.filter(p => p.id !== project.id)
    return [project, ...filtered]
  })
}

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <NewProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      {/* Liste des projets */}
      <ProjectsList projects={projects} />
    </div>
  )
}
