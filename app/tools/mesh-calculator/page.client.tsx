"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeMeshPanels, MESH_TYPES, type MeshOverlap } from "@/lib/calculators/mesh";
import { CalculationError, parseNumberInput, type CalculationErrorCode } from "@/lib/calculators/validation";
import {
  buildToolProjectsUrl,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  type ToolProjectOption,
} from "@/lib/calculators/project-link";

type SavedCalc = {
  id: string;
  output: {
    panelCount: number;
    totalWeightKg: number;
  };
  input: { meshTypeId?: string };
  project?: { id: string; name: string } | null;
  createdAt: string;
};

/** Shown in the results panel while an input is still missing or invalid. */
const EMPTY_RESULT = "\u2014";

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

const OVERLAP_OPTIONS: MeshOverlap[] = ["none", "1", "2"];

/**
 * `embedded` renders the calculator as a section of another page (the Calcul
 * d'acier tabs) instead of a standalone page: the outer page padding and the
 * page-level <h1> are left to the host, everything else is identical.
 */
export default function MeshCalculatorClient({ embedded = false }: { embedded?: boolean } = {}) {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();

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

  const overlapLabels: Record<MeshOverlap, string> = {
    none: text("meshOverlapNone", "None"),
    "1": text("meshOverlap1", "1 mesh square"),
    "2": text("meshOverlap2", "2 mesh squares"),
  };

  const resolvedLocale = LOCALE_MAP[locale];
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(resolvedLocale, options).format(value);
  const formatMessage = (key: string, fallback: string, replacements: Record<string, string>) => {
    let message = text(key, fallback);
    for (const [token, replacement] of Object.entries(replacements)) {
      message = message.replace(`{${token}}`, replacement);
    }
    return message;
  };

  const [meshTypeId, setMeshTypeId] = useState(MESH_TYPES[2]?.id || MESH_TYPES[0].id); // default ST20
  const [surfaceM2, setSurfaceM2] = useState("");
  const [overlap, setOverlap] = useState<MeshOverlap>("none");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  const [projects, setProjects] = useState<ToolProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  /** Field messages are shown once the user has tried to calculate/save. */
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const structuralTypes = MESH_TYPES.filter((m) => m.category === "structural");
  const antifissurationTypes = MESH_TYPES.filter((m) => m.category === "antifissuration");

  const calculation = useMemo(() => {
    try {
      const result = computeMeshPanels({
        meshTypeId,
        surfaceM2: parseNumberInput(surfaceM2),
        overlap,
      });
      return { ok: true as const, value: result };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  }, [meshTypeId, surfaceM2, overlap]);

  /**
   * Surface is the only required numeric input (mesh type and overlap are
   * selects with a default). The overlap-vs-panel-width conflict is reported
   * under the overlap select, the input it comes from. The optional project
   * and notes are never flagged.
   */
  const surfaceError: CalculationErrorCode | null =
    !calculation.ok && calculation.error instanceof CalculationError && calculation.error.field === "surfaceM2"
      ? calculation.error.code
      : null;

  const overlapError: string | null =
    !calculation.ok && calculation.error instanceof RangeError ? calculation.error.message : null;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, savedRes] = await Promise.all([
        fetch(buildToolProjectsUrl("company"), { credentials: "include", cache: "no-store" }),
        fetch("/api/tools/calculations?type=mesh", { credentials: "include", cache: "no-store" }),
      ]);

      if (!projectsRes.ok || !savedRes.ok) {
        throw new Error(text("meshLoadingError", "Failed to load mesh calculator dependencies"));
      }

      const projectsBody = await projectsRes.json();
      const savedBody = await savedRes.json();
      setProjects(mapToolProjectOptions(projectsBody));
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || text("meshLoadingFallbackError", "Failed to load mesh calculator"));
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
        toolType: "mesh",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          meshTypeId,
          surfaceM2: parseNumberInput(surfaceM2) || 0,
          overlap,
        },
        output: calculation.value,
      };

      const res = await fetch("/api/tools/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || text("meshSavingError", "Failed to save mesh calculation"));
      }

      setSaveMessage(text("meshSavedMessage", "Mesh calculation saved successfully."));
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || text("meshSavingError", "Failed to save mesh calculation"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"} dir={embedded ? undefined : dir}>
      <div>
        {embedded ? null : (
          <h1 className="text-2xl font-semibold text-gray-900">{text("meshPageTitle", "Welded Mesh (Treillis Soudé)")}</h1>
        )}
        <p className="text-sm text-gray-600">
          {text(
            "meshPageDescription",
            "Calculate the number of panels, their dimensions and the total weight of welded mesh needed to cover a surface.",
          )}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{text("meshInputsTitle", "Inputs")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{text("meshTypeLabel", "Mesh type")}</Label>
              <Select value={meshTypeId} onValueChange={setMeshTypeId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{text("meshGroupStructural", "Structural mesh")}</SelectLabel>
                    {structuralTypes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{text("meshGroupAntifissuration", "Crack-control mesh")}</SelectLabel>
                    {antifissurationTypes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mesh-surface">{text("meshSurfaceLabel", "Surface (m²)")}</Label>
              <Input
                id="mesh-surface"
                inputMode="decimal"
                value={surfaceM2}
                onChange={(e) => setSurfaceM2(e.target.value)}
                aria-invalid={showFieldErrors && surfaceError ? true : undefined}
                aria-describedby={showFieldErrors && surfaceError ? "mesh-surface-error" : undefined}
                className={showFieldErrors && surfaceError ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {showFieldErrors && surfaceError ? (
                <p id="mesh-surface-error" className="text-sm text-red-600">
                  {errorCodeText(surfaceError)}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mesh-overlap">{text("meshOverlapLabel", "Overlap")}</Label>
              <Select value={overlap} onValueChange={(v) => setOverlap(v as MeshOverlap)}>
                <SelectTrigger className="w-full" id="mesh-overlap" aria-invalid={showFieldErrors && overlapError ? true : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERLAP_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {overlapLabels[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showFieldErrors && overlapError ? (
                <p id="mesh-overlap-error" className="text-sm text-red-600">
                  {overlapError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label>{text("concreteProjectPlaceholder", "Link to project (optional)")}</Label>
              <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{text("concreteProjectPlaceholder", "Link to project (optional)")}</SelectItem>
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
            <CardTitle>{text("meshResultsTitle", "Results")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{text("meshPanelCountLabel", "Number of panels")}</p>
                <p className="text-xl font-semibold">
                  {calculation.ok ? formatNumber(calculation.value.panelCount) : EMPTY_RESULT}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text("meshPanelDimensionLabel", "Panel dimensions")}</p>
                <p className="text-xl font-semibold">
                  {calculation.ok
                    ? `${formatNumber(calculation.value.panelLengthM, { maximumFractionDigits: 2 })} m x ${formatNumber(calculation.value.panelWidthM, { maximumFractionDigits: 2 })} m`
                    : EMPTY_RESULT}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text("meshSizeLabel", "Mesh size")}</p>
                <p className="text-xl font-semibold">
                  {calculation.ok
                    ? `${calculation.value.meshSpacingMm[0]} mm x ${calculation.value.meshSpacingMm[1]} mm`
                    : EMPTY_RESULT}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text("meshTotalWeightLabel", "Total weight")}</p>
                <p className="text-xl font-semibold">
                  {calculation.ok
                    ? `${formatNumber(calculation.value.totalWeightKg, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
                    : EMPTY_RESULT}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">{text("meshSavedTitle", "Saved Mesh Calculations")}</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">{text("loading", "Loading...")}</p> : null}
        {!isLoading && saved.length === 0 ? <p className="mt-2 text-sm text-gray-500">{text("steelEmptySaved", "No saved calculations yet.")}</p> : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">
                  {item.project?.name || text("concreteNoProject", "No project")} - {new Date(item.createdAt).toLocaleString(resolvedLocale)}
                </p>
                <p className="text-xs text-gray-600">
                  {formatMessage("meshSavedSummary", "{meshType} - {count} panels, {weight} kg", {
                    meshType: item.input?.meshTypeId || "",
                    count: formatNumber(item.output.panelCount),
                    weight: formatNumber(item.output.totalWeightKg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
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
