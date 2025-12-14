"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import type { User, Project, Expense, InventoryItem } from "@/lib/types";

export function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Vérifier et rafraîchir la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please log in again.");
          setLoading(false);
          return;
        }
        
        if (!session?.user) {
          console.log("No user session found");
          setError("Please log in to access the dashboard");
          setLoading(false);
          return;
        }

        console.log("Dashboard - User session:", session.user.email);

        // 2. Charger les données en parallèle avec casting de types
        const [
          userResult,
          projectsResult,
          expensesResult,
          inventoryResult,
          teamResult
        ] = await Promise.all([
          // User profile
          supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data, error }: { data: any; error: any }) => ({
             data: data as User | null,
             error
       })),
          
          // Projects
          supabase
            .from("projects")
            .select("*")
            .then(({ data, error }: { data: any; error: any }) => ({
              data: data as Project[] | null,
              error
            })),
          
          // Expenses
          supabase
            .from("expenses")
            .select("*")
            .then(({ data, error }: { data: any; error: any }) => ({
              data: data as Expense[] | null,
              error
            })),
          
          // Inventory - IMPORTANT: vérifiez le nom exact de votre table
          // Option A: Si votre table s'appelle "inventory_items" (selon vos types)
          supabase
            .from("inventory_items")
            .select("*")
            .then(({ data, error }: { data: any; error: any }) => ({
              data: data as InventoryItem[] | null,
              error
            })),
          // Option B: Si votre table s'appelle "inventory" (selon votre code original)
          // supabase
          //   .from("inventory")
          //   .select("*")
          //   .then(({ data, error }) => ({
          //     data: data as InventoryItem[] | null,
          //     error
          //   })),
          
          // Team - Utilise la table "users" pour l'équipe
          supabase
            .from("users")
            .select("id, full_name, email, role, avatar_url")
            .neq("id", session.user.id)
            .then(({ data, error }: { data: any; error: any }) => ({
              data: data as User[] | null,
              error
            }))
        ]);

        // Gérer les erreurs
        if (userResult.error) console.error("User fetch error:", userResult.error);
        if (projectsResult.error) console.error("Projects fetch error:", projectsResult.error);
        if (expensesResult.error) console.error("Expenses fetch error:", expensesResult.error);
        if (inventoryResult.error) console.error("Inventory fetch error:", inventoryResult.error);
        if (teamResult.error) console.error("Team fetch error:", teamResult.error);

        // Mettre à jour les états
        setUser(userResult.data);
        setProjects(projectsResult.data || []);
        setExpenses(expensesResult.data || []);
        setInventory(inventoryResult.data || []);
        setTeam(teamResult.data || []);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-700 font-medium">Loading dashboard data...</p>
          <p className="text-sm text-slate-500">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-red-600">!</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Unable to load dashboard</h3>
          <p className="text-slate-600">{error}</p>
          <button
            onClick={() => window.location.href = "/auth/login"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-bold text-slate-900">Not Authenticated</h3>
          <p className="text-slate-600">You need to be logged in to access the dashboard</p>
          <button
            onClick={() => window.location.href = "/auth/login"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Calculs statistiques
  const projectsWithSpent = projects.map((p) => ({
    id: p.id,
    name: p.name,
    budget_mad: Number(p.budget_mad || 0),
    spent_mad: expenses
      .filter((e) => e.project_id === p.id)
      .reduce((acc, e) => acc + Number(e.amount_mad || 0), 0),
  }));

  const totalBudgetUsed = projectsWithSpent.reduce(
    (acc, p) => acc + p.spent_mad,
    0
  );

  const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget_mad || 0), 0);
  const budgetUsagePercent = totalBudget > 0 ? (totalBudgetUsed / totalBudget) * 100 : 0;

  const lowInventoryCount = inventory.filter(
    (item) => item.quantity_on_hand < item.reorder_level
  ).length;

  const inventoryValue = inventory.reduce(
    (acc, item) => acc + (item.quantity_on_hand * item.unit_cost_mad || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome, {user.full_name || user.email}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-slate-600">
            Here's your BuildStock Pro overview
          </p>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full capitalize">
            {user.role?.replace(/_/g, ' ') || 'user'}
          </span>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 hover:shadow-lg transition-shadow">
          <p className="text-sm text-slate-500 font-medium">Total Projects</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{projects.length}</p>
          <p className="text-xs text-slate-400">
            {projects.filter(p => p.status === 'active').length} active
          </p>
        </Card>

        <Card className="p-5 space-y-2 hover:shadow-lg transition-shadow">
          <p className="text-sm text-slate-500 font-medium">Budget Used</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">
            {totalBudgetUsed.toLocaleString()} MAD
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400">
            {budgetUsagePercent.toFixed(1)}% of {totalBudget.toLocaleString()} MAD total
          </p>
        </Card>

        <Card className="p-5 space-y-2 hover:shadow-lg transition-shadow">
          <p className="text-sm text-slate-500 font-medium">Inventory Value</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{inventory.length} items</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700">{inventoryValue.toLocaleString()} MAD</p>
            {lowInventoryCount > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ {lowInventoryCount} below reorder level
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-2 hover:shadow-lg transition-shadow">
          <p className="text-sm text-slate-500 font-medium">Team Members</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900">{team.length}</p>
          <div className="flex -space-x-2">
            {team.slice(0, 4).map((member) => (
              <div 
                key={member.id}
                className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-700"
                title={member.full_name || member.email}
              >
                {(member.full_name || member.email).charAt(0).toUpperCase()}
              </div>
            ))}
            {team.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                +{team.length - 4}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Graphiques et Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Budget Overview</h2>
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <OverviewCharts projects={projectsWithSpent} />
        </Card>

        <Card className="p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
          <RecentActivity userId={user.id} />
        </Card>
      </div>

      {/* Informations rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 mb-3">Recent Projects</h3>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-slate-500">{project.status}</p>
                </div>
                <span className="font-bold">{project.budget_mad?.toLocaleString()} MAD</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900 mb-3">Low Stock Items</h3>
          <div className="space-y-3">
            {inventory
              .filter(item => item.quantity_on_hand < item.reorder_level)
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">Stock: {item.quantity_on_hand} {item.unit}</p>
                  </div>
                  <span className="text-orange-600 font-medium">Reorder</span>
                </div>
              ))}
            {lowInventoryCount === 0 && (
              <p className="text-slate-500 text-center py-4">All items are well stocked</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-900 mb-3">Recent Expenses</h3>
          <div className="space-y-3">
            {expenses.slice(0, 3).map((expense) => (
              <div key={expense.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-slate-500">{expense.category}</p>
                </div>
                <span className="font-bold text-red-600">-{expense.amount_mad?.toLocaleString()} MAD</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}