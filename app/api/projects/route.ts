import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { featureGateService, FEATURE_CODES, enforceFeatureAccess } from "@/lib/subscription";

export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const limit = Number(url.searchParams.get("limit") || "10");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    const whereClause: any = { companyId: user.companyId };
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
      ];
    }
    if (status !== "all") {
      if (status === "active") {
        whereClause.status = { in: ["active", "in_progress"] };
      } else {
        whereClause.status = status;
      }
    }

    const take = limit > 0 ? limit : pageSize;
    const skip = limit > 0 ? 0 : (page - 1) * pageSize;

    const [projects, totalProjects, grouped, aggregation] = await Promise.all([
      db.project.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.project.count({ where: whereClause }),
      db.project.groupBy({
        by: ["status"],
        where: { companyId: user.companyId },
        _count: true,
      }),
      db.project.aggregate({
        where: { companyId: user.companyId },
        _sum: {
          totalBudget: true,
          currentCost: true,
        },
      }),
    ]);

    const statsMap: Record<string, number> = {};
    grouped.forEach((g) => {
      statsMap[g.status] = g._count;
    });

    const totalBudget = Number(aggregation._sum.totalBudget) || 0;
    const totalCost = Number(aggregation._sum.currentCost) || 0;
    const budgetUsage = totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0;

    const activeCount = (statsMap.active || 0) + (statsMap.in_progress || 0);

    const payload = {
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
        overBudgetCount: 0,
        budgetUsage,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      companyId,
      siteManagerId,
      structuralEngineerId
    } = body;

    if (!name || !companyId) {
      return NextResponse.json({ error: "Name and Company ID are required" }, { status: 400 });
    }

    if (user.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized for this company" }, { status: 403 });
    }

    const currentProjects = await db.project.count({
      where: { companyId: user.companyId },
    });

    const featureGate = await enforceFeatureAccess({
      companyId: user.companyId,
      featureCode: FEATURE_CODES.MAX_PROJECTS,
      options: {
        currentUsage: currentProjects,
        requestedAmount: 1,
      },
      message: "Project limit reached for your current subscription plan",
    });

    if (!featureGate.allowed) {
      return featureGate.response;
    }

    const createData = {
      name,
      description: description ?? null,
      status: status ?? "planning",
      clientName: clientName ?? null,
      clientEmail: clientEmail ?? null,
      clientPhone: clientPhone ?? null,
      address: address ?? null,
      city: city ?? null,
      postalCode: postalCode ?? null,
      projectType: projectType ?? null,
      totalBudget: typeof totalBudget === 'number' ? totalBudget : (totalBudget ? Number(totalBudget) : 0),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      companyId,
      siteManagerId: siteManagerId ?? null,
      structuralEngineerId: structuralEngineerId ?? null,
      updatedAt: new Date()
    };

    const project = await db.project.create({
      // Cast to any to avoid transient TS type mismatch when Prisma Client types lag behind the schema
      data: createData as any
    });

    await featureGateService.incrementUsage(user.companyId, FEATURE_CODES.MAX_PROJECTS, 1);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
