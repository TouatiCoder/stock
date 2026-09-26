"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/lib/mysql/auth-context";
import {
  buildToolProjectsUrl,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  type ToolProjectOption,
} from "@/lib/calculators/project-link";

type ChecklistListItem = {
  id: string;
  title: string;
  checklistType: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  itemsTotal: number;
  itemsChecked: number;
};

type ChecklistItemRow = { id: string; label: string; isChecked: boolean; position: number };

type ChecklistDetail = ChecklistListItem & { items: ChecklistItemRow[] };

const CHECKLIST_TYPES = ["safety", "daily", "quality", "equipment", "general"] as const;

const LOCALE_MAP = { ar: "ar-MA", en: "en-US", fr: "fr-FR" } as const;

export default function ChecklistsClient() {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();
  const { user } = useAuth();

  const resolvedLocale = LOCALE_MAP[locale];
  const text = (key: string, fallback: string) => {
    const translated = tCommon(key);
    return translated === key ? fallback : translated;
  };

  const typeLabel = (type: string) =>
    text(`checklistsType_${type}`, type.charAt(0).toUpperCase() + type.slice(1));

  const [checklists, setChecklists] = useState<ChecklistListItem[]>([]);
  const [projects, setProjects] = useState<ToolProjectOption[]>([]);
  const [areProjectsLoaded, setAreProjectsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [checklistType, setChecklistType] = useState<string>("general");
  const [projectId, setProjectId] = useState("");
  const [itemInputs, setItemInputs] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<ChecklistDetail | null>(null);
  const [isExpandedLoading, setIsExpandedLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadChecklists = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterProject) params.set("projectId", filterProject);
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/checklists?${params.toString()}`, { credentials: "include", cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || text("checklistsLoadError", "Failed to load checklists"));
      setChecklists(body.items || []);
    } catch (err: any) {
      setError(err?.message || text("checklistsLoadError", "Failed to load checklists"));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * The project list offered by the checklist form: every project of the
   * authenticated user's company (the default scope only returns the projects
   * the user is personally assigned to, which left the dropdown empty).
   */
  const loadProjects = async () => {
    try {
      const res = await fetch(buildToolProjectsUrl("company"), { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      setProjects(mapToolProjectOptions(body));
    } finally {
      setAreProjectsLoaded(true);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    void loadChecklists();
  }, [filterProject, filterStatus, filterType]);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [locale]);

  const displayed = useMemo(
    () => checklists.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase())),
    [checklists, search],
  );

  const resetForm = () => {
    setTitle("");
    setChecklistType("general");
    setProjectId("");
    setItemInputs([""]);
  };

  const createChecklist = async () => {
    if (!title.trim()) return;
    try {
      setIsCreating(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          checklistType,
          projectId: projectId || null,
          items: itemInputs.map((item) => item.trim()).filter(Boolean),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || text("checklistsCreateError", "Failed to create checklist"));

      setSuccessMessage(text("checklistsCreatedMessage", "Checklist created successfully."));
      resetForm();
      setShowForm(false);
      await loadChecklists();
    } catch (err: any) {
      setError(err?.message || text("checklistsCreateError", "Failed to create checklist"));
    } finally {
      setIsCreating(false);
    }
  };

  const deleteChecklist = async (id: string) => {
    try {
      setActingId(id);
      setError(null);
      const res = await fetch(`/api/checklists/${id}`, { method: "DELETE", credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || text("checklistsDeleteError", "Failed to delete checklist"));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedDetail(null);
      }
      await loadChecklists();
    } catch (err: any) {
      setError(err?.message || text("checklistsDeleteError", "Failed to delete checklist"));
    } finally {
      setActingId(null);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(id);
    setExpandedDetail(null);
    setIsExpandedLoading(true);
    try {
      const res = await fetch(`/api/checklists/${id}`, { credentials: "include", cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || text("checklistsLoadError", "Failed to load checklists"));
      setExpandedDetail(body.item);
    } catch (err: any) {
      setError(err?.message || text("checklistsLoadError", "Failed to load checklists"));
    } finally {
      setIsExpandedLoading(false);
    }
  };

  const toggleItem = async (checklistId: string, itemId: string, isChecked: boolean) => {
    try {
      const res = await fetch(`/api/checklists/${checklistId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isChecked }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || text("checklistsToggleError", "Failed to update checklist item"));
      setExpandedDetail(body.item);
      await loadChecklists();
    } catch (err: any) {
      setError(err?.message || text("checklistsToggleError", "Failed to update checklist item"));
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString(resolvedLocale);

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{text("checklistsPageTitle", "Checklists")}</h1>
          <p className="text-sm text-gray-600">
            {text("checklistsPageDescription", "Create and track site, safety, and quality checklists.")}
          </p>
        </div>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? text("checklistsCancel", "Cancel") : text("checklistsNewButton", "New Checklist")}
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {successMessage && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
      )}

      {showForm && (
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">{text("checklistsFormTitle", "New Checklist")}</h2>
          <input
            className="w-full rounded border p-2"
            placeholder={text("checklistsTitlePlaceholder", "Checklist title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="w-full rounded border p-2" value={checklistType} onChange={(e) => setChecklistType(e.target.value)}>
              {CHECKLIST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
            <div>
              <select
                className="w-full rounded border p-2"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                aria-label={text("checklistsProjectPlaceholder", "Link to project (optional)")}
              >
                {/* Empty value = no project: linking a checklist to a project stays optional. */}
                <option value="">{text("checklistsProjectPlaceholder", "Link to project (optional)")}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {formatProjectOptionLabel(project)}
                  </option>
                ))}
              </select>
              {areProjectsLoaded && projects.length === 0 ? (
                <p className="mt-1 text-xs text-gray-500">
                  {text("checklistsNoProjectsAvailable", "No project available")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{text("checklistsItemsLabel", "Checklist items")}</p>
            {itemInputs.map((value, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="w-full rounded border p-2"
                  placeholder={text("checklistsItemPlaceholder", "e.g. Check formwork alignment")}
                  value={value}
                  onChange={(e) =>
                    setItemInputs((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))
                  }
                />
                {itemInputs.length > 1 && (
                  <button
                    className="rounded border px-3 text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => setItemInputs((prev) => prev.filter((_, i) => i !== index))}
                  >
                    {text("checklistsRemoveItem", "Remove")}
                  </button>
                )}
              </div>
            ))}
            <button
              className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setItemInputs((prev) => [...prev, ""])}
            >
              {text("checklistsAddItem", "+ Add item")}
            </button>
          </div>

          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={createChecklist}
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? text("checklistsCreating", "Creating...") : text("checklistsCreateButton", "Create Checklist")}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="w-full rounded border p-2 sm:flex-1"
          placeholder={text("checklistsSearchPlaceholder", "Search checklists...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="rounded border p-2" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">{text("checklistsFilterAllProjects", "All projects")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select className="rounded border p-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">{text("checklistsFilterAllStatuses", "All statuses")}</option>
          <option value="in_progress">{text("checklistsStatusInProgress", "In progress")}</option>
          <option value="completed">{text("checklistsStatusCompleted", "Completed")}</option>
        </select>
        <select className="rounded border p-2" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">{text("checklistsFilterAllTypes", "All types")}</option>
          {CHECKLIST_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded border bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">{text("checklistsLoading", "Loading...")}</p>
        ) : displayed.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">{text("checklistsEmptyState", "No checklists found.")}</p>
        ) : (
          <div className="divide-y">
            {displayed.map((checklist) => (
              <div key={checklist.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{checklist.title}</p>
                    <p className="text-xs text-gray-500">
                      {typeLabel(checklist.checklistType)} · {checklist.project?.name || text("checklistsNoProject", "No project")} ·{" "}
                      {formatDate(checklist.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        checklist.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {checklist.status === "completed"
                        ? text("checklistsStatusCompleted", "Completed")
                        : text("checklistsStatusInProgress", "In progress")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {checklist.itemsChecked}/{checklist.itemsTotal}
                    </span>
                    <button
                      className="rounded border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => toggleExpand(checklist.id)}
                    >
                      {expandedId === checklist.id ? text("checklistsCollapse", "Hide") : text("checklistsExpand", "View")}
                    </button>
                    {user?.id === checklist.createdBy.id && (
                      <button
                        className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        onClick={() => deleteChecklist(checklist.id)}
                        disabled={actingId === checklist.id}
                      >
                        {text("checklistsDeleteButton", "Delete")}
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === checklist.id && (
                  <div className="mt-3 rounded border bg-gray-50 p-3">
                    {isExpandedLoading || !expandedDetail ? (
                      <p className="text-sm text-gray-500">{text("checklistsLoading", "Loading...")}</p>
                    ) : expandedDetail.items.length === 0 ? (
                      <p className="text-sm text-gray-500">{text("checklistsEmptyState", "No checklists found.")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {expandedDetail.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={item.isChecked}
                              onChange={(e) => toggleItem(checklist.id, item.id, e.target.checked)}
                            />
                            <span className={item.isChecked ? "text-gray-400 line-through" : "text-gray-800"}>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {expandedDetail?.completedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        {text("checklistsCompletedOn", "Completed on")} {formatDate(expandedDetail.completedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
