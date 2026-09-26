import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isRtl, locales } from "./i18n";
import { CONCRETE_ELEMENT_FIELDS, CONCRETE_ELEMENT_TYPES } from "./calculators/concrete";

// Keys introduced (or renamed) for the construction calculators: volume,
// dosage, HA weight and welded mesh. Every one of these must exist, with a
// non-empty translation, in all three supported locales.
const CALCULATOR_KEYS = [
  "calcErrorRequired",
  "calcErrorNegative",
  "calcErrorInvalid",
  "calcErrorNotInteger",
  "calcErrorGeneric",
  "concreteTabVolume",
  "concreteTabDosage",
  "concreteElementTypeLabel",
  "concreteElementDalle",
  "concreteElementVoile",
  "concreteElementPoteauRectangulaire",
  "concreteElementPoteauRond",
  "concreteLengthLabel",
  "concreteWidthLabel",
  "concreteThicknessLabel",
  "concreteHeightLabel",
  "concreteColumnWidthCmLabel",
  "concreteDiameterLabel",
  "concreteRoundHeightLabel",
  "concreteProjectPlaceholder",
  "concreteNoProjectsAvailable",
  "concreteSurfaceResultLabel",
  "concreteVolumeResultLabel",
  "concreteDosageLabel",
  "concreteDosage200",
  "concreteDosage300",
  "concreteDosage350",
  "concreteDosageVolumeLabel",
  "concreteCementResultLabel",
  "concreteCementBagsResult",
  "concreteSandResultLabel",
  "concreteGravelResultLabel",
  "concreteWaterResultLabel",
  "concreteDosageDisclaimer",
  "steelPageTitle",
  "steelPageDescription",
  "meshCalculator",
  "calculationHubMeshDescription",
  "meshPageTitle",
  "meshPageDescription",
  "meshTypeLabel",
  "meshGroupStructural",
  "meshGroupAntifissuration",
  "meshSurfaceLabel",
  "meshOverlapLabel",
  "meshOverlapNone",
  "meshOverlap1",
  "meshOverlap2",
  "meshPanelCountLabel",
  "meshPanelDimensionLabel",
  "meshSizeLabel",
  "meshTotalWeightLabel",
];

function loadCommonMessages(locale: string): Record<string, unknown> {
  const filePath = path.join(__dirname, "..", "messages", `${locale}.json`);
  const raw = readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return json.common;
}

describe("calculator translations", () => {
  const messagesByLocale = Object.fromEntries(locales.map((l) => [l, loadCommonMessages(l)]));

  test("every supported locale defines every calculator key with a non-empty value", () => {
    for (const locale of locales) {
      for (const key of CALCULATOR_KEYS) {
        const value = messagesByLocale[locale][key];
        assert.equal(typeof value, "string", `${locale}.${key} should be a string`);
        assert.ok((value as string).trim().length > 0, `${locale}.${key} should not be empty`);
      }
    }
  });

  test("English, French and Arabic each carry a distinct translation (no leftover copy-paste)", () => {
    for (const key of CALCULATOR_KEYS) {
      const en = messagesByLocale.en[key];
      const fr = messagesByLocale.fr[key];
      const ar = messagesByLocale.ar[key];
      // Arabic must never equal the Latin-script strings.
      assert.notEqual(ar, en, `ar.${key} should not equal the English string`);
      assert.notEqual(ar, fr, `ar.${key} should not equal the French string`);
    }
  });

  test("the three locale files expose exactly the same set of common keys", () => {
    const enKeys = new Set(Object.keys(messagesByLocale.en));
    for (const locale of locales) {
      const keys = new Set(Object.keys(messagesByLocale[locale]));
      const missing = [...enKeys].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !enKeys.has(k));
      assert.deepEqual(missing, [], `${locale} is missing keys present in en`);
      assert.deepEqual(extra, [], `${locale} has keys not present in en`);
    }
  });
});

describe("concrete calculator dynamic labels", () => {
  const messagesByLocale = Object.fromEntries(locales.map((l) => [l, loadCommonMessages(l)]));

  test("every per-element label key is translated in fr, en and ar", () => {
    for (const type of CONCRETE_ELEMENT_TYPES) {
      for (const descriptor of CONCRETE_ELEMENT_FIELDS[type]) {
        for (const locale of locales) {
          const value = messagesByLocale[locale][descriptor.labelKey];
          assert.equal(typeof value, "string", `${locale}.${descriptor.labelKey} (${type}) should be a string`);
          assert.ok((value as string).trim().length > 0, `${locale}.${descriptor.labelKey} should not be empty`);
        }
      }
    }
  });

  test("French labels match the terminology the client asked for", () => {
    const fr = messagesByLocale.fr;
    const labels = (type: keyof typeof CONCRETE_ELEMENT_FIELDS) =>
      CONCRETE_ELEMENT_FIELDS[type].map((d) => fr[d.labelKey]);

    assert.deepEqual(labels("dalle"), ["Longueur (m)", "Largeur (m)", "Épaisseur (cm)"]);
    assert.deepEqual(labels("voile"), ["Longueur (m)", "Hauteur (m)", "Épaisseur (cm)"]);
    assert.deepEqual(labels("poteau_rectangulaire"), ["Hauteur (m)", "Longueur (m)", "Largeur (cm)"]);
    assert.deepEqual(labels("poteau_rond"), ["Hauteur (m)", "Diamètre (cm)"]);
  });

  test("a voile never shows the Largeur label in any locale", () => {
    const widthLabels = new Set(locales.map((l) => messagesByLocale[l].concreteWidthLabel));
    for (const locale of locales) {
      const voileLabels = CONCRETE_ELEMENT_FIELDS.voile.map((d) => messagesByLocale[locale][d.labelKey]);
      for (const label of voileLabels) {
        assert.ok(!widthLabels.has(label), `${locale}: voile must not display the "Largeur (m)" label`);
      }
    }
  });
});

describe("RTL handling", () => {
  test("Arabic is RTL; French and English are LTR", () => {
    assert.equal(isRtl("ar"), true);
    assert.equal(isRtl("fr"), false);
    assert.equal(isRtl("en"), false);
  });
});
