import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Project } from "@/lib/types"
import { ProjectsPageClient } from "./projects-page-client"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || !profile) redirect("/auth/login")

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("*")

  if (projectsError) throw new Error(projectsError.message)

  let projects: Project[] = projectsData ?? []

  if (profile.role !== "admin") {
    projects = projects.filter(
      p => p.created_by === profile.id || (p.assigned_to || []).includes(profile.id)
    )
  }

  return <ProjectsPageClient initialProjects={projects} />
}
