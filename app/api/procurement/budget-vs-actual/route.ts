import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const projectId = String(url.searchParams.get("projectId") || "");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const [project] = await db.$queryRaw<Array<{ id: string; total_budget: any; current_cost: any }>>(
    Prisma.sql`
      SELECT id, total_budget, current_cost
      FROM projects
      WHERE id = ${projectId} AND company_id = ${auth.user.companyId}
      LIMIT 1
    `,
  );

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [expense] = await db.$queryRaw<Array<{ total: any }>>(
    Prisma.sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM project_expenses
      WHERE project_id = ${projectId} AND company_id = ${auth.user.companyId}
    `,
  );

  const budget = Number(project.total_budget || 0);
  const actual = Number(expense?.total || 0);

  return NextResponse.json({
    project_id: projectId,
    budget,
    actual,
    variance: budget - actual,
    over_budget: actual > budget,
  });
}