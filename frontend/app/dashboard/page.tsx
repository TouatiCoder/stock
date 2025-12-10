import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./_components/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient(); // ✅ AJOUTE "await"

  // Récupération utilisateur connecté (SSR)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Charger le profil utilisateur dans ta table "users"
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Charger toutes les données nécessaires au dashboard
  const { data: projects = [] } = await supabase
    .from("projects")
    .select("*")
    .limit(10); // Limite pour performance

  const { data: expenses = [] } = await supabase
    .from("expenses")
    .select("*")
    .limit(20);

  const { data: inventory = [] } = await supabase
    .from("inventory_items")
    .select("*")
    .limit(50);

  // Récupérer l'équipe (utilisateurs avec rôle)
  const { data: team = [] } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardContent
      initialUser={profile || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'user'
      }}        
      initialProjects={projects}   
      initialExpenses={expenses}   
      initialInventory={inventory} 
      initialTeam={team}           
    />
  );
}