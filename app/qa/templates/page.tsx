"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, X, ChevronDown, ChevronUp, Trash2, RefreshCw } from "lucide-react";

type TemplateItem = { id: string; label: string; check_type: string; sort_order: number };
type Template = { id: string; name: string; status: string; project_id: string | null; created_at?: string };
type Project = { id: string; name: string };

export default function QaTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, TemplateItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [checkItems, setCheckItems] = useState<string[]>(["", ""]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qa/templates", { credentials: "include" });
      const json = await res.json();
      setTemplates(json.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/projects?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => setProjects(json.projects || []));
    load();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!expandedItems[id]) {
      setLoadingItems(id);
      try {
        const res = await fetch(`/api/qa/templates/${id}`, { credentials: "include" });
        const json = await res.json();
        setExpandedItems((prev) => ({ ...prev, [id]: json.items || [] }));
      } finally {
        setLoadingItems(null);
      }
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/qa/templates/${id}`, { method: "DELETE", credentials: "include" });
      setExpandedItems((prev) => { const n = { ...prev }; delete n[id]; return n; });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const addCheckItem = () => setCheckItems((prev) => [...prev, ""]);
  const removeCheckItem = (i: number) => setCheckItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateCheckItem = (i: number, val: string) =>
    setCheckItems((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Template name is required";
    const valid = checkItems.map((s) => s.trim()).filter(Boolean);
    if (valid.length === 0) e.items = "Add at least one checklist item";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createTemplate = async () => {
    if (!validate()) return;
    const validItems = checkItems.map((s) => s.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      await fetch("/api/qa/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          project_id: projectId || null,
          items: validItems.map((label) => ({ label, check_type: "boolean" })),
        }),
      });
      setName(""); setProjectId(""); setCheckItems(["", ""]); setErrors({});
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const projectName = (id: string | null | undefined) =>
    id ? projects.find((p) => p.id === id)?.name || "—" : "General (all projects)";

  const displayed = filterProject
    ? templates.filter((t) => t.project_id === filterProject || !t.project_id)
    : templates;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Create inspection checklists for quality control</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setErrors({}); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Create Inspection Template</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                placeholder="e.g. Foundation Safety Check"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project (optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— All projects —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Items *</label>
            <div className="space-y-2">
              {checkItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Check item ${i + 1}…`}
                    value={item}
                    onChange={(e) => { updateCheckItem(i, e.target.value); setErrors((p) => ({ ...p, items: "" })); }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {checkItems.length > 1 && (
                    <button
                      onClick={() => removeCheckItem(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.items && <p className="text-xs text-red-600 mt-1">{errors.items}</p>}
            <button
              onClick={addCheckItem}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Add item
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={createTemplate}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating…" : "Create Template"}
            </button>
            <button
              onClick={() => { setShowForm(false); setErrors({}); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600 font-medium flex-shrink-0">Filter by project:</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="flex-1 min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All templates</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {filterProject && (
            <button
              onClick={() => setFilterProject("")}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Templates list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading templates…</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {filterProject ? "No templates for this project." : "No templates yet. Create your first checklist."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((t) => (
              <div key={t.id}>
                {/* Template row */}
                <div className="flex items-center hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => toggleExpand(t.id)}
                    className="flex-1 flex items-center justify-between px-5 py-4 text-left min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{projectName(t.project_id)}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {t.status}
                      </span>
                      {t.created_at && (
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      )}
                      {expandedId === t.id
                        ? <ChevronUp size={15} className="text-gray-400" />
                        : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    disabled={deletingId !== null}
                    title="Delete template"
                    className="p-3 mr-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {deletingId === t.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* Expanded checklist */}
                {expandedId === t.id && (
                  <div className="px-5 pb-4 border-t border-gray-100 bg-gray-50/50">
                    {loadingItems === t.id ? (
                      <p className="text-xs text-gray-500 py-3">Loading checklist…</p>
                    ) : (expandedItems[t.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 italic">No checklist items found.</p>
                    ) : (
                      <ul className="space-y-1.5 pt-3">
                        {(expandedItems[t.id] || []).map((item, idx) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded border border-gray-300 bg-white flex-shrink-0 mt-0.5" />
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
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
