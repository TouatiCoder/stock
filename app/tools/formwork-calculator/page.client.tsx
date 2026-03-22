"use client";

import { useEffect, useMemo, useState } from "react";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type SavedCalc = {
  id: string;
  output: {
    surfaceAreaM2: number;
    plywoodSheets: number;
  };
  project?: { id: string; name: string } | null;
  createdAt: string;
};

const PLYWOOD_SHEET_M2 = 2.98;

export default function FormworkCalculatorClient() {
  const [length, setLength] = useState("0");
  const [width, setWidth] = useState("0");
  const [height, setHeight] = useState("0");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const calculation = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const surfaceAreaM2 = Math.max(0, 2 * (l * h + w * h));
    const plywoodSheets = Math.ceil(surfaceAreaM2 / PLYWOOD_SHEET_M2);
    return {
      surfaceAreaM2,
      plywoodSheets,
    };
  }, [height, length, width]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, savedRes] = await Promise.all([
        fetch("/api/tools/projects", { credentials: "include", cache: "no-store" }),
        fetch("/api/tools/calculations?type=formwork", { credentials: "include", cache: "no-store" }),
      ]);

      if (!projectsRes.ok || !savedRes.ok) {
        throw new Error("Failed to load formwork calculator data");
      }

      const projectsBody = await projectsRes.json();
      const savedBody = await savedRes.json();
      setProjects(projectsBody.items || []);
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load formwork calculator");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      setError(null);

      const payload = {
        toolType: "formwork",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          length: Number(length) || 0,
          width: Number(width) || 0,
          height: Number(height) || 0,
        },
        output: calculation,
      };

      const res = await fetch("/api/tools/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to save formwork calculation");
      }

      setSaveMessage("Formwork calculation saved to project notes.");
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save formwork calculation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Formwork Calculator</h1>
        <p className="text-sm text-gray-600">Calculate formwork area and estimated plywood sheet count.</p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Inputs</h2>
          <input className="w-full rounded border p-2" placeholder="Length (m)" value={length} onChange={(e) => setLength(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Width (m)" value={width} onChange={(e) => setWidth(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Height (m)" value={height} onChange={(e) => setHeight(e.target.value)} />

          <select className="w-full rounded border p-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Link to project (optional)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status})
              </option>
            ))}
          </select>

          <textarea
            className="w-full rounded border p-2"
            rows={3}
            placeholder="Technical notes to save with this calculation"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save to Project Notes"}
          </button>
        </div>

        <div className="rounded border bg-gray-50 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Results</h2>
          <p className="text-sm">Surface Area: <span className="font-semibold">{calculation.surfaceAreaM2.toFixed(2)} m2</span></p>
          <p className="text-sm">Plywood Sheets: <span className="font-semibold">{calculation.plywoodSheets}</span></p>
          <p className="text-xs text-gray-500">Based on sheet size 1.22m x 2.44m ({PLYWOOD_SHEET_M2} m2).</p>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">Saved Formwork Calculations</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">Loading...</p> : null}
        {!isLoading && saved.length === 0 ? <p className="mt-2 text-sm text-gray-500">No saved calculations yet.</p> : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">
                  {item.project?.name || "No project"} - {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  Area {item.output.surfaceAreaM2.toFixed(2)} m2, Sheets {item.output.plywoodSheets}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

