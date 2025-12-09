import { Card } from "@/components/ui/card";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectsList } from "@/components/projects/projects-list";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils/auth";
import { redirect } from "next/navigation";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  // ⚡ Sécurisation
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // Récupération des projets
  const { data } = await supabase.from("projects").select("*");
  const projects: Project[] = (data ?? []) as Project[]; // <-- correction ici

  // Calcul de stats dynamiques
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget_mad || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage all your construction projects</p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Active Projects</p>
          <p className="text-3xl font-bold text-slate-900">{activeProjects}</p>
          <p className="text-xs text-blue-600">In progress</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-3xl font-bold text-green-600">{completedProjects}</p>
          <p className="text-xs text-green-600">This year</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Total Budget</p>
          <p className="text-3xl font-bold text-slate-900">{totalBudget.toLocaleString()} MAD</p>
          <p className="text-xs text-slate-400">All projects</p>
        </Card>
      </div>

      <Card>
        <ProjectsList projects={projects} />
      </Card>
    </div>
  );
}
