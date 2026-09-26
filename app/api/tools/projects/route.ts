import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";
import { buildToolProjectsWhere } from "@/lib/calculators/project-link";

export async function GET(request: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(request.url);
  const where = buildToolProjectsWhere({
    companyId: auth.user.companyId,
    userId: auth.user.id,
    role: auth.user.role,
    scope: url.searchParams.get("scope"),
  });

  const projects = await db.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: projects });
}
