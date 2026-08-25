"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useProjectTranslations,
  useCommonTranslations,
  useLocale,
} from "@/components/LocaleProvider"
import {
  Eye,
  Edit2,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ============================================================
// TYPES
// ============================================================

export interface ProjectWithDetails {
  id: string
  name: string
  description: string | null
  status: string
  clientName: string | null
  startDate: Date | null
  endDate: Date | null
  totalBudget: number | null
  currentCost: number | null
  progressPercentage?: number
  projectType?: string | null
  city?: string | null

  siteManager?: {
    id: string
    firstName: string
    lastName: string
  } | null

  structuralEngineer?: {
    id: string
    firstName: string
    lastName: string
  } | null

  company?: {
    id: string
    name: string
  } | null

  createdAt: Date
  updatedAt: Date
}

// ============================================================
// PROPS
// ============================================================

interface ProjectsListProps {
  searchTerm?: string
  filterStatus?: string
  projects?: ProjectWithDetails[]
  loading?: boolean
  onProjectClick?: (projectId: string) => void
  onDeleteProject?: (projectId: string) => Promise<void> | void
}

// ============================================================
// COMPONENT
// ============================================================

export function ProjectsList({
  searchTerm = "",
  filterStatus = "all",
  projects: externalProjects,
  loading = false,
  onProjectClick,
  onDeleteProject,
}: ProjectsListProps) {
  const projects = externalProjects || []

  const tProject = useProjectTranslations()
  const tCommon = useCommonTranslations()
  const { locale } = useLocale()

  const [projectToDelete, setProjectToDelete] =
    useState<ProjectWithDetails | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)

  // ============================================================
  // STATUS
  // ============================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800 border-blue-200"

      case "active":
        return "bg-green-100 text-green-800 border-green-200"

      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"

      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"

      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"

      case "in_progress":
        return "bg-green-100 text-green-800 border-green-200"

      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return tProject("planning")

      case "active":
      case "in_progress":
        return tProject("active")

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

  const getProjectTypeText = (type?: string | null) => {
    if (!type) {
      return tCommon("notSpecified")
    }

    switch (type) {
      case "R+2":
        return tProject("rPlus2")

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
  // CURRENCY
  // ============================================================

  const formatCurrency = (amount?: number | null) => {
    const value = Number(amount) || 0

    const currencyLocale =
      locale === "ar"
        ? "ar-MA"
        : locale === "fr"
          ? "fr-MA"
          : "en-US"

    return value.toLocaleString(currencyLocale, {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // ============================================================
  // DATE
  // ============================================================

  const dateLocale =
    locale === "ar"
      ? "ar"
      : locale === "fr"
        ? "fr-FR"
        : "en-US"

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />

            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />

            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (projects.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tCommon("noResults")}
          </h3>

          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== "all"
              ? tCommon("noResultsForSearch")
              : tCommon("startByCreatingProject")}
          </p>

          <Link href="/projects/new">
            <Button>
              {tCommon("newProject")}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // ============================================================
  // PROJECT LIST
  // ============================================================

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        // ========================================================
        // FINANCIAL CALCULATIONS
        // ========================================================

        const progress =
          Number(project.progressPercentage) || 0

        const budget =
          Number(project.totalBudget) || 0

        const spent =
          Number(project.currentCost) || 0

        /*
         * Écart = Budget - Coût réel
         *
         * Positive  -> budget restant
         * Negative  -> dépassement
         */
        const difference =
          budget - spent

        /*
         * Consommation du budget
         */
        const budgetUsage =
          budget > 0
            ? (spent / budget) * 100
            : 0

        /*
         * Projet en dépassement
         */
        const isOverBudget =
          budget > 0 && spent > budget

        /*
         * Budget restant.
         *
         * On ne montre jamais une valeur négative
         * comme "budget restant".
         */
        const remainingBudget =
          Math.max(difference, 0)

        /*
         * Montant du dépassement
         */
        const overBudgetAmount =
          Math.max(-difference, 0)

        return (
          <Card
            key={project.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">

              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2 mb-2">

                    <h3
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer break-words"
                      onClick={() =>
                        onProjectClick?.(project.id)
                      }
                    >
                      {project.name ||
                        tProject("unnamedProject")}
                    </h3>

                    <Badge
                      variant="outline"
                      className={getStatusColor(
                        project.status
                      )}
                    >
                      {getStatusLabel(
                        project.status
                      )}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      {getProjectTypeText(
                        project.projectType
                      )}
                    </Badge>

                    {isOverBudget && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <AlertTriangle
                          size={12}
                          className="mr-1"
                        />
                        Dépassement
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description ||
                      tProject("noDescription")}
                  </p>

                  {/* ==================================================
                      PROJECT INFORMATION
                  ================================================== */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">

                    {/* CLIENT */}
                    {project.clientName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users
                          size={14}
                          className="text-gray-400 shrink-0"
                        />

                        <span className="text-gray-600">
                          {tProject("clientLabel")}{" "}
                        </span>

                        <span className="font-medium truncate">
                          {project.clientName}
                        </span>
                      </div>
                    )}

                    {/* LOCATION */}
                    {project.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin
                          size={14}
                          className="text-gray-400 shrink-0"
                        />

                        <span className="text-gray-600">
                          {tProject("locationLabel")}{" "}
                        </span>

                        <span className="font-medium truncate">
                          {project.city}
                        </span>
                      </div>
                    )}

                    {/* START DATE */}
                    {project.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar
                          size={14}
                          className="text-gray-400 shrink-0"
                        />

                        <span className="text-gray-600">
                          {tProject("startLabel")}{" "}
                        </span>

                        <span className="font-medium">
                          {new Date(
                            project.startDate
                          ).toLocaleDateString(
                            dateLocale
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    DROPDOWN ACTIONS
                ================================================== */}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer border border-transparent hover:border-gray-200 flex items-center justify-center shrink-0 outline-none ml-3"
                      aria-label={
                        tCommon("actions") ||
                        "Actions"
                      }
                    >
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-1.5 z-50"
                  >
                    {/* VIEW */}
                    <DropdownMenuItem
                      onClick={() =>
                        onProjectClick?.(
                          project.id
                        )
                      }
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Eye
                        size={15}
                        className="text-gray-500"
                      />

                      <span>
                        {tProject(
                          "viewDetails"
                        ) ||
                          "Voir détails"}
                      </span>
                    </DropdownMenuItem>

                    {/* EDIT */}
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Edit2
                          size={15}
                          className="text-gray-500"
                        />

                        <span>
                          {tCommon("edit") ||
                            "Modifier"}
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-gray-800" />

                    {/* DELETE */}
                    <DropdownMenuItem
                      onClick={() =>
                        setProjectToDelete(
                          project
                        )
                      }
                      className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 rounded-lg font-medium transition-colors"
                    >
                      <Trash2
                        size={15}
                        className="text-red-600 dark:text-red-400"
                      />

                      <span>
                        {tCommon("delete") ||
                          "Supprimer"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ==================================================
                  PROGRESS + BUDGET
              ================================================== */}

              <div className="space-y-5">

                {/* ==================================================
                    PROJECT PROGRESS
                ================================================== */}

                <div>
                  <div className="flex items-center justify-between mb-2">

                    <div className="flex items-center gap-2">
                      <TrendingUp
                        size={14}
                        className="text-gray-500"
                      />

                      <div className="text-sm font-medium text-gray-700">
                        {tProject(
                          "projectProgress"
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-bold">
                      {Math.round(progress)}%
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          Math.max(progress, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* ==================================================
                    FINANCIAL SUMMARY
                ================================================== */}

                <div className="pt-4 border-t border-gray-100">

                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign
                      size={15}
                      className="text-gray-500"
                    />

                    <div className="text-sm font-semibold text-gray-800">
                      Budget / Coût réel
                    </div>
                  </div>

                  {/* ==================================================
                      THREE FINANCIAL CARDS
                  ================================================== */}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {/* BUDGET */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">

                      <div className="text-xs text-gray-500 mb-1">
                        Budget prévu
                      </div>

                      <div className="text-sm font-bold text-gray-900 break-words">
                        {formatCurrency(
                          budget
                        )}
                      </div>
                    </div>

                    {/* ACTUAL */}
                    <div
                      className={`rounded-lg border p-3 ${
                        isOverBudget
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Coût réel
                      </div>

                      <div
                        className={`text-sm font-bold break-words ${
                          isOverBudget
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(
                          spent
                        )}
                      </div>
                    </div>

                    {/* VARIANCE */}
                    <div
                      className={`rounded-lg border p-3 ${
                        isOverBudget
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        Écart
                      </div>

                      <div
                        className={`text-sm font-bold break-words ${
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
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      BUDGET PROGRESS
                  ================================================== */}

                  <div className="mt-4">

                    <div className="flex items-center justify-between mb-2">

                      <div className="text-xs font-medium text-gray-600">
                        Consommation du budget
                      </div>

                      <div
                        className={`text-xs font-bold ${
                          isOverBudget
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                      >
                        {Math.round(
                          budgetUsage
                        )}
                        %
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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
                  </div>

                  {/* ==================================================
                      BUDGET STATUS
                  ================================================== */}

                  {budget > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">

                      {!isOverBudget ? (
                        <div className="text-xs text-gray-500">
                          Reste{" "}
                          <span className="font-semibold text-gray-700">
                            {formatCurrency(
                              remainingBudget
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 font-semibold">
                          Dépassement du budget
                        </div>
                      )}

                      {isOverBudget && (
                        <div className="text-xs text-red-600 font-semibold">
                          Dépassement de{" "}
                          {formatCurrency(
                            overBudgetAmount
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ==================================================
                      NO BUDGET
                  ================================================== */}

                  {budget <= 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Aucun budget défini pour ce projet.
                    </div>
                  )}
                </div>

                {/* ==================================================
                    PROJECT TEAM
                ================================================== */}

                {(project.siteManager ||
                  project.structuralEngineer) && (
                  <div className="pt-4 border-t border-gray-100">

                    <div className="text-sm text-gray-500 mb-2">
                      {tProject(
                        "projectTeam"
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">

                      {/* SITE MANAGER */}
                      {project.siteManager && (
                        <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-lg">

                          <Users
                            size={12}
                            className="text-blue-600"
                          />

                          <span className="font-medium text-blue-700">
                            {tProject(
                              "siteManagerLabel"
                            )}
                          </span>

                          <span className="text-blue-800">
                            {typeof project.siteManager ===
                            "object"
                              ? `${project.siteManager?.firstName || ""} ${project.siteManager?.lastName || ""}`
                              : String(
                                  project.siteManager
                                )}
                          </span>
                        </div>
                      )}

                      {/* STRUCTURAL ENGINEER */}
                      {project.structuralEngineer && (
                        <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1 rounded-lg">

                          <TrendingUp
                            size={12}
                            className="text-green-600"
                          />

                          <span className="font-medium text-green-700">
                            {tProject(
                              "engineerLabel"
                            )}
                          </span>

                          <span className="text-green-800">
                            {typeof project.structuralEngineer ===
                            "object"
                              ? `${project.structuralEngineer?.firstName || ""} ${project.structuralEngineer?.lastName || ""}`
                              : String(
                                  project.structuralEngineer
                                )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================================================
                    DATES
                ================================================== */}

                <div className="pt-4 border-t border-gray-100">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

                    {/* START */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">

                        <Calendar size={12} />

                        <span>
                          {tProject(
                            "startDateShort"
                          )}
                        </span>
                      </div>

                      <div className="font-medium">
                        {project.startDate
                          ? new Date(
                              project.startDate
                            ).toLocaleDateString(
                              dateLocale
                            )
                          : tProject(
                              "notDefined"
                            )}
                      </div>
                    </div>

                    {/* END */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">

                        <Clock size={12} />

                        <span>
                          {tProject(
                            "plannedEndShort"
                          )}
                        </span>
                      </div>

                      <div className="font-medium">
                        {project.endDate
                          ? new Date(
                              project.endDate
                            ).toLocaleDateString(
                              dateLocale
                            )
                          : tProject(
                              "notDefined"
                            )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    BOTTOM ACTIONS
                ================================================== */}

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">

                  {/* VIEW */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1"
                    onClick={(e) => {
                      if (onProjectClick) {
                        e.preventDefault()
                        onProjectClick(
                          project.id
                        )
                      }
                    }}
                  >
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />

                      {tProject(
                        "viewProject"
                      )}
                    </Button>
                  </Link>

                  {/* EDIT */}
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />

                      {tCommon("edit")}
                    </Button>
                  </Link>

                  {/* DELETE */}
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 hover:border-red-200 px-3 flex items-center justify-center cursor-pointer"
                    onClick={() =>
                      setProjectToDelete(
                        project
                      )
                    }
                    title={
                      tCommon("delete") ||
                      "Supprimer"
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      {/* ============================================================
          DELETE CONFIRMATION DIALOG
      ============================================================ */}

      <Dialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setProjectToDelete(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-6">

          <DialogHeader className="flex flex-col items-center sm:items-start gap-3">

            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
              <Trash2 size={24} />
            </div>

            <div>

              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {tCommon("delete")}{" "}
                {tProject("projectLabel") ||
                  "Projet"}
              </DialogTitle>

              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1.5 leading-relaxed">

                {tProject(
                  "deleteConfirm"
                ) ||
                  "Êtes-vous sûr de vouloir supprimer ce projet ?"}

                {projectToDelete && (
                  <span className="block mt-2 font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                    «{" "}
                    {projectToDelete.name}{" "}
                    »
                  </span>
                )}

                <span className="block mt-2 text-xs text-red-600 font-medium">
                  ⚠️{" "}
                  {tCommon(
                    "irreversibleAction"
                  ) ||
                    "Cette action est irréversible et supprimera définitivement le projet."}
                </span>
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:justify-end">

            {/* CANCEL */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setProjectToDelete(null)
              }
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {tCommon("cancel") ||
                "Annuler"}
            </Button>

            {/* DELETE */}
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer flex items-center gap-2"
              disabled={isDeleting}
              onClick={async () => {
                if (!projectToDelete) {
                  return
                }

                try {
                  setIsDeleting(true)

                  if (onDeleteProject) {
                    await onDeleteProject(
                      projectToDelete.id
                    )
                  }

                  setProjectToDelete(null)
                } catch (err: any) {
                  console.error(
                    "Failed to delete project:",
                    err
                  )
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  <span>
                    {tCommon("deleting") ||
                      "Suppression..."}
                  </span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />

                  <span>
                    {tCommon("delete") ||
                      "Supprimer"}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}