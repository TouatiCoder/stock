"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  computeConcreteVolume,
  computeConcreteDosage,
  CONCRETE_ELEMENT_TYPES,
  CONCRETE_ELEMENT_FIELDS,
  CEMENT_DOSAGES,
  collectConcreteVolumeFieldErrors,
  type ConcreteElementType,
  type ConcreteDimensionField,
  type CementDosage,
} from "@/lib/calculators/concrete";
import { CalculationError, parseNumberInput, type CalculationErrorCode } from "@/lib/calculators/validation";
import {
  buildToolProjectsUrl,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  normalizeProjectSelection,
  PROJECT_NONE_VALUE,
  type ToolProjectOption,
} from "@/lib/calculators/project-link";

type SavedCalc = {
  id: string;
  output: Record<string, unknown>;
  input: Record<string, unknown>;
  project?: { id: string; name: string } | null;
  createdAt: string;
};

/**
 * English fallbacks for the dimension labels, used only when a translation is
 * missing. The displayed label always comes from the translation system, keyed
 * by CONCRETE_ELEMENT_FIELDS.
 */
const DIMENSION_LABEL_FALLBACKS: Record<string, string> = {
  concreteLengthLabel: "Length (m)",
  concreteWidthLabel: "Width (m)",
  concreteHeightLabel: "Height (m)",
  concreteThicknessLabel: "Thickness (cm)",
  concreteColumnWidthCmLabel: "Width (cm)",
  concreteDiameterLabel: "Diameter (cm)",
  concreteRoundHeightLabel: "Height (m)",
};

/** Shown in the results panel while an input is still missing or invalid. */
const EMPTY_RESULT = "\u2014";

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

export default function ConcreteCalculatorClient() {
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

  const resolvedLocale = LOCALE_MAP[locale];
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(resolvedLocale, options).format(value);
  /** Existing convention for masses/volumes in the dosage results: one decimal. */
  const formatMass = (value: number) =>
    formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatMessage = (key: string, fallback: string, replacements: Record<string, string>) => {
    let message = text(key, fallback);
    for (const [token, replacement] of Object.entries(replacements)) {
      message = message.replace(`{${token}}`, replacement);
    }
    return message;
  };

  const elementLabels: Record<ConcreteElementType, string> = {
    dalle: text("concreteElementDalle", "Slab (Dalle)"),
    voile: text("concreteElementVoile", "Wall (Voile)"),
    poteau_rectangulaire: text("concreteElementPoteauRectangulaire", "Rectangular column"),
    poteau_rond: text("concreteElementPoteauRond", "Round column"),
  };

  const dosageLabels: Record<CementDosage, string> = {
    200: text("concreteDosage200", "200 kg/m³ - Blinding concrete"),
    300: text("concreteDosage300", "300 kg/m³ - Unreinforced concrete"),
    350: text("concreteDosage350", "350 kg/m³ - Reinforced concrete"),
  };

  // --- Volume tab state ---
  const [elementType, setElementType] = useState<ConcreteElementType>("dalle");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thicknessCm, setThicknessCm] = useState("");
  const [diameterCm, setDiameterCm] = useState("");
  const [roundHeightM, setRoundHeightM] = useState("");

  // --- Dosage tab state ---
  const [dosage, setDosage] = useState<CementDosage>(350);
  const [dosageVolumeM3, setDosageVolumeM3] = useState("");

  // --- Shared state ---
  const [activeTab, setActiveTab] = useState<"volume" | "dosage">("volume");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  const [projects, setProjects] = useState<ToolProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  /** Field messages are shown for a tab once the user has tried to calculate/save on it. */
  const [showVolumeFieldErrors, setShowVolumeFieldErrors] = useState(false);
  const [showDosageFieldErrors, setShowDosageFieldErrors] = useState(false);

  const volumeResult = useMemo(() => {
    try {
      const result = computeConcreteVolume({
        elementType,
        length: parseNumberInput(length),
        width: parseNumberInput(width),
        thicknessCm: parseNumberInput(thicknessCm),
        diameterCm: parseNumberInput(diameterCm),
        heightM: parseNumberInput(roundHeightM),
      });
      return { ok: true as const, value: result };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  }, [elementType, length, width, thicknessCm, diameterCm, roundHeightM]);

  /** One message per invalid input, only for the fields the selected element requires. */
  const volumeFieldErrors = useMemo(
    () =>
      collectConcreteVolumeFieldErrors(elementType, {
        length: parseNumberInput(length),
        width: parseNumberInput(width),
        thicknessCm: parseNumberInput(thicknessCm),
        diameterCm: parseNumberInput(diameterCm),
        heightM: parseNumberInput(roundHeightM),
      }),
    [elementType, length, width, thicknessCm, diameterCm, roundHeightM],
  );

  const dosageResult = useMemo(() => {
    try {
      const result = computeConcreteDosage({
        dosageKgM3: dosage,
        volumeM3: parseNumberInput(dosageVolumeM3),
      });
      return { ok: true as const, value: result };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  }, [dosage, dosageVolumeM3]);

  /** The dosage tab has a single required input, so its error maps straight to it. */
  const dosageVolumeError: CalculationErrorCode | null =
    !dosageResult.ok && dosageResult.error instanceof CalculationError && dosageResult.error.field === "volumeM3"
      ? dosageResult.error.code
      : null;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, savedRes] = await Promise.all([
        fetch(buildToolProjectsUrl("company"), { credentials: "include", cache: "no-store" }),
        fetch("/api/tools/calculations?type=concrete", { credentials: "include", cache: "no-store" }),
      ]);

      if (!projectsRes.ok) {
        const body = await projectsRes.json().catch(() => ({}));
        throw new Error(body.error || text("concreteLoadingProjectError", "Failed to load project options"));
      }
      if (!savedRes.ok) {
        const body = await savedRes.json().catch(() => ({}));
        throw new Error(body.error || text("concreteLoadingSavedError", "Failed to load saved calculations"));
      }

      const projectsBody = await projectsRes.json();
      const savedBody = await savedRes.json();
      setProjects(mapToolProjectOptions(projectsBody));
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || text("concreteLoadingFallbackError", "Failed to load calculator data"));
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
    const current = activeTab === "volume" ? volumeResult : dosageResult;
    if (!current.ok) {
      // Missing/invalid inputs are reported under the field they belong to.
      if (activeTab === "volume") setShowVolumeFieldErrors(true);
      else setShowDosageFieldErrors(true);
      setSaveMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      setError(null);

      const payload =
        activeTab === "volume"
          ? {
              toolType: "concrete",
              projectId: normalizeProjectSelection(projectId),
              notes: notes || null,
              input: {
                calcKind: "volume",
                elementType,
                length: parseNumberInput(length),
                width: parseNumberInput(width),
                thicknessCm: parseNumberInput(thicknessCm),
                diameterCm: parseNumberInput(diameterCm),
                heightM: parseNumberInput(roundHeightM),
              },
              output: volumeResult.ok ? volumeResult.value : {},
            }
          : {
              toolType: "concrete",
              projectId: normalizeProjectSelection(projectId),
              notes: notes || null,
              input: {
                calcKind: "dosage",
                dosageKgM3: dosage,
                volumeM3: parseNumberInput(dosageVolumeM3),
              },
              output: dosageResult.ok ? dosageResult.value : {},
            };

      const res = await fetch("/api/tools/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || text("concreteSavingError", "Failed to save calculation"));
      }

      setSaveMessage(text("concreteSavedMessage", "Calculation saved successfully."));
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || text("concreteSavingError", "Failed to save calculation"));
    } finally {
      setIsSaving(false);
    }
  };

  const renderSavedSummary = (item: SavedCalc) => {
    const output = item.output || {};
    if (typeof output.cementKg === "number" && item.input?.calcKind === "dosage") {
      return formatMessage("concreteSavedSummaryDosage", "Dosage {dosage} kg/m³ - Cement {cement} kg", {
        dosage: String(item.input?.dosageKgM3 ?? ""),
        cement: formatNumber(output.cementKg as number, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      });
    }
    if (typeof output.volumeM3 === "number") {
      const elType = (item.input?.elementType as ConcreteElementType) || "dalle";
      return formatMessage("concreteSavedSummaryVolume", "{elementType} - Surface {surface} m², Volume {volume} m³", {
        elementType: elementLabels[elType] || elType,
        surface: formatNumber((output.surfaceM2 as number) ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        volume: formatNumber((output.volumeM3 as number) ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
      });
    }
    return null;
  };

  const dimensionValues: Record<ConcreteDimensionField, string> = {
    length,
    width,
    thicknessCm,
    diameterCm,
    heightM: roundHeightM,
  };

  const dimensionSetters: Record<ConcreteDimensionField, (value: string) => void> = {
    length: setLength,
    width: setWidth,
    thicknessCm: setThicknessCm,
    diameterCm: setDiameterCm,
    heightM: setRoundHeightM,
  };

  /**
   * Inputs and labels follow the selected element's geometry: a voile asks for
   * Hauteur (not Largeur), and a poteau rectangulaire asks for Hauteur /
   * Longueur / Largeur, in that order.
   */
  const renderDimensionFields = () =>
    CONCRETE_ELEMENT_FIELDS[elementType].map((descriptor) => {
      const fieldError = showVolumeFieldErrors ? volumeFieldErrors[descriptor.field] : undefined;
      const inputId = "concrete-" + descriptor.field;
      const errorId = inputId + "-error";

      return (
        <div key={descriptor.field} className="space-y-1.5">
          <Label htmlFor={inputId}>
            {text(descriptor.labelKey, DIMENSION_LABEL_FALLBACKS[descriptor.labelKey] ?? descriptor.labelKey)}
          </Label>
          <Input
            id={inputId}
            inputMode="decimal"
            value={dimensionValues[descriptor.field]}
            onChange={(e) => dimensionSetters[descriptor.field](e.target.value)}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? errorId : undefined}
            className={fieldError ? "border-red-500 focus-visible:ring-red-500" : undefined}
          />
          {fieldError ? (
            <p id={errorId} className="text-sm text-red-600">
              {errorCodeText(fieldError)}
            </p>
          ) : null}
        </div>
      );
    });

  /** Optional project link, shared by both tabs. Never required to calculate or save. */
  const renderProjectField = () => (
    <div className="space-y-1.5 pt-2">
      <Label>{text("concreteProjectPlaceholder", "Link to project (optional)")}</Label>
      <Select
        value={projectId || PROJECT_NONE_VALUE}
        onValueChange={(v) => setProjectId(normalizeProjectSelection(v) ?? "")}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PROJECT_NONE_VALUE}>
            {text("concreteProjectPlaceholder", "Link to project (optional)")}
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {formatProjectOptionLabel(project)}
            </SelectItem>
          ))}
          {isLoading ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">{text("loading", "Loading...")}</p>
          ) : null}
          {!isLoading && projects.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {text("concreteNoProjectsAvailable", "No project available")}
            </p>
          ) : null}
        </SelectContent>
      </Select>
      {!isLoading && projects.length === 0 ? (
        <p className="text-xs text-muted-foreground">{text("concreteNoProjectsAvailable", "No project available")}</p>
      ) : null}
    </div>
  );

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{text("concretePageTitle", "Concrete Calculator")}</h1>
        <p className="text-sm text-gray-600">
          {text("concretePageDescription", "Estimate concrete volume, cement, sand, and gravel, then save the result to a project.")}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "volume" | "dosage")}>
        <TabsList>
          <TabsTrigger value="volume">{text("concreteTabVolume", "Volume")}</TabsTrigger>
          <TabsTrigger value="dosage">{text("concreteTabDosage", "Dosage")}</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{text("concreteInputsTitle", "Inputs")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{text("concreteElementTypeLabel", "Element type")}</Label>
                  <Select value={elementType} onValueChange={(v) => setElementType(v as ConcreteElementType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCRETE_ELEMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {elementLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {renderDimensionFields()}

                {renderProjectField()}

                <div className="space-y-1.5">
                  <Label>{text("concreteNotesPlaceholder", "Notes (optional)")}</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm shadow-xs"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? text("concreteSaving", "Saving...") : text("concreteSaveButton", "Save Calculation")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text("concreteResultsTitle", "Results")}</CardTitle>
                <CardDescription>{text("concreteVolumeTabNote", "Surface and volume are calculated from exact geometry for the selected element.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{text("concreteSurfaceResultLabel", "Surface")}</p>
                  <p className="text-2xl font-semibold">
                    {volumeResult.ok
                      ? `${formatNumber(volumeResult.value.surfaceM2, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
                      : EMPTY_RESULT}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{text("concreteVolumeResultLabel", "Volume")}</p>
                  <p className="text-2xl font-semibold">
                    {volumeResult.ok
                      ? `${formatNumber(volumeResult.value.volumeM3, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m³`
                      : EMPTY_RESULT}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dosage" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{text("concreteInputsTitle", "Inputs")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{text("concreteDosageLabel", "Cement dosage")}</Label>
                  <Select value={String(dosage)} onValueChange={(v) => setDosage(Number(v) as CementDosage)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CEMENT_DOSAGES.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {dosageLabels[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="concrete-dosage-volume">{text("concreteDosageVolumeLabel", "Volume (m³)")}</Label>
                  <Input
                    id="concrete-dosage-volume"
                    inputMode="decimal"
                    value={dosageVolumeM3}
                    onChange={(e) => setDosageVolumeM3(e.target.value)}
                    aria-invalid={showDosageFieldErrors && dosageVolumeError ? true : undefined}
                    aria-describedby={showDosageFieldErrors && dosageVolumeError ? "concrete-dosage-volume-error" : undefined}
                    className={showDosageFieldErrors && dosageVolumeError ? "border-red-500 focus-visible:ring-red-500" : undefined}
                  />
                  {showDosageFieldErrors && dosageVolumeError ? (
                    <p id="concrete-dosage-volume-error" className="text-sm text-red-600">
                      {errorCodeText(dosageVolumeError)}
                    </p>
                  ) : null}
                </div>

                {renderProjectField()}

                <div className="space-y-1.5">
                  <Label>{text("concreteNotesPlaceholder", "Notes (optional)")}</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm shadow-xs"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? text("concreteSaving", "Saving...") : text("concreteSaveButton", "Save Calculation")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text("concreteResultsTitle", "Results")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{text("concreteCementResultLabel", "Cement")}</p>
                    <p className="text-xl font-semibold">
                      {dosageResult.ok ? `${formatMass(dosageResult.value.cementKg)} kg` : EMPTY_RESULT}
                    </p>
                    {dosageResult.ok ? (
                      <p className="text-sm text-muted-foreground">
                        {formatMessage("concreteCementBagsResult", "That is: {bags} bags of 25 kg", {
                          bags: formatNumber(dosageResult.value.cementBags25kg, { maximumFractionDigits: 1 }),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{text("concreteSandResultLabel", "Sand")}</p>
                    <p className="text-xl font-semibold">
                      {dosageResult.ok ? `${formatMass(dosageResult.value.sandKg)} kg` : EMPTY_RESULT}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{text("concreteGravelResultLabel", "Gravel")}</p>
                    <p className="text-xl font-semibold">
                      {dosageResult.ok ? `${formatMass(dosageResult.value.gravelKg)} kg` : EMPTY_RESULT}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{text("concreteWaterResultLabel", "Water")}</p>
                    <p className="text-xl font-semibold">
                      {dosageResult.ok ? `${formatMass(dosageResult.value.waterL)} L` : EMPTY_RESULT}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {text(
                    "concreteDosageDisclaimer",
                    "Cement is exact for the selected dosage. Sand, gravel and water are standard construction estimates - confirm exact proportions with your concrete supplier for critical pours.",
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">{text("concreteSavedTitle", "Saved Concrete Calculations")}</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">{text("loading", "Loading...")}</p> : null}
        {!isLoading && saved.length === 0 ? <p className="mt-2 text-sm text-gray-500">{text("concreteEmptySaved", "No saved calculations yet.")}</p> : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">
                  {item.project?.name || text("concreteNoProject", "No project")} - {new Date(item.createdAt).toLocaleString(resolvedLocale)}
                </p>
                <p className="text-xs text-gray-600">{renderSavedSummary(item)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
