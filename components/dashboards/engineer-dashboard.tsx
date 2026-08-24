"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calculator, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar,
  BarChart3,
  Ruler,
  Weight,
  Building,
  ArrowRight
} from "lucide-react"
import { useAuth } from '@/lib/mysql/auth-context'
import { useCommonTranslations, useProjectTranslations, useLocale } from "@/components/LocaleProvider"

export function EngineerDashboard() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const tCommon = useCommonTranslations()
  const tProject = useProjectTranslations()
  const { locale } = useLocale()

  const dateLocale = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US"

  useEffect(() => {
    fetchEngineerData()
  }, [])

  const fetchEngineerData = async () => {
    try {
      // Fetch calculations from tools API
      const calculationsRes = await fetch('/api/tools/calculations?limit=5', { 
        credentials: 'include' 
      });
      const calculationsData = calculationsRes.ok ? await calculationsRes.json() : null;
      const calcItems = Array.isArray(calculationsData)
        ? calculationsData
        : Array.isArray(calculationsData?.items)
          ? calculationsData.items
          : [];
      setCalculations(calcItems);

      // Fetch active projects assigned to engineer
      const projectsRes = await fetch('/api/projects?status=active&limit=5', { 
        credentials: 'include' 
      });
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
      setProjects(projectsData?.projects ?? []);

      // Fetch materials from inventory
      const materialsRes = await fetch('/api/materials?lowStock=false', { 
        credentials: 'include' 
      });
      const materialsData = materialsRes.ok ? await materialsRes.json() : [];
      setMaterials(Array.isArray(materialsData) ? materialsData.slice(0, 5) : []);

      // Fetch checklists from API
      const checklistsRes = await fetch('/api/checklists?limit=20', {
        credentials: 'include'
      });
      const checklistsData = checklistsRes.ok ? await checklistsRes.json() : { items: [] };
      const allChecklists = Array.isArray(checklistsData?.items) ? checklistsData.items : [];
      
      const mappedChecklists = allChecklists.map((item: any) => ({
        id: item.id,
        title: item.title,
        checklist_type: item.checklistType || item.checklist_type || "general",
        status: item.status,
        completed_at: item.completedAt || item.completed_at || item.createdAt,
        created_at: item.createdAt,
        project_name: item.project?.name,
        items_total: item.itemsTotal ?? 0,
        items_checked: item.itemsChecked ?? 0,
      }));
      setChecklists(mappedChecklists);

    } catch (error) {
      console.error('Error fetching engineer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCalculationTitle = (calc: any) => {
    const type = calc.toolType || calc.tool_type || "";
    switch (type) {
      case "concrete":
        return tCommon("concreteCalculator") || "Calcul Béton";
      case "steel":
        return tCommon("steelCalculator") || "Calcul Acier";
      case "formwork":
        return tCommon("formworkCalculator") || "Calcul Coffrage";
      default:
        return calc.reference || calc.name || type || tCommon("calculationsPerformed");
    }
  };

  const getCalculationBadge = (toolType: string) => {
    switch (toolType) {
      case "concrete":
        return { label: tCommon("concreteLabel") || "Béton", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "steel":
        return { label: tCommon("steelLabel") || "Acier", color: "bg-orange-50 text-orange-700 border-orange-200" };
      case "formwork":
        return { label: "Coffrage", color: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: toolType || "Calcul", color: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  const getCalculationIcon = (toolType: string) => {
    switch (toolType) {
      case "concrete":
        return <Building size={16} className="text-blue-600 shrink-0" />;
      case "steel":
        return <Weight size={16} className="text-orange-600 shrink-0" />;
      case "formwork":
        return <Ruler size={16} className="text-amber-600 shrink-0" />;
      default:
        return <Calculator size={16} className="text-purple-600 shrink-0" />;
    }
  };

  const getCalculationSummary = (calc: any) => {
    const out = calc.output || calc.outputJson || {};
    const type = calc.toolType || calc.tool_type || "";
    if (type === "concrete") {
      const vol = out.volumeM3 != null ? out.volumeM3 : out.total_concrete_volume;
      const bags = out.cementBags != null ? out.cementBags : "";
      return `Volume: ${vol || 0} m³${bags ? ` • Ciment: ${bags} sacs` : ""}`;
    }
    if (type === "steel") {
      const weight = out.totalWeightKg != null ? out.totalWeightKg : out.total_steel_weight;
      const cost = out.estimatedCost != null ? `${out.estimatedCost} MAD` : "";
      return `Poids: ${weight || 0} kg${cost ? ` • Coût: ${cost}` : ""}`;
    }
    if (type === "formwork") {
      const area = out.surfaceAreaM2 != null ? out.surfaceAreaM2 : "";
      const sheets = out.plywoodSheets != null ? out.plywoodSheets : "";
      return `Surface: ${area || 0} m²${sheets ? ` • Panneaux: ${sheets}` : ""}`;
    }
    return calc.notes || "";
  };

  const getCalculationHref = (toolType: string) => {
    switch (toolType) {
      case "concrete":
        return "/tools/concrete-calculator";
      case "steel":
        return "/tools/steel-calculator";
      case "formwork":
        return "/tools/formwork-calculator";
      default:
        return "/calculations/new";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("calculationsPerformed")}</p>
              <Calculator size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{calculations.length}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("thisMonth")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tProject("activeProjects")}</p>
              <Building size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'active' || p.status === 'in_progress').length}
            </p>
            <p className="text-xs text-gray-500 mt-2">{tProject("inPlanning")}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{tCommon("checklistsCompleted")}</p>
              <CheckCircle size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{checklists.length}</p>
            <p className="text-xs text-gray-500 mt-2">{tCommon("last7Days")}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{tCommon("quickCalculationTools")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/tools/concrete-calculator">
                <Button 
                  className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer"
                >
                  <Calculator size={18} />
                  {tCommon("concreteCalculator")}
                </Button>
              </Link>
              <Link href="/tools/steel-calculator">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 h-12 bg-transparent cursor-pointer"
                >
                  <Weight size={18} />
                  {tCommon("steelCalculator")}
                </Button>
              </Link>
              <Link href="/tools/formwork-calculator">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 h-12 bg-transparent cursor-pointer"
                >
                  <Ruler size={18} />
                  {tCommon("formworkCalculator")}
                </Button>
              </Link>
              <Link href="/materials/library">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 h-12 bg-transparent cursor-pointer"
                >
                  <BookOpen size={18} />
                  {tCommon("library")}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("latestCalculations")}</h3>
              {calculations.length > 0 && (
                <Link 
                  href="/calculations/new" 
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>{tCommon("newProject") ? "Nouveau" : "New"}</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {calculations.length > 0 ? (
                calculations.map((calc) => {
                  const badge = getCalculationBadge(calc.toolType || calc.tool_type);
                  const summary = getCalculationSummary(calc);
                  const href = getCalculationHref(calc.toolType || calc.tool_type);
                  const dateStr = calc.createdAt || calc.created_at;

                  return (
                    <Link
                      key={calc.id} 
                      href={href}
                      className="block p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 hover:border-gray-300 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCalculationIcon(calc.toolType || calc.tool_type)}
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {getCalculationTitle(calc)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {summary && (
                        <p className="text-xs font-medium text-gray-700 mt-1.5">
                          {summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200/60">
                        <span>{calc.project?.name ? `Projet : ${calc.project.name}` : "Sans projet lié"}</span>
                        <span>{dateStr ? new Date(dateStr).toLocaleDateString(dateLocale) : ""}</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <FileText size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-1">{tCommon("noCalculations") || "Aucun calcul"}</p>
                  <p className="text-xs text-gray-400 mb-3">Effectuez vos calculs structurels et enregistrez-les pour les retrouver ici.</p>
                  <Link href="/calculations/new">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="cursor-pointer font-medium"
                    >
                      <Calculator size={14} className="mr-1.5" />
                      {tCommon("createCalculation") || "Créer un calcul"}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tProject("myActiveProjects")}</h3>
              <Link 
                href="/projects" 
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{tCommon("viewAll") || "Voir tout"}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map((project) => {
                  const progress = project.progressPercentage ?? project.progress_percentage ?? 0;
                  const statusLabel = 
                    project.status === "in_progress" ? (tProject("inProgress") || "En cours") :
                    project.status === "planning" ? (tProject("inPlanning") || "Planification") :
                    project.status === "completed" ? (tProject("completed") || "Terminé") :
                    project.status;

                  return (
                    <Link
                      key={project.id} 
                      href={`/projects/${project.id}`}
                      className="block p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 hover:border-gray-300 transition-all group"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {project.clientName || project.client_name ? `Client : ${project.clientName || project.client_name}` : ""}
                            {project.city ? ` • ${project.city}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 shrink-0">{progress}%</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <Building size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-1">{tProject("noAssignedProject") || "Aucun projet assigné"}</p>
                  <p className="text-xs text-gray-400 mb-3">Consultez tous les projets de l'entreprise.</p>
                  <Link href="/projects">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      {tProject("allProjects") || "Voir les projets"}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{tCommon("structuralMaterials")}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/materials/library'}
              >
                <Package size={14} className="mr-1" />
                {tCommon("viewAll")}
              </Button>
            </div>
            <div className="space-y-3">
              {materials.length > 0 ? (
                materials.map((material) => (
                  <div key={material.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{material.name}</p>
                      <span className="text-xs font-medium text-blue-600">
                        {material.unit_price?.toLocaleString('fr-MA', {
                          style: 'currency',
                          currency: 'MAD'
                        })} /{material.unit_of_measure}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {material.unit_weight && (
                        <p className="text-xs text-gray-600">
                          <Weight size={12} className="inline mr-1" />
                          {material.unit_weight} kg/{material.unit_of_measure}
                        </p>
                      )}
                      {material.technical_specifications && (
                        <p className="text-xs text-gray-600">
                          <BookOpen size={12} className="inline mr-1" />
                          {tCommon("specs")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{tCommon("noMaterialsAvailable")}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{tCommon("recentlyCompletedChecklists") || "Checklists récentes"}</h3>
            <Link 
              href="/checklists"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{tCommon("viewAll") || "Voir tout"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {checklists.length > 0 ? (
              checklists.map((checklist) => {
                const isCompleted = checklist.status === "completed";
                const dateStr = checklist.completed_at || checklist.created_at;

                return (
                  <Link
                    key={checklist.id} 
                    href="/checklists"
                    className={`block p-3.5 rounded-xl border transition-all group ${
                      isCompleted 
                        ? "bg-green-50/40 border-green-200 hover:bg-green-100/60" 
                        : "bg-blue-50/40 border-blue-200 hover:bg-blue-100/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className={isCompleted ? "text-green-600 shrink-0" : "text-blue-600 shrink-0"} />
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {checklist.title}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border capitalize ${
                        isCompleted 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {isCompleted ? (tCommon("completed") || "Terminé") : (tCommon("inProgress") || "En cours")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200/50">
                      <span>
                        {checklist.project_name ? `Projet : ${checklist.project_name}` : "Checklist générale"}
                        {checklist.items_total > 0 && ` • (${checklist.items_checked}/${checklist.items_total} vérifiés)`}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {dateStr ? new Date(dateStr).toLocaleDateString(dateLocale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : ""}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600 mb-1">{tCommon("noRecentChecklist") || "Aucun checklist récent"}</p>
                <p className="text-xs text-gray-400 mb-3">Effectuez les vérifications qualité et sécurité de vos chantiers.</p>
                <Link href="/checklists">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Calendar size={14} className="mr-1.5" />
                    {tCommon("viewCalendar") || "Consulter les checklists"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
