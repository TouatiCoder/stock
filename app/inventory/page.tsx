import { checkAuth } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import InventoryPageClient from "@/components/inventory/inventory-page.client";

export default async function InventoryPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  return <InventoryPageClient />;
}
