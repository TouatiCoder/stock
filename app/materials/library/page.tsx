import { checkAuth } from "@/lib/auth/auth-utils";
import { getTranslations } from "@/lib/server-i18n";
import { redirect } from "next/navigation";
import MaterialsLibraryClient from "./page.client";

export default async function MaterialsLibraryPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");
  const tInventory = await getTranslations("inventory");

  if (!["admin", "site_manager", "structural_engineer"].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded border bg-white p-6">
          <h1 className="text-xl font-semibold text-red-600">
            {tInventory.materialLibraryForbiddenTitle || "403 Forbidden"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {tInventory.materialLibraryForbiddenDescription || "You are not allowed to access the material library."}
          </p>
        </div>
      </div>
    );
  }

  return <MaterialsLibraryClient isAdmin={user.role === "admin"} />;
}
