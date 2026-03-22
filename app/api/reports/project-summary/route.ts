import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  try {
    const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
    if (auth.error || !auth.user) return auth.error;

    const rows = await db.$queryRaw<Array<{ project_id: string; project_name: string; status: string; budget: any; expenses: any }>>(
      Prisma.sql`
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          p.status,
          COALESCE(p.total_budget, 0) AS budget,
          COALESCE((SELECT SUM(pe.amount) FROM project_expenses pe WHERE pe.project_id = p.id), 0) AS expenses
        FROM projects p
        WHERE p.company_id = ${auth.user.companyId}
        ORDER BY p.created_at DESC
      `,
    );

    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error("project-summary report error:", error);
    return NextResponse.json({ error: "Failed to load project summary" }, { status: 500 });
  }
}
