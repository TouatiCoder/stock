"use client";

import { useEffect, useMemo, useState } from "react";

type MaterialOption = {
  id: string;
  name: string;
  unitPrice: number | null;
  unit: string;
  category: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type SavedCalc = {
  id: string;
  output: {
    totalWeightKg: number;
    estimatedCost: number | null;
  };
  createdAt: string;
};

export default function SteelCalculatorClient() {
  const [diameter, setDiameter] = useState("12");
  const [length, setLength] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [notes, setNotes] = useState("");

  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedMaterial = materials.find((item) => item.id === materialId) || null;

  const calculation = useMemo(() => {
    const d = Number(diameter) || 0;
    const l = Number(length) || 0;
    const q = Number(quantity) || 0;
    const unitWeightKgPerM = d > 0 ? (d * d) / 162 : 0;
    const totalWeightKg = unitWeightKgPerM * l * q;
    const estimatedCost = selectedMaterial?.unitPrice != null ? totalWeightKg * selectedMaterial.unitPrice : null;
    return {
      unitWeightKgPerM,
      totalWeightKg,
      estimatedCost,
    };
  }, [diameter, length, quantity, selectedMaterial?.unitPrice]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, materialsRes, savedRes] = await Promise.all([
        fetch("/api/tools/projects", { credentials: "include", cache: "no-store" }),
        fetch("/api/materials/library", { credentials: "include", cache: "no-store" }),
        fetch("/api/tools/calculations?type=steel", { credentials: "include", cache: "no-store" }),
      ]);

      if (!projectsRes.ok || !materialsRes.ok || !savedRes.ok) {
        throw new Error("Failed to load steel calculator dependencies");
      }

      const projectsBody = await projectsRes.json();
      const materialsBody = await materialsRes.json();
      const savedBody = await savedRes.json();

      const materialItems: MaterialOption[] = (materialsBody.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        unit: item.unit,
        category: item.category,
      }));

      setProjects(projectsBody.items || []);
      setMaterials(materialItems);
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load steel calculator");
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
        toolType: "steel",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          barDiameterMm: Number(diameter) || 0,
          barLengthM: Number(length) || 0,
          quantity: Number(quantity) || 0,
          materialId: materialId || null,
        },
        output: {
          totalWeightKg: calculation.totalWeightKg,
          estimatedCost: calculation.estimatedCost,
        },
      };

      const res = await fetch("/api/tools/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to save steel calculation");
      }

      setSaveMessage("Steel calculation saved successfully.");
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save steel calculation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Steel Calculator</h1>
        <p className="text-sm text-gray-600">Estimate rebar weight and optional material cost.</p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Inputs</h2>
          <input className="w-full rounded border p-2" placeholder="Bar diameter (mm)" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Length per bar (m)" value={length} onChange={(e) => setLength(e.target.value)} />
          <input className="w-full rounded border p-2" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

          <select className="w-full rounded border p-2" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">Material price source (optional)</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} {material.unitPrice != null ? `- ${material.unitPrice.toFixed(2)}/${material.unit}` : "- no price"}
              </option>
            ))}
          </select>

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
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Calculation"}
          </button>
        </div>

        <div className="rounded border bg-gray-50 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Results</h2>
          <p className="text-sm">Unit Weight: <span className="font-semibold">{calculation.unitWeightKgPerM.toFixed(4)} kg/m</span></p>
          <p className="text-sm">Total Weight: <span className="font-semibold">{calculation.totalWeightKg.toFixed(2)} kg</span></p>
          <p className="text-sm">
            Estimated Cost:{" "}
            <span className="font-semibold">
              {calculation.estimatedCost != null ? calculation.estimatedCost.toFixed(2) : "N/A (material price unavailable)"}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">Saved Steel Calculations</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">Loading...</p> : null}
        {!isLoading && saved.length === 0 ? <p className="mt-2 text-sm text-gray-500">No saved calculations yet.</p> : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="text-xs text-gray-600">
                  Weight {item.output.totalWeightKg.toFixed(2)} kg
                  {item.output.estimatedCost != null ? `, Cost ${item.output.estimatedCost.toFixed(2)}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

