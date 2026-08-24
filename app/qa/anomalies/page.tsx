"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, User, Search, RefreshCw, X } from "lucide-react";

type Anomaly = { id: string; title: string; status: string; severity: string; project_id?: string; assigned_to: string | null; created_at?: string };
type CompanyUser = { id: string; email: string; firstName: string; lastName: string; role: string };
type Project = { id: string; name: string };
type StatusFilter = "all" | "open" | "closed";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  major: "bg-orange-100 text-orange-800",
  minor: "bg-yellow-100 text-yellow-800",
  observation: "bg-blue-100 text-blue-800",
};

const SEVERITIES = ["critical", "major", "minor", "observation"] as const;

export default function QaAnomaliesPage() {
  const [items, setItems] = useState<Anomaly[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [search, setSearch] = useState("");

  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignAction, setAssignAction] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qa/anomalies", { credentials: "include" });
      const json = await res.json();
      setItems(json.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      const [userRes, projRes] = await Promise.all([
        fetch("/api/company/users", { credentials: "include" }),
        fetch("/api/projects?limit=200", { credentials: "include" }),
      ]);
      const [userJson, projJson] = await Promise.all([userRes.json(), projRes.json()]);
      setUsers(Array.isArray(userJson) ? userJson : []);
      setProjects(projJson.projects || []);
    };
    loadOptions();
    load();
  }, []);

  const assignCorrective = async (anomalyId: string) => {
    if (!assignUserId || !assignAction) return;
    setActing(anomalyId + "_assign");
    try {
      await fetch(`/api/qa/anomalies/${anomalyId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assigned_to: assignUserId, action_text: assignAction }),
      });
      setAssignTarget(null); setAssignUserId(""); setAssignAction("");
      await load();
    } finally {
      setActing(null);
    }
  };

  const close = async (anomalyId: string) => {
    setActing(anomalyId + "_close");
    try {
      await fetch(`/api/qa/anomalies/${anomalyId}/close`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const projectName = (id?: string) => id ? projects.find((p) => p.id === id)?.name || "—" : "—";
  const resolveUserName = (id: string | null) => {
    if (!id) return null;
    const u = users.find((u) => u.id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() || u.email : null;
  };

  const displayed = items
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .filter((a) => !severityFilter || a.severity === severityFilter)
    .filter((a) => !filterProject || a.project_id === filterProject)
    .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  const openCount = items.filter((a) => a.status === "open").length;
  const closedCount = items.filter((a) => a.status === "closed").length;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Anomalies</h1>
          <p className="text-sm text-gray-500 mt-1">Track and resolve quality control anomalies</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Refresh"
          className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{items.length}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-red-600">Open</p>
            <p className="text-2xl font-bold text-red-700 mt-0.5">{openCount}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-green-600">Closed</p>
            <p className="text-2xl font-bold text-green-700 mt-0.5">{closedCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anomalies…"
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

      {/* Severity + status chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-500">Status:</span>
        {(["all", "open", "closed"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="text-xs font-medium text-gray-500 ml-3">Severity:</span>
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(severityFilter === sev ? "" : sev)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              severityFilter === sev
                ? `${SEVERITY_STYLE[sev]} border-current`
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {sev}
          </button>
        ))}
        {(severityFilter || statusFilter !== "all" || filterProject || search) && (
          <button
            onClick={() => { setSeverityFilter(""); setStatusFilter("all"); setFilterProject(""); setSearch(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 ml-1"
          >
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading anomalies…</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              {search || severityFilter || statusFilter !== "all" ? "No matching anomalies." : "No open anomalies."}
            </p>
            {!search && !severityFilter && statusFilter === "all" && (
              <p className="text-xs text-gray-400 mt-1">All quality issues have been resolved.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((a) => {
              const assignee = resolveUserName(a.assigned_to);
              return (
                <div key={a.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className={`flex-shrink-0 ${a.status === "closed" ? "text-gray-400" : "text-orange-500"}`} />
                        <p className={`text-sm font-semibold truncate ${a.status === "closed" ? "text-gray-500" : "text-gray-900"}`}>
                          {a.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 ml-5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[a.severity] || "bg-gray-100 text-gray-700"}`}>
                          {a.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "open" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {a.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Project: {projectName(a.project_id)}
                        </span>
                        {assignee && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <User size={10} /> {assignee}
                          </span>
                        )}
                        {a.created_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {a.status !== "closed" && (
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setAssignTarget(assignTarget === a.id ? null : a.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 text-xs font-medium hover:bg-blue-50 transition-colors"
                        >
                          <User size={12} />
                          Assign
                        </button>
                        <button
                          onClick={() => close(a.id)}
                          disabled={acting !== null}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {acting === a.id + "_close" ? "…" : "Close"}
                        </button>
                      </div>
                    )}

                    {a.status === "closed" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">
                        Resolved
                      </span>
                    )}
                  </div>

                  {/* Assignment panel */}
                  {assignTarget === a.id && (
                    <div className="ml-5 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Assign Corrective Action</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Assign to *</label>
                          <select
                            value={assignUserId}
                            onChange={(e) => setAssignUserId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">— Select team member —</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {`${u.firstName} ${u.lastName}`.trim() || u.email} ({u.role})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Action required *</label>
                          <input
                            type="text"
                            placeholder="Describe the corrective action…"
                            value={assignAction}
                            onChange={(e) => setAssignAction(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => assignCorrective(a.id)}
                          disabled={acting !== null || !assignUserId || !assignAction}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {acting === a.id + "_assign" ? "Assigning…" : "Confirm Assignment"}
                        </button>
                        <button
                          onClick={() => { setAssignTarget(null); setAssignUserId(""); setAssignAction(""); }}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {displayed.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {items.length} anomal{items.length !== 1 ? "ies" : "y"}
          </div>
        )}
      </div>
    </div>
  );
}
