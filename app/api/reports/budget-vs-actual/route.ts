import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  try {
    const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
    if (auth.error || !auth.user) return auth.error;

    const rows = await db.$queryRaw<Array<{ project_id: string; budget: any; actual: any }>>(
      Prisma.sql`
        SELECT
          p.id AS project_id,
          COALESCE(p.total_budget, 0) AS budget,
          COALESCE(SUM(pe.amount), 0) AS actual
        FROM projects p
        LEFT JOIN project_expenses pe ON pe.project_id = p.id
        WHERE p.company_id = ${auth.user.companyId}
        GROUP BY p.id, p.total_budget
        ORDER BY p.created_at DESC
      `,
    );

    return NextResponse.json({
      items: rows.map((r) => ({
        project_id: r.project_id,
        budget: Number(r.budget || 0),
        actual: Number(r.actual || 0),
        variance: Number(r.budget || 0) - Number(r.actual || 0),
      })),
    });
  } catch (error) {
    console.error("budget-vs-actual report error:", error);
    return NextResponse.json({ error: "Failed to load budget vs actual" }, { status: 500 });
  }
}
