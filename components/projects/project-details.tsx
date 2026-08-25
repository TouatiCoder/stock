"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useCommonTranslations,
  useLocale,
  useProjectTranslations,
} from "@/components/LocaleProvider"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  Edit,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ProjectDetailsProps {
  projectId: string
  project?: any
  phases?: any[]
  team?: any[]
}

export function ProjectDetails({
  projectId,
  project: initialProject,
  phases: initialPhases,
  team: initialTeam,
}: ProjectDetailsProps) {
  const router = useRouter()

  const tProject = useProjectTranslations()
  const tCommon = useCommonTranslations()
  const { locale } = useLocale()

  const [project, setProject] = useState<any>(
    initialProject
  )

  const [phases, setPhases] = useState<any[]>(
    initialPhases || []
  )

  const [team, setTeam] = useState<any[]>(
    initialTeam || []
  )

  const [anomalies, setAnomalies] = useState<any[]>([])

  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] =
    useState("overview")

  // ============================================================
  // SYNC PROPS
  // ============================================================

  useEffect(() => {
    setProject(initialProject)
    setPhases(initialPhases || [])
    setTeam(initialTeam || [])
  }, [
    projectId,
    initialProject,
    initialPhases,
    initialTeam,
  ])

  // ============================================================
  // BUILD TEAM FROM PROJECT
  // ============================================================

  useEffect(() => {
    if (
      initialProject?.siteManager ||
      initialProject?.structuralEngineer
    ) {
      const teamMembers: any[] = []

      if (initialProject.siteManager) {
        teamMembers.push(
          initialProject.siteManager
        )
      }

      if (initialProject.structuralEngineer) {
        teamMembers.push(
          initialProject.structuralEngineer
        )
      }

      setTeam(teamMembers)
    }
  }, [initialProject])

  // ============================================================
  // STATUS
  // ============================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "in_progress":
        return "bg-green-100 text-green-800 border-green-200"

      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-200"

      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"

      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"

      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"

      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
      case "in_progress":
        return tProject("active")

      case "planning":
        return tProject("planning")

      case "paused":
        return tProject("paused")

      case "completed":
        return tProject("completed")

      case "cancelled":
        return tProject("cancelled")

      default:
        return status
    }
  }

  // ============================================================
  // PROJECT TYPE
  // ============================================================

  const getProjectTypeText = (
    type?: string | null
  ) => {
    if (!type) {
      return tCommon("notSpecified")
    }

    switch (type) {
      case "R+2":
        return "R+2"

      case "Villa":
        return tProject("villa")

      case "Immeuble":
        return tProject("building")

      case "Commercial":
        return tProject("commercial")

      case "Industrial":
        return tProject("industrial")

      default:
        return type
    }
  }

  // ============================================================
  // EDIT
  // ============================================================

  const handleEditProject = () => {
    if (project?.id) {
      router.push(
        `/projects/${project.id}/edit`
      )
    }
  }

  // ============================================================
  // FORMATTERS
  // ============================================================

  const dateLocale =
    locale === "ar"
      ? "ar"
      : locale === "fr"
        ? "fr-FR"
        : "en-US"

  const currencyLocale =
    locale === "ar"
      ? "ar-MA"
      : locale === "fr"
        ? "fr-MA"
        : "en-US"

  const formatCurrency = (
    amount?: number | null
  ) => {
    const value = Number(amount) || 0

    return value.toLocaleString(
      currencyLocale,
      {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    )
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">

            <div className="h-6 w-1/4 bg-gray-200 rounded mb-6" />

            <div className="grid grid-cols-2 gap-6">

              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />

                  <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
              ))}

            </div>
          </div>
        </div>
      </Card>
    )
  }

  // ============================================================
  // PROJECT NOT FOUND
  // ============================================================

  if (!project) {
    return (
      <Card>
        <div className="p-6 text-center">

          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tProject("notFound")}
          </h3>

          <p className="text-gray-600">
            {tProject(
              "unableToLoadDetails"
            )}
          </p>

        </div>
      </Card>
    )
  }

  // ============================================================
  // FINANCIAL CALCULATIONS
  // ============================================================

  const budget =
    Number(
      project.totalBudget ??
        project.total_budget
    ) || 0

  const spent =
    Number(
      project.currentCost ??
        project.current_cost
    ) || 0

  /*
   * Écart = Budget - Coût réel
   *
   * Positive:
   *     budget restant
   *
   * Negative:
   *     dépassement
   */
  const difference =
    budget - spent

  /*
   * Budget consumption percentage
   */
  const budgetUsage =
    budget > 0
      ? (spent / budget) * 100
      : 0

  /*
   * Over budget
   */
  const isOverBudget =
    budget > 0 && spent > budget

  /*
   * Remaining budget
   */
  const remainingBudget =
    Math.max(difference, 0)

  /*
   * Over budget amount
   */
  const overBudgetAmount =
    Math.max(-difference, 0)

  /*
   * Project progress
   */
  const projectProgress = Math.min(
    Math.max(
      Number(
        project.progressPercentage ??
          project.progress_percentage
      ) || 0,
      0
    ),
    100
  )

  return (
    <div className="space-y-6">

      {/* ========================================================
          MAIN PROJECT INFORMATION
      ======================================================== */}

      <Card>
        <div className="p-6">

          {/* ======================================================
              HEADER
          ====================================================== */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

            <h2 className="text-xl font-bold text-gray-900">
              {tProject(
                "projectInformation"
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-2">

              <Badge
                className={getStatusColor(
                  project.status
                )}
              >
                {getStatusText(
                  project.status
                )}
              </Badge>

              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200"
              >
                {getProjectTypeText(
                  project.projectType ||
                    project.project_type
                )}
              </Badge>

              {isOverBudget && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <AlertTriangle
                    size={13}
                    className="mr-1"
                  />
                  Dépassement
                </Badge>
              )}

            </div>
          </div>

          {/* ======================================================
              PROJECT INFORMATION GRID
          ====================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* ====================================================
                LOCATION
            ==================================================== */}

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">

                <MapPin size={14} />

                <span>
                  {tProject("location")}
                </span>

              </div>

              <p className="text-lg font-semibold text-gray-900">
                {project.city ||
                  tCommon("notSpecified")}

                {project.postalCode &&
                  ` (${project.postalCode})`}
              </p>

              {project.address && (
                <p className="text-sm text-gray-600 mt-1">
                  {project.address}
                </p>
              )}
            </div>

            {/* ====================================================
                CLIENT
            ==================================================== */}

            {(project.clientName ||
              project.client_name) && (
              <div>

                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">

                  <Users size={14} />

                  <span>
                    {tProject(
                      "clientName"
                    )}
                  </span>

                </div>

                <p className="text-lg font-semibold text-gray-900">
                  {project.clientName ||
                    project.client_name}
                </p>

                <div className="flex flex-wrap gap-2 mt-1">

                  {(project.clientEmail ||
                    project.client_email) && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">

                      <Mail size={12} />

                      <span>
                        {project.clientEmail ||
                          project.client_email}
                      </span>

                    </div>
                  )}

                  {(project.clientPhone ||
                    project.client_phone) && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">

                      <Phone size={12} />

                      <span>
                        {project.clientPhone ||
                          project.client_phone}
                      </span>

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ====================================================
                BUDGET
            ==================================================== */}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">

                <DollarSign size={14} />

                <span>
                  Budget prévu
                </span>

              </div>

              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  budget
                )}
              </p>

            </div>

            {/* ====================================================
                ACTUAL COST
            ==================================================== */}

            <div
              className={`rounded-xl border p-4 ${
                isOverBudget
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >

              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">

                <TrendingUp size={14} />

                <span>
                  {tProject(
                    "currentCost"
                  )}
                </span>

              </div>

              <p
                className={`text-xl font-bold ${
                  isOverBudget
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(
                  spent
                )}
              </p>

            </div>

            {/* ====================================================
                VARIANCE
            ==================================================== */}

            <div
              className={`rounded-xl border p-4 ${
                isOverBudget
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >

              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">

                <DollarSign size={14} />

                <span>
                  Écart
                </span>

              </div>

              <p
                className={`text-xl font-bold ${
                  isOverBudget
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {isOverBudget
                  ? "-"
                  : "+"}

                {formatCurrency(
                  Math.abs(
                    difference
                  )
                )}
              </p>

            </div>

            {/* ====================================================
                BUDGET CONSUMPTION
            ==================================================== */}

            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">

                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    Consommation du budget
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(
                      spent
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      budget
                    )}
                  </div>
                </div>

                <div
                  className={`text-lg font-bold ${
                    isOverBudget
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {Math.round(
                    budgetUsage
                  )}
                  %
                </div>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    isOverBudget
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.max(
                        budgetUsage,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">

                {!isOverBudget ? (
                  <p className="text-xs text-gray-500">
                    Reste{" "}
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(
                        remainingBudget
                      )}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-red-600">
                    Dépassement du budget
                  </p>
                )}

                {isOverBudget && (
                  <p className="text-xs font-semibold text-red-600">
                    Dépassement de{" "}
                    {formatCurrency(
                      overBudgetAmount
                    )}
                  </p>
                )}

                {budget <= 0 && (
                  <p className="text-xs text-gray-500">
                    Aucun budget défini.
                  </p>
                )}

              </div>

            </div>

            {/* ====================================================
                PROJECT PROGRESS
            ==================================================== */}

            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4">

              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">

                  <Clock size={14} />

                  <span>
                    {tProject(
                      "progress"
                    )}
                  </span>

                </div>

                <span className="text-sm font-bold text-gray-900">
                  {Math.round(
                    projectProgress
                  )}
                  %
                </span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">

                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${projectProgress}%`,
                  }}
                />

              </div>

            </div>

            {/* ====================================================
                START DATE
            ==================================================== */}

            <div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">

                <Calendar size={14} />

                <span>
                  {tProject(
                    "startDate"
                  )}
                </span>

              </div>

              <p className="text-lg font-semibold text-gray-900">

                {project.startDate ||
                project.start_date
                  ? new Date(
                      project.startDate ||
                        project.start_date
                    ).toLocaleDateString(
                      dateLocale
                    )
                  : tProject(
                      "notDefined"
                    )}

              </p>

            </div>

            {/* ====================================================
                PLANNED END DATE
            ==================================================== */}

            <div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">

                <Calendar size={14} />

                <span>
                  {tProject(
                    "plannedEndDate"
                  )}
                </span>

              </div>

              <p className="text-lg font-semibold text-gray-900">

                {project.endDate ||
                project.planned_end_date
                  ? new Date(
                      project.endDate ||
                        project.planned_end_date
                    ).toLocaleDateString(
                      dateLocale
                    )
                  : tProject(
                      "notDefined"
                    )}

              </p>

            </div>

            {/* ====================================================
                ACTUAL END DATE
            ==================================================== */}

            {(project.actualEndDate ||
              project.actual_end_date) && (
              <div>

                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">

                  <Clock size={14} />

                  <span>
                    {tProject(
                      "actualEndDate"
                    )}
                  </span>

                </div>

                <p className="text-lg font-semibold text-gray-900">

                  {new Date(
                    project.actualEndDate ||
                      project.actual_end_date
                  ).toLocaleDateString(
                    dateLocale
                  )}

                </p>

              </div>
            )}

          </div>

          {/* ======================================================
              DESCRIPTION
          ====================================================== */}

          {project.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">

              <div className="text-sm font-medium text-gray-600 mb-2">
                {tProject(
                  "description"
                )}
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description}
              </p>

            </div>
          )}

          {/* ======================================================
              PROJECT TEAM
          ====================================================== */}

          {(project.siteManager ||
            project.site_manager ||
            project.structuralEngineer ||
            project.structural_engineer) && (

            <div className="mt-6 pt-6 border-t border-gray-200">

              <div className="text-sm font-medium text-gray-600 mb-3">
                {tProject(
                  "projectTeam"
                )}
              </div>

              <div className="flex flex-wrap gap-4">

                {/* SITE MANAGER */}

                {(project.siteManager ||
                  project.site_manager) && (

                  <div className="bg-blue-50 px-4 py-3 rounded-lg">

                    <div className="text-xs text-blue-600 font-medium mb-1">
                      {tProject(
                        "siteManager"
                      )}
                    </div>

                    <div className="font-medium text-blue-800">

                      {(
                        project.siteManager
                          ?.firstName ||
                        project.site_manager
                          ?.first_name ||
                        ""
                      )}{" "}

                      {(
                        project.siteManager
                          ?.lastName ||
                        project.site_manager
                          ?.last_name ||
                        ""
                      )}

                    </div>

                  </div>
                )}

                {/* STRUCTURAL ENGINEER */}

                {(project.structuralEngineer ||
                  project.structural_engineer) && (

                  <div className="bg-green-50 px-4 py-3 rounded-lg">

                    <div className="text-xs text-green-600 font-medium mb-1">
                      {tCommon(
                        "engineer"
                      )}
                    </div>

                    <div className="font-medium text-green-800">

                      {(
                        project.structuralEngineer
                          ?.firstName ||
                        project.structural_engineer
                          ?.first_name ||
                        ""
                      )}{" "}

                      {(
                        project.structuralEngineer
                          ?.lastName ||
                        project.structural_engineer
                          ?.last_name ||
                        ""
                      )}

                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* ======================================================
              ACTIONS
          ====================================================== */}

          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">

            <Button
              onClick={handleEditProject}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Edit size={16} />

              {tProject(
                "editProject"
              )}
            </Button>

          </div>

        </div>
      </Card>

      {/* ========================================================
          PROJECT PHASES
      ======================================================== */}

      {phases.length > 0 && (
        <Card>
          <div className="p-6">

            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {tProject(
                "projectPhases"
              )}
            </h3>

            <div className="space-y-3">

              {phases.map((phase) => {

                const phaseProgress = Math.min(
                  Math.max(
                    Number(
                      phase.progress_percentage
                    ) || 0,
                    0
                  ),
                  100
                )

                return (
                  <div
                    key={phase.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-gray-200 rounded-lg"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">

                        <span className="font-semibold text-gray-700">
                          {phase.order_index}
                        </span>

                      </div>

                      <div className="min-w-0">

                        <div className="font-medium text-gray-900">
                          {phase.name}
                        </div>

                        {phase.description && (
                          <div className="text-sm text-gray-600">
                            {phase.description}
                          </div>
                        )}

                      </div>
                    </div>

                    <div className="flex items-center gap-3">

                      <Badge
                        className={
                          phase.status ===
                          "completed"
                            ? "bg-green-100 text-green-800"
                            : phase.status ===
                                "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : phase.status ===
                                  "delayed"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      >
                        {phase.status ===
                        "completed"
                          ? tProject(
                              "completed"
                            )
                          : phase.status ===
                              "in_progress"
                            ? tProject(
                                "active"
                              )
                            : phase.status ===
                                "delayed"
                              ? tProject(
                                  "delayed"
                                )
                              : tProject(
                                  "planning"
                                )}
                      </Badge>

                      <div className="text-right">

                        <div className="text-sm font-medium">
                          {Math.round(
                            phaseProgress
                          )}
                          %
                        </div>

                        <div className="w-24 bg-gray-200 rounded-full h-1.5">

                          <div
                            className={`h-1.5 rounded-full ${
                              phaseProgress ===
                              100
                                ? "bg-green-500"
                                : phaseProgress >
                                    0
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                            }`}
                            style={{
                              width: `${phaseProgress}%`,
                            }}
                          />

                        </div>

                      </div>
                    </div>
                  </div>
                )
              })}

            </div>
          </div>
        </Card>
      )}

      {/* ========================================================
          RECENT ANOMALIES
      ======================================================== */}

      {anomalies.length > 0 && (
        <Card>
          <div className="p-6">

            <div className="flex items-center justify-between mb-4">

              <h3 className="text-lg font-bold text-gray-900">
                {tProject(
                  "recentAnomalies"
                )}
              </h3>

              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                {
                  anomalies.filter(
                    (a) =>
                      a.status === "open"
                  ).length
                }{" "}
                {tProject("open")}
              </Badge>

            </div>

            <div className="space-y-3">

              {anomalies
                .slice(0, 3)
                .map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="p-3 border border-red-100 bg-red-50 rounded-lg"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <AlertTriangle
                          size={14}
                          className="text-red-600"
                        />

                        <span className="font-medium text-gray-900">
                          {anomaly.title}
                        </span>

                      </div>

                      <Badge
                        className={
                          anomaly.severity ===
                          "critical"
                            ? "bg-red-100 text-red-800"
                            : anomaly.severity ===
                                "high"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {anomaly.severity}
                      </Badge>

                    </div>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {anomaly.description}
                    </p>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">

                      <span>
                        {tProject(
                          "reportedBy"
                        )}{" "}
                        {
                          anomaly.reported_by
                            ?.first_name
                        }
                      </span>

                      <span>
                        {new Date(
                          anomaly.created_at
                        ).toLocaleDateString(
                          dateLocale
                        )}
                      </span>

                    </div>

                  </div>
                ))}

              {anomalies.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                >
                  {tProject(
                    "viewAllAnomalies"
                  )}{" "}
                  ({anomalies.length})
                </Button>
              )}

            </div>
          </div>
        </Card>
      )}

    </div>
  )
}