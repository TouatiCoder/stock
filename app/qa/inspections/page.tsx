"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Plus, CheckCircle, Clock, XCircle, Search, RefreshCw } from "lucide-react";
import { PrintButton } from "@/components/print/PrintButton";
import { PrintHeader } from "@/components/print/PrintHeader";

type Inspection = { id: string; title: string; status: string; project_id: string; template_id: string; created_at?: string };
type Project = { id: string; name: string };
type Template = { id: string; name: string; project_id?: string | null };
type Tab = "all" | "draft" | "submitted" | "approved" | "rejected";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  submitted: <Clock size={11} />,
  approved: <CheckCircle size={11} />,
  rejected: <XCircle size={11} />,
};

export default function QaInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [filterProject, setFilterProject] = useState("");
  const [search, setSearch] = useState("");

  const [projectId, setProjectId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qa/inspections", { credentials: "include" });
      const json = await res.json();
      setInspections(json.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      const [projRes, tplRes] = await Promise.all([
        fetch("/api/projects?limit=200", { credentials: "include" }),
        fetch("/api/qa/templates", { credentials: "include" }),
      ]);
      const [projJson, tplJson] = await Promise.all([projRes.json(), tplRes.json()]);
      setProjects(projJson.projects || []);
      setTemplates(tplJson.items || []);
    };
    loadOptions();
    load();
  }, []);

  const filteredTemplates = projectId
    ? templates.filter((t) => !t.project_id || t.project_id === projectId)
    : templates;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Select a project";
    if (!templateId) e.templateId = "Select a template";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createInspection = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await fetch("/api/qa/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_id: projectId,
          template_id: templateId,
          title: title.trim() || "Site inspection",
        }),
      });
      setProjectId(""); setTemplateId(""); setTitle(""); setErrors({});
      setShowForm(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const submitInspection = async (id: string) => {
    setActing(id + "_submit");
    try {
      await fetch(`/api/qa/inspections/${id}/submit`, { method: "POST", credentials: "include" });
      await load();
    } finally {
      setActing(null);
    }
  };

  const approveInspection = async (id: string, decision: "approved" | "rejected") => {
    setActing(id + "_" + decision);
    try {
      await fetch(`/api/qa/inspections/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decision }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || "—";
  const templateName = (id: string) => templates.find((t) => t.id === id)?.name || "—";

  const counts: Record<Tab, number> = {
    all: inspections.length,
    draft: inspections.filter((i) => i.status === "draft").length,
    submitted: inspections.filter((i) => i.status === "submitted").length,
    approved: inspections.filter((i) => i.status === "approved").length,
    rejected: inspections.filter((i) => i.status === "rejected").length,
  };

  const displayed = inspections
    .filter((i) => tab === "all" || i.status === tab)
    .filter((i) => !filterProject || i.project_id === filterProject)
    .filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase()));

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "submitted", label: "Submitted" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const inputCls = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <PrintHeader
        title="QA Inspections"
        subtitle={`Quality assurance inspection log — ${inspections.length} inspection${inspections.length !== 1 ? "s" : ""}`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track quality control inspections</p>
        </div>
        <div className="no-print flex items-center gap-2">
          <PrintButton />
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
            New Inspection
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="no-print rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Create Inspection</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setTemplateId(""); setErrors((p) => ({ ...p, projectId: "" })); }}
                className={inputCls("projectId")}
              >
                <option value="">— Select project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.projectId && <p className="text-xs text-red-600 mt-1">{errors.projectId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template *</label>
              <select
                value={templateId}
                onChange={(e) => { setTemplateId(e.target.value); setErrors((p) => ({ ...p, templateId: "" })); }}
                disabled={filteredTemplates.length === 0}
                className={inputCls("templateId") + " disabled:bg-gray-50 disabled:text-gray-400"}
              >
                <option value="">— Select template —</option>
                {filteredTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.templateId && <p className="text-xs text-red-600 mt-1">{errors.templateId}</p>}
              {filteredTemplates.length === 0 && projectId && (
                <p className="text-xs text-amber-600 mt-1">No templates available. Create one first.</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection title (optional)</label>
              <input
                type="text"
                placeholder="e.g. Foundation inspection — Block A"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={createInspection}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating…" : "Create Inspection"}
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

      {/* Filters */}
      <div className="no-print flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search inspections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Status tabs */}
        <div className="no-print flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? "text-blue-600 bg-white border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  tab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading inspections…</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {search || filterProject ? "No matching inspections." : "No inspections yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((i) => (
              <div key={i.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{i.title}</p>
                    <p className="text-xs text-gray-500">
                      {projectName(i.project_id)} · {templateName(i.template_id)}
                    </p>
                    {i.created_at && (
                      <p className="text-xs text-gray-400">{new Date(i.created_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[i.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_ICON[i.status]}
                      <span className="capitalize">{i.status}</span>
                    </span>

                    {i.status === "draft" && (
                      <button
                        onClick={() => submitInspection(i.id)}
                        disabled={acting !== null}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {acting === i.id + "_submit" ? "…" : "Submit"}
                      </button>
                    )}

                    {i.status === "submitted" && (
                      <>
                        <button
                          onClick={() => approveInspection(i.id, "approved")}
                          disabled={acting !== null}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {acting === i.id + "_approved" ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => approveInspection(i.id, "rejected")}
                          disabled={acting !== null}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {acting === i.id + "_rejected" ? "…" : "Reject"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {inspections.length} inspection{inspections.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
