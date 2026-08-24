"use client";

import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type SavedCalc = {
  id: string;
  output: {
    volumeM3: number;
    cementKg: number;
    cementBags: number;
    sandM3: number;
    gravelM3: number;
  };
  project?: { id: string; name: string } | null;
  createdAt: string;
};

const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

const parseDecimal = (value: string) => {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

type LengthUnit = "m" | "dm" | "cm" | "mm";

const UNIT_TO_METERS: Record<LengthUnit, number> = {
  m: 1,
  dm: 0.1,
  cm: 0.01,
  mm: 0.001,
};

const LENGTH_UNITS: LengthUnit[] = ["m", "dm", "cm", "mm"];

const toMeters = (value: string, unit: LengthUnit) => parseDecimal(value) * UNIT_TO_METERS[unit];

export default function ConcreteCalculatorClient() {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();
  const [length, setLength] = useState("0");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("m");
  const [width, setWidth] = useState("0");
  const [widthUnit, setWidthUnit] = useState<LengthUnit>("m");
  const [height, setHeight] = useState("0");
  const [heightUnit, setHeightUnit] = useState<LengthUnit>("m");
  const [slabThickness, setSlabThickness] = useState("");
  const [slabThicknessUnit, setSlabThicknessUnit] = useState<LengthUnit>("cm");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

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

  const calculation = useMemo(() => {
    const l = toMeters(length, lengthUnit);
    const w = toMeters(width, widthUnit);
    const h = toMeters(height, heightUnit);
    const slab = toMeters(slabThickness, slabThicknessUnit);
    const effectiveHeight = slab > 0 ? slab : h;

    const volumeM3 = Math.max(0, l * w * effectiveHeight);
    const cementKg = volumeM3 * 350;
    const cementBags = cementKg / 50;
    const sandM3 = volumeM3 * 0.5;
    const gravelM3 = volumeM3 * 0.8;

    return {
      volumeM3,
      cementKg,
      cementBags,
      sandM3,
      gravelM3,
    };
  }, [height, heightUnit, length, lengthUnit, slabThickness, slabThicknessUnit, width, widthUnit]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, savedRes] = await Promise.all([
        fetch("/api/tools/projects", { credentials: "include", cache: "no-store" }),
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
      setProjects(projectsBody.items || []);
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || text("concreteLoadingFallbackError", "Failed to load calculator data"));
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
        toolType: "concrete",
        projectId: projectId || null,
        notes: notes || null,
        input: {
          length: toMeters(length, lengthUnit),
          width: toMeters(width, widthUnit),
          height: toMeters(height, heightUnit),
          slabThickness: slabThickness.trim() ? toMeters(slabThickness, slabThicknessUnit) : null,
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

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{text("concretePageTitle", "Concrete Calculator")}</h1>
        <p className="text-sm text-gray-600">
          {text("concretePageDescription", "Estimate concrete volume, cement bags, sand, and gravel, then save to a project.")}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">{text("concreteInputsTitle", "Inputs")}</h2>
          <div className="flex gap-2">
            <input
              className="w-full rounded border p-2"
              inputMode="decimal"
              placeholder={text("concreteLengthPlaceholder", "Length")}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value as LengthUnit)}
              aria-label={text("concreteLengthPlaceholder", "Length")}
            >
              {LENGTH_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded border p-2"
              inputMode="decimal"
              placeholder={text("concreteWidthPlaceholder", "Width")}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={widthUnit}
              onChange={(e) => setWidthUnit(e.target.value as LengthUnit)}
              aria-label={text("concreteWidthPlaceholder", "Width")}
            >
              {LENGTH_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded border p-2"
              inputMode="decimal"
              placeholder={text("concreteHeightPlaceholder", "Height")}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as LengthUnit)}
              aria-label={text("concreteHeightPlaceholder", "Height")}
            >
              {LENGTH_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded border p-2"
              inputMode="decimal"
              placeholder={text("concreteSlabThicknessPlaceholder", "Slab thickness - optional")}
              value={slabThickness}
              onChange={(e) => setSlabThickness(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={slabThicknessUnit}
              onChange={(e) => setSlabThicknessUnit(e.target.value as LengthUnit)}
              aria-label={text("concreteSlabThicknessPlaceholder", "Slab thickness - optional")}
            >
              {LENGTH_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <select className="w-full rounded border p-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{text("concreteProjectPlaceholder", "Link to project (optional)")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status})
              </option>
            ))}
          </select>

          <textarea
            className="w-full rounded border p-2"
            rows={3}
            placeholder={text("concreteNotesPlaceholder", "Notes (optional)")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? text("concreteSaving", "Saving...") : text("concreteSaveButton", "Save Calculation")}
          </button>
        </div>

        <div className="rounded border bg-gray-50 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">{text("concreteResultsTitle", "Results")}</h2>
          <p className="text-sm">
            {formatMessage("concreteVolumeSummary", "Volume {volume} m3", {
              volume: formatNumber(calculation.volumeM3, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
            })}
          </p>
          <p className="text-sm">
            {formatMessage("concreteCementSummary", "Cement {cement} kg ({bags} bags)", {
              cement: formatNumber(calculation.cementKg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
              bags: formatNumber(calculation.cementBags, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            })}
          </p>
          <p className="text-sm">
            {formatMessage("concreteSandSummary", "Sand {sand} m3", {
              sand: formatNumber(calculation.sandM3, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
            })}
          </p>
          <p className="text-sm">
            {formatMessage("concreteGravelSummary", "Gravel {gravel} m3", {
              gravel: formatNumber(calculation.gravelM3, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
            })}
          </p>
        </div>
      </div>

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
                <p className="text-xs text-gray-600">
                  {formatMessage("concreteSavedSummary", "Volume {volume} m3, Cement {bags} bags", {
                    volume: formatNumber(item.output.volumeM3, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
                    bags: formatNumber(item.output.cementBags, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
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
