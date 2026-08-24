import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFeature, FEATURE_CODES } from "@/lib/subscription";

export async function GET() {
  try {
    const feature = await requireFeature(FEATURE_CODES.ADVANCED_ANALYTICS);
    if (feature.error || !feature.user) {
      return feature.error;
    }

    const companyId = feature.user.companyId;

    const [grouped, aggregation, totalProjects] = await Promise.all([
      db.project.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
      }),
      db.project.aggregate({
        where: { companyId },
        _sum: {
          totalBudget: true,
          currentCost: true,
        },
      }),
      db.project.count({ where: { companyId } }),
    ]);

    const statsMap: Record<string, number> = {};
    grouped.forEach((g) => {
      statsMap[g.status] = g._count;
    });

    const totalBudget = Number(aggregation._sum.totalBudget) || 0;
    const totalCost = Number(aggregation._sum.currentCost) || 0;

    return NextResponse.json({
      total: totalProjects,
      active: statsMap.active || 0,
      planning: statsMap.planning || 0,
      completed: statsMap.completed || 0,
      paused: statsMap.paused || 0,
      cancelled: statsMap.cancelled || 0,
      totalBudget,
      totalCost,
      budgetUsage: totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0,
    });
  } catch (error) {
    console.error("Project analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
