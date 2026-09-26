"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import {
  buildToolProjectsUrl,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  type ToolProjectOption,
} from "@/lib/calculators/project-link";
import {
  computeFormwork,
  collectFormworkFieldErrors,
  getFormworkPanelSize,
  panelAreaM2,
  usesNetLength,
  DEFAULT_FORMWORK_PANEL_ID,
  FORMWORK_FOUNDATION_TYPES,
  FORMWORK_PANEL_SIZES,
  FORMWORK_TYPE_FIELDS,
  FORMWORK_TYPE_FORMULA,
  FORMWORK_UNIT_SYMBOLS,
  FORMWORK_UNIT_SYSTEMS,
  areaFromSquareMeters,
  lengthFromMeters,
  lengthToMeters,
  type FormworkDimensionField,
  type FormworkFoundationType,
  type FormworkUnitSystem,
} from "@/lib/calculators/formwork";
import { CalculationError, parseNumberInput, type CalculationErrorCode } from "@/lib/calculators/validation";

type SavedCalc = {
  id: string;
  output: {
    // `surfaceAreaM2` / `plywoodSheets` keep the names the saved history already
    // uses, so calculations saved before this change still render.
    surfaceAreaM2: number;
    plywoodSheets: number;
    timberLengthM?: number;
  };
  project?: { id: string; name: string } | null;
  createdAt: string;
};

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

/** English fallbacks, used only when a translation is missing. */
const LABEL_FALLBACKS: Record<string, string> = {
  formworkLengthLabel: "Length",
  formworkWidthLabel: "Width",
  formworkThicknessLabel: "Thickness",
  formworkOuterLengthLabel: "Outer length",
  formworkOuterWidthLabel: "Outer width",
  formworkTotalHeightLabel: "Total height",
  formworkFootingThicknessLabel: "Footing thickness",
  formworkBeamLengthLabel: "Tie beam length",
  formworkBeamWidthLabel: "Tie beam width",
  formworkBeamHeightLabel: "Tie beam height",
  formworkBeamThicknessLabel: "Tie beam thickness",
  formworkPlotWidthLabel: "Pad width",
  formworkPlotLengthLabel: "Pad length",
  formworkPlotHeightLabel: "Pad height",
  formworkPlotCountLabel: "Number of pads",
};

const EMPTY_RESULT = "—";

export default function FormworkCalculatorClient() {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();

  // Defaults reproduce the client's reference example
  // (type=pile, L=6, W=4, Hb=0.5, Tb=0.4, waste=10, spacing=0.5, 1220x2440).
  const [unit, setUnit] = useState<FormworkUnitSystem>("metric");
  const [type, setType] = useState<FormworkFoundationType>("pile");
  const [panelId, setPanelId] = useState(DEFAULT_FORMWORK_PANEL_ID);
  const [lengthM, setLengthM] = useState("6");
  const [widthM, setWidthM] = useState("4");
  const [heightM, setHeightM] = useState("0.5");
  const [thicknessM, setThicknessM] = useState("0.4");
  const [plotCount, setPlotCount] = useState("4");
  const [wastePercent, setWastePercent] = useState("10");
  const [joistSpacingM, setJoistSpacingM] = useState("0.5");

  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState<ToolProjectOption[]>([]);
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  /** Field messages appear once the user has tried to calculate/save. */
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const resolvedLocale = LOCALE_MAP[locale];
  const unitSymbols = FORMWORK_UNIT_SYMBOLS[unit];

  /**
   * Switching unit re-expresses what is already typed, so the geometry stays
   * the same: 6 m becomes 19.685 ft and back. Only lengths are converted - the
   * waste is a percentage. Values keep 6 decimals so the round trip is exact at
   * display precision (6 m -> 19.685039 ft -> 6 m, area still 18.4 m² / 198.06
   * ft²); the reference rounds its own inputs to 2 decimals but computes from
   * the unrounded value, which would show 19.69 here and lose that precision.
   */
  const convertTyped = (raw: string, from: FormworkUnitSystem, to: FormworkUnitSystem) => {
    const value = parseNumberInput(raw);
    if (value === null) return raw;
    const meters = lengthToMeters(value, from);
    const converted = lengthFromMeters(meters, to);
    return String(Number(converted.toFixed(6)));
  };

  const changeUnit = (next: FormworkUnitSystem) => {
    if (next === unit) return;
    setLengthM((v) => convertTyped(v, unit, next));
    setWidthM((v) => convertTyped(v, unit, next));
    setHeightM((v) => convertTyped(v, unit, next));
    setThicknessM((v) => convertTyped(v, unit, next));
    setJoistSpacingM((v) => convertTyped(v, unit, next));
    setUnit(next);
  };

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

  const typeLabels: Record<FormworkFoundationType, string> = {
    slab: text("formworkTypeSlab", "Monolithic slab"),
    strip: text("formworkTypeStrip", "Strip footing"),
    column: text("formworkTypePad", "Pad footing"),
    pile: text("formworkTypePile", "Pile + tie beam"),
  };

  const dimensionValues: Record<FormworkDimensionField, string> = {
    lengthM,
    widthM,
    heightM,
    thicknessM,
    plotCount,
  };

  const dimensionSetters: Record<FormworkDimensionField, (value: string) => void> = {
    lengthM: setLengthM,
    widthM: setWidthM,
    heightM: setHeightM,
    thicknessM: setThicknessM,
    plotCount: setPlotCount,
  };

  /** The calculation always runs in metres, whatever the user is typing in. */
  const parsedInput = useMemo(() => {
    const toMeters = (raw: string) => {
      const value = parseNumberInput(raw);
      return value === null ? null : lengthToMeters(value, unit);
    };
    return {
      type,
      panelId,
      lengthM: toMeters(lengthM),
      widthM: toMeters(widthM),
      heightM: toMeters(heightM),
      thicknessM: toMeters(thicknessM),
      // a number of plots is a count, not a length: no unit conversion
      plotCount: parseNumberInput(plotCount),
      wastePercent: parseNumberInput(wastePercent),
      joistSpacingM: toMeters(joistSpacingM),
    };
  }, [unit, type, panelId, lengthM, widthM, heightM, thicknessM, plotCount, wastePercent, joistSpacingM]);

  const calculation = useMemo(() => {
    try {
      return { ok: true as const, value: computeFormwork(parsedInput) };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  }, [parsedInput]);

  const fieldErrors = useMemo(() => collectFormworkFieldErrors(parsedInput), [parsedInput]);
  const fieldError = (field: keyof typeof fieldErrors) => (showFieldErrors ? fieldErrors[field] : undefined);

  const selectedPanel = getFormworkPanelSize(panelId);
  const panelLabel = selectedPanel ? `${selectedPanel.widthMm} × ${selectedPanel.lengthMm} mm` : "";

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, savedRes] = await Promise.all([
        fetch(buildToolProjectsUrl("company"), { credentials: "include", cache: "no-store" }),
        fetch("/api/tools/calculations?type=formwork", { credentials: "include", cache: "no-store" }),
      ]);

      if (!projectsRes.ok || !savedRes.ok) {
        throw new Error(text("formworkLoadingError", "Impossible de charger les donnees du calculateur de coffrage"));
      }

      const projectsBody = await projectsRes.json();
      const savedBody = await savedRes.json();
      setProjects(mapToolProjectOptions(projectsBody));
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || text("formworkLoadingFallbackError", "Impossible de charger le calculateur de coffrage"));
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
        toolType: "formwork",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          foundationType: type,
          panelId,
          // dimensions are stored in metres whatever the user typed in
          unitSystem: unit,
          lengthM: parsedInput.lengthM,
          widthM: parsedInput.widthM,
          heightM: parsedInput.heightM,
          thicknessM: usesNetLength(type) ? parsedInput.thicknessM : null,
          plotCount: type === "column" ? parsedInput.plotCount : null,
          wastePercent: parsedInput.wastePercent,
          joistSpacingM: parsedInput.joistSpacingM,
        },
        output: {
          surfaceAreaM2: calculation.value.contactAreaM2,
          plywoodSheets: calculation.value.panelCount,
          timberLengthM: calculation.value.timberLengthM,
          netLengthM: calculation.value.netLengthM,
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
        throw new Error(body.error || text("formworkSavingError", "Impossible d'enregistrer le calcul de coffrage"));
      }

      setSaveMessage(text("formworkSavedMessage", "Le calcul de coffrage a ete enregistre dans les notes du projet."));
      setNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || text("formworkSavingError", "Impossible d'enregistrer le calcul de coffrage"));
    } finally {
      setIsSaving(false);
    }
  };

  /** Surface: up to 2 decimals, timber: up to 1 decimal, as the reference displays them. */
  const areaText = calculation.ok
    ? `${formatNumber(areaFromSquareMeters(calculation.value.contactAreaM2, unit), {
        maximumFractionDigits: 2,
      })} ${unitSymbols.area}`
    : EMPTY_RESULT;
  const panelsText = calculation.ok ? formatNumber(calculation.value.panelCount) : EMPTY_RESULT;
  const timberText = calculation.ok
    ? `${formatNumber(lengthFromMeters(calculation.value.timberLengthM, unit), {
        maximumFractionDigits: 1,
      })} ${unitSymbols.length}`
    : EMPTY_RESULT;

  const renderNumberField = (
    id: string,
    labelKey: string,
    fallback: string,
    value: string,
    onChange: (next: string) => void,
    errorCode: CalculationErrorCode | undefined,
    unitSuffix?: string,
  ) => (
    <div key={id} className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {unitSuffix ? `${text(labelKey, fallback)} (${unitSuffix})` : text(labelKey, fallback)}
      </label>
      <input
        id={id}
        inputMode="decimal"
        className={`w-full rounded border p-2 ${errorCode ? "border-red-500" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={errorCode ? true : undefined}
        aria-describedby={errorCode ? `${id}-error` : undefined}
      />
      {errorCode ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {errorCodeText(errorCode)}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{text("formworkPageTitle", "Calculateur de Coffrage")}</h1>
        <p className="text-sm text-gray-600">
          {text("formworkPageDescription", "Calculez la surface de coffrage et le nombre estime de panneaux de contreplaque.")}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">{text("formworkInputsTitle", "Donnees d'entree")}</h2>

          <div className="space-y-1">
            <label htmlFor="formwork-unit" className="block text-sm font-medium text-gray-700">
              {text("formworkUnitLabel", "Units")}
            </label>
            <select
              id="formwork-unit"
              className="w-full rounded border p-2"
              value={unit}
              onChange={(e) => changeUnit(e.target.value as FormworkUnitSystem)}
            >
              {FORMWORK_UNIT_SYSTEMS.map((option) => (
                <option key={option} value={option}>
                  {option === "metric"
                    ? text("formworkUnitMetric", "Metric")
                    : text("formworkUnitImperial", "Imperial")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="formwork-type" className="block text-sm font-medium text-gray-700">
              {text("formworkTypeLabel", "Foundation type")}
            </label>
            <select
              id="formwork-type"
              className="w-full rounded border p-2"
              value={type}
              onChange={(e) => setType(e.target.value as FormworkFoundationType)}
            >
              {FORMWORK_FOUNDATION_TYPES.map((option) => (
                <option key={option} value={option}>
                  {typeLabels[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="formwork-panel" className="block text-sm font-medium text-gray-700">
              {text("formworkPanelSizeLabel", "Panel size")}
            </label>
            <select
              id="formwork-panel"
              className="w-full rounded border p-2"
              value={panelId}
              onChange={(e) => setPanelId(e.target.value)}
            >
              {FORMWORK_PANEL_SIZES.map((panel) => (
                <option key={panel.id} value={panel.id}>
                  {`${panel.widthMm} × ${panel.lengthMm} mm (${formatNumber(
                    areaFromSquareMeters(panelAreaM2(panel), unit),
                    { maximumFractionDigits: 2 },
                  )} ${unitSymbols.area})`}
                </option>
              ))}
            </select>
          </div>

          {FORMWORK_TYPE_FIELDS[type].map((descriptor) =>
            renderNumberField(
              `formwork-${descriptor.field}`,
              descriptor.labelKey,
              LABEL_FALLBACKS[descriptor.labelKey] ?? descriptor.labelKey,
              dimensionValues[descriptor.field],
              dimensionSetters[descriptor.field],
              fieldError(descriptor.field),
              descriptor.kind === "count" ? "pcs" : unitSymbols.length,
            ),
          )}

          {renderNumberField(
            "formwork-waste",
            "formworkWasteLabel",
            "Waste allowance (%)",
            wastePercent,
            setWastePercent,
            fieldError("wastePercent"),
          )}
          {renderNumberField(
            "formwork-spacing",
            "formworkSpacingLabel",
            "Joist spacing",
            joistSpacingM,
            setJoistSpacingM,
            fieldError("joistSpacingM"),
            unitSymbols.length,
          )}

          <div>
            <select className="w-full rounded border p-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">{text("formworkProjectPlaceholder", "Lier au projet (optionnel)")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {formatProjectOptionLabel(project)}
                </option>
              ))}
            </select>
            {!isLoading && projects.length === 0 ? (
              <p className="mt-1 text-xs text-gray-500">{text("toolsNoProjectsAvailable", "No project available")}</p>
            ) : null}
          </div>

          <textarea
            className="w-full rounded border p-2"
            rows={3}
            placeholder={text("formworkNotesPlaceholder", "Notes techniques a enregistrer avec ce calcul")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? text("formworkSaving", "Enregistrement...")
              : text("formworkSaveButton", "Enregistrer dans les notes du projet")}
          </button>
        </div>

        <div className="rounded border bg-gray-50 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">{text("formworkResultsTitle", "Resultats")}</h2>
          <p className="text-sm">
            {text("formworkContactAreaLabel", "Formwork area")} : <span className="font-semibold">{areaText}</span>
          </p>
          <p className="text-sm">
            {text("formworkPlywoodSheets", "Panneaux de contreplaque")} :{" "}
            <span className="font-semibold">
              {panelsText}
              {calculation.ok && panelLabel ? ` × ${panelLabel}` : ""}
            </span>
          </p>
          <p className="text-sm">
            {text("formworkTimberLabel", "Timber length")} : <span className="font-semibold">{timberText}</span>
          </p>
          {calculation.ok ? (
            <p className="text-xs text-gray-500">
              {formatMessage(
                "formworkOrderNote",
                "Order ≈ {panels} panels (including {waste}% waste). The area shown is the geometric contact area.",
                {
                  panels: formatNumber(calculation.value.panelCount),
                  waste: formatNumber(parsedInput.wastePercent ?? 0, { maximumFractionDigits: 2 }),
                },
              )}
            </p>
          ) : null}
          <p className="text-xs text-gray-500">
            {text("formworkFormulaLabel", "Formula applied")} :{" "}
            <span className="font-mono">{FORMWORK_TYPE_FORMULA[type]}</span>
          </p>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">{text("formworkSavedTitle", "Calculs de Coffrage Enregistres")}</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">{text("loading", "Chargement...")}</p> : null}
        {!isLoading && saved.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{text("formworkEmptySaved", "Aucun calcul enregistre pour le moment.")}</p>
        ) : null}
        {!isLoading && saved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm font-medium text-gray-900">
                  {item.project?.name || text("formworkNoProject", "Aucun projet")} - {new Date(item.createdAt).toLocaleString(resolvedLocale)}
                </p>
                <p className="text-xs text-gray-600">
                  {formatMessage("formworkSavedSummary", "Surface {area} m2, Panneaux {sheets}", {
                    area: formatNumber(item.output.surfaceAreaM2 ?? 0, { maximumFractionDigits: 2 }),
                    sheets: formatNumber(item.output.plywoodSheets ?? 0),
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
