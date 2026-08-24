import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(request: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const where =
    scope === "company"
      ? {
          companyId: auth.user.companyId,
        }
      : {
          companyId: auth.user.companyId,
          ...(auth.user.role === "structural_engineer"
            ? { structuralEngineerId: auth.user.id }
            : { siteManagerId: auth.user.id }),
        };

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
