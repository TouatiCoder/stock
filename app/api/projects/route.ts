import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import {
  featureGateService,
  FEATURE_CODES,
  enforceFeatureAccess,
} from "@/lib/subscription";

export async function GET(req: Request) {
  try {
    const user = await checkAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);

    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";

    const limit = Number(url.searchParams.get("limit") || "10");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(
      url.searchParams.get("pageSize") || "20"
    );

    /*
     * ============================================================
     * PROJECT FILTERS
     * ============================================================
     */

    const whereClause: any = {
      companyId: user.companyId,
    };

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          clientName: {
            contains: search,
          },
        },
      ];
    }

    if (status !== "all") {
      if (status === "active") {
        whereClause.status = {
          in: ["active", "in_progress"],
        };
      } else {
        whereClause.status = status;
      }
    }

    const take = limit > 0 ? limit : pageSize;
    const skip =
      limit > 0
        ? 0
        : Math.max(0, (page - 1) * pageSize);

    /*
     * ============================================================
     * FETCH DATA
     * ============================================================
     *
     * budgetProjects sert à calculer le nombre réel de projets
     * qui dépassent leur budget.
     */

    const [
      projects,
      totalProjects,
      grouped,
      aggregation,
      budgetProjects,
    ] = await Promise.all([
      /*
       * Projects utilisés par la page / dashboard.
       */
      db.project.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take,
        skip,
      }),

      /*
       * Total correspondant aux filtres actuels.
       */
      db.project.count({
        where: whereClause,
      }),

      /*
       * Répartition globale des projets par statut.
       */
      db.project.groupBy({
        by: ["status"],
        where: {
          companyId: user.companyId,
        },
        _count: true,
      }),

      /*
       * Budget et coût réel globaux.
       */
      db.project.aggregate({
        where: {
          companyId: user.companyId,
        },
        _sum: {
          totalBudget: true,
          currentCost: true,
        },
      }),

      /*
       * On récupère uniquement les valeurs nécessaires
       * pour calculer les dépassements.
       */
      db.project.findMany({
        where: {
          companyId: user.companyId,
        },
        select: {
          id: true,
          totalBudget: true,
          currentCost: true,
        },
      }),
    ]);

    /*
     * ============================================================
     * STATUS STATS
     * ============================================================
     */

    const statsMap: Record<string, number> = {};

    grouped.forEach((group) => {
      statsMap[group.status] = group._count;
    });

    const activeCount =
      (statsMap.active || 0) +
      (statsMap.in_progress || 0);

    /*
     * ============================================================
     * GLOBAL BUDGET / COST
     * ============================================================
     */

    const totalBudget =
      Number(aggregation._sum.totalBudget) || 0;

    const totalCost =
      Number(aggregation._sum.currentCost) || 0;

    const budgetUsage =
      totalBudget > 0
        ? Math.round((totalCost / totalBudget) * 100)
        : 0;

    /*
     * ============================================================
     * OVER-BUDGET PROJECTS
     * ============================================================
     *
     * Écart = Budget - Coût réel
     *
     * Si :
     * Budget = 100 000
     * Réel   = 120 000
     *
     * Écart = -20 000
     *
     * Donc le projet est en dépassement.
     */

    const overBudgetProjects = budgetProjects.filter(
      (project) => {
        const budget =
          Number(project.totalBudget) || 0;

        const actual =
          Number(project.currentCost) || 0;

        /*
         * On considère uniquement les projets avec
         * un budget réellement défini.
         */
        if (budget <= 0) {
          return false;
        }

        return actual > budget;
      }
    );

    const overBudgetCount =
      overBudgetProjects.length;

    /*
     * ============================================================
     * RETURN PAYLOAD
     * ============================================================
     */

    const payload = {
      projects,

      total: totalProjects,

      stats: {
        total: totalProjects,

        active: activeCount,

        planning:
          statsMap.planning || 0,

        completed:
          statsMap.completed || 0,

        paused:
          statsMap.paused || 0,

        cancelled:
          statsMap.cancelled || 0,

        totalBudget,

        totalCost,

        overBudgetCount,

        budgetUsage,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      "Error fetching projects:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ================================================================
 * CREATE PROJECT
 * ================================================================
 */

export async function POST(req: Request) {
  try {
    const user = await checkAuth();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
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
      structuralEngineerId,
    } = body;

    /*
     * ============================================================
     * BASIC VALIDATION
     * ============================================================
     */

    if (!name || !companyId) {
      return NextResponse.json(
        {
          error:
            "Name and Company ID are required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * User can only create projects for his own company.
     */
    if (user.companyId !== companyId) {
      return NextResponse.json(
        {
          error:
            "Unauthorized for this company",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ============================================================
     * VALIDATE BUDGET
     * ============================================================
     */

    const parsedBudget =
      totalBudget === null ||
      totalBudget === undefined ||
      totalBudget === ""
        ? 0
        : Number(totalBudget);

    if (
      !Number.isFinite(parsedBudget) ||
      parsedBudget < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid total budget value",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * PROJECT LIMIT
     * ============================================================
     */

    const currentProjects =
      await db.project.count({
        where: {
          companyId: user.companyId,
        },
      });

    const featureGate =
      await enforceFeatureAccess({
        companyId: user.companyId,
        featureCode:
          FEATURE_CODES.MAX_PROJECTS,

        options: {
          currentUsage: currentProjects,
          requestedAmount: 1,
        },

        message:
          "Project limit reached for your current subscription plan",
      });

    if (!featureGate.allowed) {
      return featureGate.response;
    }

    /*
     * ============================================================
     * CREATE PROJECT
     * ============================================================
     */

    const createData = {
      name: name.trim(),

      description:
        description ?? null,

      status:
        status ?? "planning",

      clientName:
        clientName ?? null,

      clientEmail:
        clientEmail ?? null,

      clientPhone:
        clientPhone ?? null,

      address:
        address ?? null,

      city:
        city ?? null,

      postalCode:
        postalCode ?? null,

      projectType:
        projectType ?? null,

      totalBudget:
        parsedBudget,

      startDate:
        startDate
          ? new Date(startDate)
          : null,

      endDate:
        endDate
          ? new Date(endDate)
          : null,

      companyId,

      siteManagerId:
        siteManagerId ?? null,

      structuralEngineerId:
        structuralEngineerId ?? null,

      updatedAt:
        new Date(),
    };

    const project =
      await db.project.create({
        /*
         * Cast conservé pour éviter les problèmes
         * temporaires entre Prisma Client et schema.
         */
        data: createData as any,
      });

    /*
     * Increment subscription usage
     * only after successful project creation.
     */
    await featureGateService.incrementUsage(
      user.companyId,
      FEATURE_CODES.MAX_PROJECTS,
      1
    );

    return NextResponse.json(
      project,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creating project:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}