"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";

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

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

export default function SteelCalculatorClient() {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();
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

  const resolvedLocale = LOCALE_MAP[locale];

  const text = (key: string, fallback: string) => {
    const translated = tCommon(key);
    return translated === key ? fallback : translated;
  };

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(resolvedLocale, options).format(value);

  const formatMessage = (key: string, fallback: string, replacements: Record<string, string>) => {
    let message = text(key, fallback);
    for (const [token, replacement] of Object.entries(replacements)) {
      message = message.replace(`{${token}}`, replacement);
    }
    return message;
  };

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
        throw new Error(text("steelLoadingError", "Failed to load steel calculator dependencies"));
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
      setError(err?.message || text("steelLoadingFallbackError", "Failed to load steel calculator"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setError(null);
    setSaveMessage(null);
  }, [locale]);

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
        throw new Error(body.error || text("steelSavingError", "Failed to save steel calculation"));
      }

      setSaveMessage(text("steelSavedMessage", "Steel calculation saved successfully."));
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || text("steelSavingError", "Failed to save steel calculation"));
    } finally {
      setIsSaving(false);
    }
  };

  const unitWeightText = formatNumber(calculation.unitWeightKgPerM, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
  const totalWeightText = formatNumber(calculation.totalWeightKg, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const estimatedCostText = calculation.estimatedCost != null
    ? formatNumber(calculation.estimatedCost, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : text("steelCostUnavailable", "N/A (material price unavailable)");

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{text("steelPageTitle", "Steel Calculator")}</h1>
        <p className="text-sm text-gray-600">{text("steelPageDescription", "Estimate rebar weight and optional material cost.")}</p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">{text("steelInputsTitle", "Inputs")}</h2>
          <input
            className="w-full rounded border p-2"
            placeholder={text("steelDiameterPlaceholder", "Bar diameter (mm)")}
            value={diameter}
            onChange={(e) => setDiameter(e.target.value)}
          />
          <input
            className="w-full rounded border p-2"
            placeholder={text("steelLengthPlaceholder", "Length per bar (m)")}
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
          <input
            className="w-full rounded border p-2"
            placeholder={text("steelQuantityPlaceholder", "Quantity")}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <select className="w-full rounded border p-2" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">{text("steelMaterialPlaceholder", "Material price source (optional)")}</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.unitPrice != null
                  ? formatMessage("steelMaterialOptionWithPrice", "{name} - {price}/{unit}", {
                      name: material.name,
                      price: formatNumber(material.unitPrice, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }),
                      unit: material.unit,
                    })
                  : formatMessage("steelMaterialOptionWithoutPrice", "{name} - {noPrice}", {
                      name: material.name,
                      noPrice: text("steelNoPrice", "no price"),
                    })}
              </option>
            ))}
          </select>

          <select className="w-full rounded border p-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{text("steelProjectPlaceholder", "Link to project (optional)")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status})
              </option>
            ))}
          </select>

          <textarea
            className="w-full rounded border p-2"
            rows={3}
            placeholder={text("steelNotesPlaceholder", "Notes (optional)")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? text("steelSaving", "Saving...") : text("steelSaveButton", "Save Calculation")}
          </button>
        </div>

        <div className="rounded border bg-gray-50 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">{text("steelResultsTitle", "Results")}</h2>
          <p className="text-sm">
            {text("steelUnitWeight", "Unit Weight")}: <span className="font-semibold">{unitWeightText} kg/m</span>
          </p>
          <p className="text-sm">
            {text("steelTotalWeight", "Total Weight")}: <span className="font-semibold">{totalWeightText} kg</span>
          </p>
          <p className="text-sm">
            {text("steelEstimatedCost", "Estimated Cost")}: <span className="font-semibold">{estimatedCostText}</span>
          </p>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">{text("steelSavedTitle", "Saved Steel Calculations")}</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">{text("loading", "Loading...")}</p> : null}
        {!isLoading && saved.length === 0 ? <p className="mt-2 text-sm text-gray-500">{text("steelEmptySaved", "No saved calculations yet.")}</p> : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">{new Date(item.createdAt).toLocaleString(resolvedLocale)}</p>
                <p className="text-xs text-gray-600">
                  {item.output.estimatedCost != null
                    ? formatMessage("steelSavedSummaryWithCost", "Weight {weight} kg, Cost {cost}", {
                        weight: formatNumber(item.output.totalWeightKg, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                        cost: formatNumber(item.output.estimatedCost, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      })
                    : formatMessage("steelSavedSummary", "Weight {weight} kg", {
                        weight: formatNumber(item.output.totalWeightKg, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      })}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
