import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function GET() {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const roleScopedWhere =
    auth.user.role === "structural_engineer"
      ? { structuralEngineerId: auth.user.id }
      : { siteManagerId: auth.user.id };

  const projects = await db.project.findMany({
    where: {
      companyId: auth.user.companyId,
      ...roleScopedWhere,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: projects });
}

