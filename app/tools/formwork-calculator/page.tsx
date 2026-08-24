import { checkAuth } from "@/lib/auth/auth-utils";
import { getTranslations } from "@/lib/server-i18n";
import { redirect } from "next/navigation";
import FormworkCalculatorClient from "./page.client";

export default async function FormworkCalculatorPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const common = await getTranslations("common");
  const text = (key: string, fallback: string) => {
    const value = common?.[key];
    return typeof value === "string" ? value : fallback;
  };

  if (!["structural_engineer", "site_manager"].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">{text("formworkForbiddenTitle", "403 Acces interdit")}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {text("formworkForbiddenDescription", "Vous n'etes pas autorise a acceder au calculateur de coffrage.")}
          </p>
        </div>
      </div>
    );
  }

  return <FormworkCalculatorClient />;
}
