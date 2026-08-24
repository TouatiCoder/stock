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
    surfaceAreaM2: number;
    plywoodSheets: number;
  };
  project?: { id: string; name: string } | null;
  createdAt: string;
};

const PLYWOOD_SHEET_M2 = 2.98;
const LOCALE_MAP = {
  ar: "ar-MA",
  en: "en-US",
  fr: "fr-FR",
} as const;

export default function FormworkCalculatorClient() {
  const tCommon = useCommonTranslations();
  const { dir, locale } = useLocale();
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
        throw new Error(text("formworkLoadingError", "Impossible de charger les donnees du calculateur de coffrage"));
      }

      const projectsBody = await projectsRes.json();
      const savedBody = await savedRes.json();
      setProjects(projectsBody.items || []);
      setSaved(savedBody.items || []);
    } catch (err: any) {
      setError(err?.message || text("formworkLoadingFallbackError", "Impossible de charger le calculateur de coffrage"));
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

  const surfaceAreaText = formatNumber(calculation.surfaceAreaM2, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const plywoodSheetsText = formatNumber(calculation.plywoodSheets);
  const sheetBasisText = formatMessage(
    "formworkSheetBasis",
    "Base sur un panneau de 1.22 m x 2.44 m ({area} m2).",
    {
      area: formatNumber(PLYWOOD_SHEET_M2, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }
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
          <input
            className="w-full rounded border p-2"
            placeholder={text("formworkLengthPlaceholder", "Longueur (m)")}
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
          <input
            className="w-full rounded border p-2"
            placeholder={text("formworkWidthPlaceholder", "Largeur (m)")}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
          <input
            className="w-full rounded border p-2"
            placeholder={text("formworkHeightPlaceholder", "Hauteur (m)")}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />

          <select className="w-full rounded border p-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{text("formworkProjectPlaceholder", "Lier au projet (optionnel)")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status})
              </option>
            ))}
          </select>

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
            {text("formworkSurfaceArea", "Surface")} : <span className="font-semibold">{surfaceAreaText} m2</span>
          </p>
          <p className="text-sm">
            {text("formworkPlywoodSheets", "Panneaux de contreplaque")} : <span className="font-semibold">{plywoodSheetsText}</span>
          </p>
          <p className="text-xs text-gray-500">{sheetBasisText}</p>
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
                    area: formatNumber(item.output.surfaceAreaM2, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                    sheets: formatNumber(item.output.plywoodSheets),
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
