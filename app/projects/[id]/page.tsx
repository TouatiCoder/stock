﻿import { checkAuth } from "@/lib/auth/auth-utils"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ProjectDetails } from "@/components/projects/project-details"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { t } from "@/lib/server-i18n"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = await checkAuth()
  if (!user) redirect("/login")

  const { id: projectId } = params
  const project = await db.project.findFirst({
    where: { id: projectId, companyId: user.companyId },
    include: {
      siteManager: true,
      structuralEngineer: true,
      company: true,
    },
  })

  const backText = await t("common", "back")
  const notFoundText = await t("project", "notFound")
  const backToProjectsText = await t("project", "backToProjects")

  if (!project) {
    return (
      <div className="space-y-6 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backText}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{notFoundText}</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const projectData = {
    ...project,
    totalBudget: project.totalBudget ? Number(project.totalBudget) : null,
    currentCost: project.currentCost ? Number(project.currentCost) : null,
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backToProjectsText}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{projectData.name}</h1>
            </div>
          </div>
        </div>

        <ProjectDetails projectId={projectId} project={projectData} />
      </div>
    </div>
  )
}
