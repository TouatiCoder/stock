import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator, BookOpen, Building2, Ruler, Weight } from "lucide-react";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getTranslations } from "@/lib/server-i18n";

export default async function NewCalculationPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const tCommon = await getTranslations("common");

  if (!["structural_engineer", "site_manager"].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">
            {tCommon.calculationHubForbiddenTitle || "403 Forbidden"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {tCommon.calculationHubForbiddenDescription || "You are not allowed to access calculation tools."}
          </p>
        </div>
      </div>
    );
  }

  const tools = [
    {
      href: "/tools/concrete-calculator",
      title: tCommon.concreteCalculator || "Concrete Calculator",
      description: tCommon.calculationHubConcreteDescription || "Estimate concrete volume and save structural calculations.",
      icon: Building2,
    },
    {
      href: "/tools/steel-calculator",
      title: tCommon.steelCalculator || "Steel Calculator",
      description: tCommon.calculationHubSteelDescription || "Calculate reinforcement quantities for structural elements.",
      icon: Weight,
      structuralOnly: true,
    },
    {
      href: "/tools/formwork-calculator",
      title: tCommon.formworkCalculator || "Formwork Calculator",
      description: tCommon.calculationHubFormworkDescription || "Estimate formwork area and sheet requirements.",
      icon: Ruler,
    },
    {
      href: "/materials/library",
      title: tCommon.library || "Library",
      description: tCommon.calculationHubLibraryDescription || "Browse the material catalog while preparing calculations.",
      icon: BookOpen,
    },
  ].filter((tool) => (tool.structuralOnly ? user.role === "structural_engineer" : true));

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {tCommon.calculationHubTitle || "Calculation Tools"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            {tCommon.calculationHubSubtitle || "Choose a calculator to start a new structural calculation."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-700">{tool.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{tool.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-2 text-gray-900">
            <Calculator size={18} />
            <h2 className="text-base font-semibold">{tCommon.calculationHubTipTitle || "Tip"}</h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {tCommon.calculationHubTipBody || "Start with the calculator that matches your current task, then save the result to keep a calculation history."}
          </p>
        </div>
      </div>
    </div>
  );
}
