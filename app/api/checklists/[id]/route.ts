import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

const CHECKLIST_TYPES = new Set(["safety", "daily", "quality", "equipment", "general"]);

async function findAccessibleChecklist(params: { id: string; userId: string; companyId: string }) {
  return db.checklist.findFirst({
    where: {
      id: params.id,
      companyId: params.companyId,
      OR: [
        { createdById: params.userId },
        { project: { OR: [{ siteManagerId: params.userId }, { structuralEngineerId: params.userId }] } },
      ],
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { position: "asc" } },
    },
  });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const checklist = await findAccessibleChecklist({ id: params.id, userId: auth.user.id, companyId: auth.user.companyId });
  if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });

  return NextResponse.json({ item: checklist });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const existing = await findAccessibleChecklist({ id: params.id, userId: auth.user.id, companyId: auth.user.companyId });
  if (!existing) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; checklistType?: string; status?: string; completedAt?: Date | null } = {};

  if (typeof body?.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body?.checklistType === "string" && CHECKLIST_TYPES.has(body.checklistType)) {
    data.checklistType = body.checklistType;
  }
  if (body?.status === "completed" || body?.status === "in_progress") {
    data.status = body.status;
    data.completedAt = body.status === "completed" ? new Date() : null;
  }

  const updated = await db.checklist.update({
    where: { id: existing.id },
    data,
    include: {
      project: { select: { id: true, name: true } },
      items: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const existing = await db.checklist.findFirst({
    where: { id: params.id, companyId: auth.user.companyId, createdById: auth.user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });

  await db.checklist.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true });
}
