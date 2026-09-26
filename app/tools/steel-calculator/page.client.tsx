"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeHaWeight, collectHaWeightFieldErrors, HA_DIAMETERS_MM } from "@/lib/calculators/steel";
import { CalculationError, parseNumberInput, type CalculationErrorCode } from "@/lib/calculators/validation";
import {
  buildToolProjectsUrl,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  type ToolProjectOption,
} from "@/lib/calculators/project-link";

type MaterialOption = {
  id: string;
  name: string;
  unitPrice: number | null;
  unit: string;
  category: string | null;
};

type SavedCalc = {
  id: string;
  output: {
    totalWeightKg: number;
    estimatedCost: number | null;
  };
  createdAt: string;
};

/** Shown in the results panel while an input is still missing or invalid. */
const EMPTY_RESULT = "\u2014";

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

/**
 * `embedded` renders the calculator as a section of another page (the Calcul
 * d'acier tabs) instead of a standalone page: the outer page padding and the
 * page-level <h1> are left to the host, everything else is identical.
 */
export default function SteelCalculatorClient({ embedded = false }: { embedded?: boolean } = {}) {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();
  const [diameter, setDiameter] = useState<string>("12");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState("");
  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [notes, setNotes] = useState("");

  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [projects, setProjects] = useState<ToolProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  /** Field messages are shown once the user has tried to calculate/save. */
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const resolvedLocale = LOCALE_MAP[locale];

  const text = (key: string, fallback: string) => {
    const translated = tCommon(key);
    return translated === key ? fallback : translated;
  };

  const errorCodeText = (code: CalculationErrorCode) => {
    if (code === "required") return text("calcErrorRequired", "This field is required.");
    if (code === "negative") return text("calcErrorNegative", "Value cannot be negative.");
    if (code === "not-integer") return text("calcErrorNotInteger", "Enter a whole number.");
    return text("calcErrorInvalid", "Enter a valid number.");
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
    try {
      const result = computeHaWeight({
        diameterMm: parseNumberInput(diameter),
        lengthM: parseNumberInput(length),
        quantity: parseNumberInput(quantity),
      });
      const estimatedCost = selectedMaterial?.unitPrice != null ? result.totalWeightKg * selectedMaterial.unitPrice : null;
      return { ok: true as const, value: { ...result, estimatedCost } };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  }, [diameter, length, quantity, selectedMaterial?.unitPrice]);

  /** One message per invalid input; the optional material/project/notes are never flagged. */
  const fieldErrors = useMemo(
    () =>
      collectHaWeightFieldErrors({
        diameterMm: parseNumberInput(diameter),
        lengthM: parseNumberInput(length),
        quantity: parseNumberInput(quantity),
      }),
    [diameter, length, quantity],
  );

  const fieldError = (field: "diameterMm" | "lengthM" | "quantity") =>
    showFieldErrors ? fieldErrors[field] : undefined;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, materialsRes, savedRes] = await Promise.all([
        fetch(buildToolProjectsUrl("company"), { credentials: "include", cache: "no-store" }),
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

      setProjects(mapToolProjectOptions(projectsBody));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setError(null);
    setSaveMessage(null);
  }, [locale]);

  const handleSave = async () => {
    if (!calculation.ok) {
      // Missing/invalid inputs are reported under the field they belong to.
      setShowFieldErrors(true);
      setSaveMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setError(null);

      const payload = {
        toolType: "steel",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          barDiameterMm: parseNumberInput(diameter) || 0,
          barLengthM: parseNumberInput(length) || 0,
          quantity: parseNumberInput(quantity) || 0,
          materialId: materialId || null,
        },
        output: {
          totalWeightKg: calculation.value.totalWeightKg,
          estimatedCost: calculation.value.estimatedCost,
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

  const unitWeightText = calculation.ok
    ? formatNumber(calculation.value.unitWeightKgPerM, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    : "-";
  const totalWeightText = calculation.ok
    ? formatNumber(calculation.value.totalWeightKg, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "-";
  const estimatedCostText =
    calculation.ok && calculation.value.estimatedCost != null
      ? formatNumber(calculation.value.estimatedCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : text("steelCostUnavailable", "N/A (material price unavailable)");

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"} dir={embedded ? undefined : dir}>
      <div>
        {embedded ? null : (
          <h1 className="text-2xl font-semibold text-gray-900">{text("steelPageTitle", "Poids HA (Rebar Weight)")}</h1>
        )}
        <p className="text-sm text-gray-600">
          {text(
            "steelPageDescription",
            "Calculate the weight of high-adherence (HA) reinforcement bars from diameter, length and quantity, with an optional material cost estimate.",
          )}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{text("steelInputsTitle", "Inputs")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="steel-diameter">{text("steelDiameterPlaceholder", "Bar diameter (mm)")}</Label>
              <Select value={diameter} onValueChange={setDiameter}>
                <SelectTrigger className="w-full" id="steel-diameter" aria-invalid={fieldError("diameterMm") ? true : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HA_DIAMETERS_MM.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {`HA${d} (${d} mm)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("diameterMm") ? (
                <p id="steel-diameter-error" className="text-sm text-red-600">
                  {errorCodeText(fieldError("diameterMm")!)}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="steel-length">{text("steelLengthPlaceholder", "Length per bar (m)")}</Label>
              <Input
                id="steel-length"
                inputMode="decimal"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                aria-invalid={fieldError("lengthM") ? true : undefined}
                aria-describedby={fieldError("lengthM") ? "steel-length-error" : undefined}
                className={fieldError("lengthM") ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {fieldError("lengthM") ? (
                <p id="steel-length-error" className="text-sm text-red-600">
                  {errorCodeText(fieldError("lengthM")!)}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="steel-quantity">{text("steelQuantityPlaceholder", "Quantity")}</Label>
              <Input
                id="steel-quantity"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-invalid={fieldError("quantity") ? true : undefined}
                aria-describedby={fieldError("quantity") ? "steel-quantity-error" : undefined}
                className={fieldError("quantity") ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {fieldError("quantity") ? (
                <p id="steel-quantity-error" className="text-sm text-red-600">
                  {errorCodeText(fieldError("quantity")!)}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>{text("steelMaterialPlaceholder", "Material price source (optional)")}</Label>
              <Select value={materialId || "__none__"} onValueChange={(v) => setMaterialId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{text("steelMaterialPlaceholder", "Material price source (optional)")}</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.unitPrice != null
                        ? formatMessage("steelMaterialOptionWithPrice", "{name} - {price}/{unit}", {
                            name: material.name,
                            price: formatNumber(material.unitPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                            unit: material.unit,
                          })
                        : formatMessage("steelMaterialOptionWithoutPrice", "{name} - {noPrice}", {
                            name: material.name,
                            noPrice: text("steelNoPrice", "no price"),
                          })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{text("steelProjectPlaceholder", "Link to project (optional)")}</Label>
              <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{text("steelProjectPlaceholder", "Link to project (optional)")}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {formatProjectOptionLabel(project)}
                    </SelectItem>
                  ))}
                  {!isLoading && projects.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {text("toolsNoProjectsAvailable", "No project available")}
                    </p>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{text("steelNotesPlaceholder", "Notes (optional)")}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent p-2 text-sm shadow-xs"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? text("steelSaving", "Saving...") : text("steelSaveButton", "Save Calculation")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text("steelResultsTitle", "Results")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              {text("steelUnitWeight", "Unit Weight")}:{" "}
              <span className="font-semibold">{calculation.ok ? `${unitWeightText} kg/m` : EMPTY_RESULT}</span>
            </p>
            <p className="text-sm">
              {text("steelTotalWeight", "Total Weight")}:{" "}
              <span className="font-semibold">{calculation.ok ? `${totalWeightText} kg` : EMPTY_RESULT}</span>
            </p>
            <p className="text-sm">
              {text("steelEstimatedCost", "Estimated Cost")}:{" "}
              <span className="font-semibold">{calculation.ok ? estimatedCostText : EMPTY_RESULT}</span>
            </p>
          </CardContent>
        </Card>
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
                        weight: formatNumber(item.output.totalWeightKg, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        cost: formatNumber(item.output.estimatedCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      })
                    : formatMessage("steelSavedSummary", "Weight {weight} kg", {
                        weight: formatNumber(item.output.totalWeightKg, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
