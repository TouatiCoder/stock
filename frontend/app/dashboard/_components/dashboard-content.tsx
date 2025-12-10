"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Fingerprint, Plus } from "lucide-react";
import Link from "next/link";

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
      
      {/* SECTION PASSKEY - NOUVEAU */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Fingerprint className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Enable Windows Hello Login</h3>
              <p className="text-sm text-slate-600 mt-1">
                Add Face ID, Fingerprint, or PIN for faster, password-free access to your dashboard.
              </p>
              <div className="flex items-center mt-2 text-xs text-slate-500">
                <div className="h-1 w-1 bg-slate-400 rounded-full mr-2"></div>
                <span>More secure than passwords</span>
                <div className="h-1 w-1 bg-slate-400 rounded-full mx-2"></div>
                <span>One-tap login</span>
              </div>
            </div>
          </div>
          
          <Link href="/auth/register-passkey" className="w-full md:w-auto">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
              <Fingerprint className="mr-2 h-4 w-4" />
              Add Passkey
            </Button>
          </Link>
        </div>
      </Card>

      {/* Titre de bienvenue */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {initialUser?.full_name ?? "User"}
        </h1>
        <p className="text-slate-500">Here's your BuildStock Pro overview</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-2 hover:shadow transition-shadow">
          <p className="text-sm text-slate-500">Total Projects</p>
          <p className="text-3xl font-bold text-slate-900">{initialProjects.length}</p>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow transition-shadow">
          <p className="text-sm text-slate-500">Budget Used</p>
          <p className="text-3xl font-bold text-slate-900">
            {totalBudgetUsed.toLocaleString()} MAD
          </p>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow transition-shadow">
          <p className="text-sm text-slate-500">Inventory Items</p>
          <p className="text-3xl font-bold text-slate-900">{initialInventory.length}</p>
          {lowInventoryCount > 0 && (
            <p className="text-xs text-orange-600 font-medium">
              ⚠️ {lowInventoryCount} below reorder level
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-2 hover:shadow transition-shadow">
          <p className="text-sm text-slate-500">Team Members</p>
          <p className="text-3xl font-bold text-slate-900">{initialTeam.length}</p>
        </Card>
      </div>

      {/* Graphiques et activités */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 hover:shadow transition-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Budget Overview</h2>
          <OverviewCharts projects={projectsWithSpent} />
        </Card>

        <Card className="p-6 hover:shadow transition-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
          <RecentActivity userId={initialUser?.id} />
        </Card>
      </div>
    </div>
  );
}