// app/dashboard/page.tsx
import { getServerUser } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "./_components/dashboard-content";

export default async function DashboardPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Retourne SEULEMENT le contenu, sans layout
  return <DashboardContent initialUser={user} />;
}