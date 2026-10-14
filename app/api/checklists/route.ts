import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";
import { buildLinkedProjectWhere } from "@/lib/calculators/project-link";

const CHECKLIST_TYPES = new Set(["safety", "daily", "quality", "equipment", "general"]);
const STATUSES = new Set(["in_progress", "completed"]);

/**
 * Resolves the optional project a checklist is linked to. Scoped to the
 * authenticated user's company - the same scope the project dropdown offers -
 * so any project the user can pick can also be saved, and a project of another
 * company never resolves. No project selected stays valid: the link is optional.
 */
async function resolveAuthorizedProjectId(params: {
  projectId?: string | null;
  role: string;
  userId: string;
  companyId: string;
}) {
  if (!params.projectId) return null;

  const project = await db.project.findFirst({
    where: buildLinkedProjectWhere({ projectId: params.projectId, companyId: params.companyId }),
    select: { id: true },
  });

  return project?.id ?? null;
}

export async function GET(req: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const checklistType = url.searchParams.get("type");
  const limitParam = Number(url.searchParams.get("limit"));
  const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;

  if (status && !STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (checklistType && !CHECKLIST_TYPES.has(checklistType)) {
    return NextResponse.json({ error: "Invalid checklist type" }, { status: 400 });
  }

  const rows = await db.checklist.findMany({
    where: {
      companyId: auth.user.companyId,
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(checklistType ? { checklistType } : {}),
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      items: { select: { id: true, isChecked: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      checklistType: row.checklistType,
      status: row.status,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      project: row.project,
      createdBy: row.createdBy,
      itemsTotal: row.items.length,
      itemsChecked: row.items.filter((item) => item.isChecked).length,
    })),
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const checklistType = CHECKLIST_TYPES.has(body?.checklistType) ? body.checklistType : "general";
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : null;
  const items = Array.isArray(body?.items)
    ? body.items
        .filter((label: unknown) => typeof label === "string" && label.trim().length > 0)
        .map((label: string) => label.trim())
    : [];

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const authorizedProjectId = await resolveAuthorizedProjectId({
    projectId,
    role: auth.user.role,
    userId: auth.user.id,
    companyId: auth.user.companyId,
  });

  if (projectId && !authorizedProjectId) {
    return NextResponse.json({ error: "Forbidden project access" }, { status: 403 });
  }

  const created = await db.checklist.create({
    data: {
      companyId: auth.user.companyId,
      projectId: authorizedProjectId,
      createdById: auth.user.id,
      title,
      checklistType,
      updatedAt: new Date(),
      items: {
        create: items.map((label: string, index: number) => ({ label, position: index, updatedAt: new Date() })),
      },
    },
    include: {
      project: { select: { id: true, name: true } },
      items: true,
    },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
