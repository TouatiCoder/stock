"use client";

import { useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SteelCalculatorClient from "./page.client";
import MeshCalculatorClient from "../mesh-calculator/page.client";

/**
 * Calcul d'acier: the HA bar weight and the welded mesh (treillis soudé)
 * calculations live in the same flow, as two tabs of one page, instead of the
 * mesh calculation sitting on its own isolated screen (client feedback).
 *
 * Both tabs render the existing calculators unchanged - same inputs, same
 * formulas, same results, same save/history behaviour - only their page
 * chrome is provided by this wrapper.
 */
export default function SteelToolsClient() {
  const tCommon = useCommonTranslations();
  const { dir } = useLocale();
  const [activeTab, setActiveTab] = useState<"ha" | "mesh">("ha");

  const text = (key: string, fallback: string) => {
    const translated = tCommon(key);
    return translated === key ? fallback : translated;
  };

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{text("steelCalculator", "Steel Calculator")}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ha" | "mesh")}>
        <TabsList>
          <TabsTrigger value="ha">{text("steelPageTitle", "Poids HA (Rebar Weight)")}</TabsTrigger>
          <TabsTrigger value="mesh">{text("meshPageTitle", "Welded Mesh (Treillis Soudé)")}</TabsTrigger>
        </TabsList>

        <TabsContent value="ha" className="mt-4">
          <SteelCalculatorClient embedded />
        </TabsContent>

        <TabsContent value="mesh" className="mt-4">
          <MeshCalculatorClient embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
