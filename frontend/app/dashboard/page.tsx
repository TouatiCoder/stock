// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient  } from "@/lib/supabase/server";
import { DashboardContent } from "./_components/dashboard-content";

export default async function DashboardPage() {
  const supabase = createClient ();

  // Récupération utilisateur connecté (SSR)
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Charger le profil utilisateur dans ta table "users"
  const { data: profile } = await (await supabase)
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Charger toutes les données nécessaires au dashboard
  const { data: projects = [] } = await (await supabase).from("projects").select("*");
  const { data: expenses = [] } = await (await supabase).from("expenses").select("*");
  const { data: inventory = [] } = await (await supabase)
    .from("inventory_items")
    .select("*");

  // ⚠️ La table "users" est protégée → nécessite policy admin pour lecture
  const { data: team = [] } = await (await supabase)
    .from("users")
    .select("id, full_name, email, role");

  return (
    <DashboardContent
      initialUser={profile}        // user complet
      initialProjects={projects}   // projets chargés
      initialExpenses={expenses}   // dépenses
      initialInventory={inventory} // inventaire
      initialTeam={team}           // équipe
    />
  );
}
