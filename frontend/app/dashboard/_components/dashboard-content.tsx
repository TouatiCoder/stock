"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export function DashboardContent({ 
  initialUser, 
  initialProjects, 
  initialExpenses, 
  initialInventory, 
  initialTeam 
}: any) {

  const projectsWithSpent = initialProjects.map((p: any) => ({
    id: p.id,
    name: p.name,
    budget_mad: Number(p.budget_mad || 0),
    spent_mad: initialExpenses
      .filter((e: any) => e.project_id === p.id)
      .reduce((acc: number, e: any) => acc + Number(e.amount_mad || 0), 0),
  }));

  const totalBudgetUsed = projectsWithSpent.reduce(
    (acc: number, p: any) => acc + p.spent_mad, 
    0
  );

  const lowInventoryCount = initialInventory.filter(
    (item: any) => item.quantity_on_hand < item.reorder_level
  ).length;

  return (
    <div className="p-6 space-y-6">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {initialUser?.full_name ?? "User"}
        </h1>
        <p className="text-slate-500">Here's your BuildStock Pro overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Total Projects</p>
          <p className="text-3xl font-bold text-slate-900">{initialProjects.length}</p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Budget Used</p>
          <p className="text-3xl font-bold text-slate-900">
            {totalBudgetUsed.toLocaleString()} MAD
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Inventory Items</p>
          <p className="text-3xl font-bold text-slate-900">{initialInventory.length}</p>
          {lowInventoryCount > 0 && (
            <p className="text-xs text-orange-600">
              {lowInventoryCount} below reorder level
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-2">
          <p className="text-sm text-slate-500">Team Members</p>
          <p className="text-3xl font-bold text-slate-900">{initialTeam.length}</p>
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
