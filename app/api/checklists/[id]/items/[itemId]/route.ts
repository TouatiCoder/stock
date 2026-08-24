import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const checklist = await db.checklist.findFirst({
    where: {
      id: params.id,
      companyId: auth.user.companyId,
      OR: [
        { createdById: auth.user.id },
        { project: { OR: [{ siteManagerId: auth.user.id }, { structuralEngineerId: auth.user.id }] } },
      ],
    },
    include: { items: true },
  });
  if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });

  const item = checklist.items.find((row) => row.id === params.itemId);
  if (!item) return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (typeof body?.isChecked !== "boolean") {
    return NextResponse.json({ error: "isChecked must be a boolean" }, { status: 400 });
  }

  const updatedItem = await db.checklistItem.update({
    where: { id: item.id },
    data: { isChecked: body.isChecked },
  });

  const remainingItems = checklist.items.map((row) => (row.id === item.id ? updatedItem : row));
  const allChecked = remainingItems.length > 0 && remainingItems.every((row) => row.isChecked);

  const updatedChecklist = await db.checklist.update({
    where: { id: checklist.id },
    data: {
      status: allChecked ? "completed" : "in_progress",
      completedAt: allChecked ? new Date() : null,
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ item: updatedChecklist });
}
