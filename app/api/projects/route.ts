import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import {
  featureGateService,
  FEATURE_CODES,
  enforceFeatureAccess,
} from "@/lib/subscription";

function parseOptionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${field}`);
  return date;
}

export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const rawLimit = Number(url.searchParams.get("limit") || "10");
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "20")));
    const limit = Number.isFinite(rawLimit) ? Math.min(100, rawLimit) : 10;

    const whereClause: any = { companyId: user.companyId };
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
      ];
    }
    if (status !== "all") {
      whereClause.status = status === "active" ? { in: ["active", "in_progress"] } : status;
    }

    const take = limit > 0 ? limit : pageSize;
    const skip = limit > 0 ? 0 : (page - 1) * pageSize;

    const [projects, totalProjects, grouped, aggregation, budgetProjects] = await Promise.all([
      db.project.findMany({ where: whereClause, orderBy: { createdAt: "desc" }, take, skip }),
      db.project.count({ where: whereClause }),
      db.project.groupBy({ by: ["status"], where: { companyId: user.companyId }, _count: true }),
      db.project.aggregate({ where: { companyId: user.companyId }, _sum: { totalBudget: true, currentCost: true } }),
      db.project.findMany({
        where: { companyId: user.companyId },
        select: { id: true, totalBudget: true, currentCost: true },
      }),
    ]);

    const statsMap: Record<string, number> = {};
    grouped.forEach((group) => { statsMap[group.status] = group._count; });

    const totalBudget = Number(aggregation._sum.totalBudget) || 0;
    const totalCost = Number(aggregation._sum.currentCost) || 0;
    const budgetUsage = totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0;
    const activeCount = (statsMap.active || 0) + (statsMap.in_progress || 0);
    const overBudgetCount = budgetProjects.filter((project) => {
      const budget = Number(project.totalBudget) || 0;
      const actual = Number(project.currentCost) || 0;
      return budget > 0 && actual > budget;
    }).length;

    return NextResponse.json({
      projects,
      total: totalProjects,
      stats: {
        total: totalProjects,
        active: activeCount,
        planning: statsMap.planning || 0,
        completed: statsMap.completed || 0,
        paused: statsMap.paused || 0,
        cancelled: statsMap.cancelled || 0,
        totalBudget,
        totalCost,
        overBudgetCount,
        budgetUsage,
      },
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      description,
      clientName,
      clientEmail,
      clientPhone,
      address,
      city,
      postalCode,
      projectType,
      status,
      totalBudget,
      startDate,
      endDate,
      siteManagerId,
      structuralEngineerId,
    } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const parsedBudget = totalBudget === null || totalBudget === undefined || totalBudget === "" ? 0 : Number(totalBudget);
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json({ error: "Invalid total budget value" }, { status: 400 });
    }

    let parsedStartDate: Date | null;
    let parsedEndDate: Date | null;
    try {
      parsedStartDate = parseOptionalDate(startDate, "start date");
      parsedEndDate = parseOptionalDate(endDate, "end date");
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid project date" }, { status: 400 });
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
    }

    const currentProjects = await db.project.count({ where: { companyId: user.companyId } });
    const featureGate = await enforceFeatureAccess({
      companyId: user.companyId,
      featureCode: FEATURE_CODES.MAX_PROJECTS,
      options: { currentUsage: currentProjects, requestedAmount: 1 },
      message: "Project limit reached for your current subscription plan",
    });

    if (!featureGate.allowed) return featureGate.response;

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        status: status ?? "planning",
        clientName: clientName ?? null,
        clientEmail: clientEmail ?? null,
        clientPhone: clientPhone ?? null,
        address: address ?? null,
        city: city ?? null,
        postalCode: postalCode ?? null,
        projectType: projectType ?? null,
        totalBudget: parsedBudget,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        companyId: user.companyId,
        siteManagerId: siteManagerId ?? null,
        structuralEngineerId: structuralEngineerId ?? null,
        updatedAt: new Date(),
      } as any,
    });

    await featureGateService.incrementUsage(user.companyId, FEATURE_CODES.MAX_PROJECTS, 1);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
