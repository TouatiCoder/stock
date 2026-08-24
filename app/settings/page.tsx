import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import SettingsClient from "./settings-client";
import { t } from "@/lib/server-i18n";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const title = await t("settings", "pageTitle");
  const subtitle = await t("settings", "pageSubtitle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>

      <SettingsClient userData={user} />
    </div>
  );
}
