// app/dashboard/_components/dashboard-content.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getSupabaseClient } from "@/lib/supabase/client";

interface DashboardContentProps {
  initialUser: any;
}

export function DashboardContent({ initialUser }: DashboardContentProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [],
    expenses: [],
    inventory: [],
    team: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabaseClient();
        
        // Fetch data client-side
        const [projectsRes, expensesRes, inventoryRes, teamRes] = await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("expenses").select("*"),
          supabase.from("inventory_items").select("*"),
          supabase.from("users").select("id"),
        ]);

        setData({
          projects: projectsRes.data || [],
          expenses: expensesRes.data || [],
          inventory: inventoryRes.data || [],
          team: teamRes.data || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-64 bg-slate-200 rounded"></div>
        </div>
        {/* Squelette de chargement */}
      </div>
    );
  }

  // Calculs
  const projectsWithSpent = data.projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    budget_mad: Number(p.budget_mad || 0),
    spent_mad: data.expenses
      .filter((e: any) => e.project_id === p.id)
      .reduce((acc: number, e: any) => acc + Number(e.amount_mad || 0), 0),
  }));

  const totalBudgetUsed = projectsWithSpent.reduce((acc: number, p: any) => acc + p.spent_mad, 0);
  const lowInventoryCount = data.inventory.filter((item: any) => 
    item.quantity_on_hand < item.reorder_level
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {initialUser.full_name}
        </h1>
        <p className="text-slate-500">Here's your BuildStock Pro overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Total Projects</p>
          <p className="text-3xl font-bold text-slate-900">{data.projects.length}</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Budget Used</p>
          <p className="text-3xl font-bold text-slate-900">
            {totalBudgetUsed.toLocaleString()} MAD
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Inventory Items</p>
          <p className="text-3xl font-bold text-slate-900">{data.inventory.length}</p>
          {lowInventoryCount > 0 && (
            <p className="text-xs text-orange-600">
              {lowInventoryCount} below reorder level
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Team Members</p>
          <p className="text-3xl font-bold text-slate-900">{data.team.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Budget Overview</h2>
          <OverviewCharts projects={projectsWithSpent} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
          <RecentActivity userId={initialUser.id} />
        </Card>
      </div>
    </div>
  );
}