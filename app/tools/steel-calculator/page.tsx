import { checkAuth } from "@/lib/auth/auth-utils";
import { getTranslations } from "@/lib/server-i18n";
import { redirect } from "next/navigation";
import SteelToolsClient from "./steel-tools.client";

export default async function SteelCalculatorPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const common = await getTranslations("common");
  const text = (key: string, fallback: string) => {
    const value = common?.[key];
    return typeof value === "string" ? value : fallback;
  };

  if (user.role !== "structural_engineer") {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">{text("steelForbiddenTitle", "403 Forbidden")}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {text("steelForbiddenDescription", "Only structural engineers can access the steel calculator.")}
          </p>
        </div>
      </div>
    );
  }

  return <SteelToolsClient />;
}
