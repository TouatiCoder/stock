"use client";

import { useEffect, useState } from "react";

type Inspection = { id: string; title: string; status: string; project_id: string; template_id: string };
type Result = { id: string; result_status: string; notes: string | null };

export default function QaInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [projectId, setProjectId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const loadInspections = async () => {
    const res = await fetch("/api/qa/inspections", { credentials: "include" });
    const json = await res.json();
    setInspections(json.items || []);
  };

  useEffect(() => { loadInspections(); }, []);

  const createInspection = async () => {
    await fetch("/api/qa/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project_id: projectId, template_id: templateId, title: "Site inspection" }),
    });
    await loadInspections();
  };

  const loadResults = async (id: string) => {
    setSelected(id);
    const res = await fetch(`/api/qa/inspections/${id}/results`, { credentials: "include" });
    const json = await res.json();
    setResults(json.items || []);
  };

  const saveResults = async () => {
    await fetch(`/api/qa/inspections/${selected}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ results }),
    });
  };

  const submit = async () => {
    await fetch(`/api/qa/inspections/${selected}/submit`, { method: "POST", credentials: "include" });
    await loadInspections();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Inspection Execution</h1>
      <div className="rounded border p-4 bg-white space-y-2">
        <input className="border p-2 w-full" placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Template ID" value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={createInspection}>Create inspection</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-medium mb-2">Inspections</h2>
          <ul className="space-y-1 text-sm">
            {inspections.map((i) => (
              <li key={i.id}>
                <button className="underline" onClick={() => loadResults(i.id)}>{i.title}</button> ({i.status})
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border p-4 bg-white">
          <h2 className="font-medium mb-2">Results</h2>
          {results.map((r, idx) => (
            <div key={r.id} className="mb-2 border p-2 rounded">
              <select
                className="border p-1"
                value={r.result_status}
                onChange={(e) => {
                  const next = [...results];
                  next[idx] = { ...next[idx], result_status: e.target.value };
                  setResults(next);
                }}
              >
                <option value="pending">pending</option>
                <option value="pass">pass</option>
                <option value="fail">fail</option>
              </select>
              <input
                className="border p-1 ml-2"
                value={r.notes || ""}
                onChange={(e) => {
                  const next = [...results];
                  next[idx] = { ...next[idx], notes: e.target.value };
                  setResults(next);
                }}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-gray-200" onClick={saveResults} disabled={!selected}>Save results</button>
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={submit} disabled={!selected}>Submit review</button>
          </div>
        </div>
      </div>
    </div>
  );
}