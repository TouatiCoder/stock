import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  const existing = await db.material.findFirst({
    where: { id: params.id, companyId: auth.user.companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const unit = typeof body?.unit === "string" ? body.unit.trim() : undefined;
  const description = typeof body?.description === "string" ? body.description.trim() : undefined;
  const category = typeof body?.category === "string" ? body.category.trim() : undefined;
  const unitPrice = body?.unitPrice === undefined ? undefined : toNumber(body.unitPrice);
  const supplierId = body?.supplierId === undefined ? undefined : (body.supplierId ? String(body.supplierId).trim() : null);

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (unit !== undefined && !unit) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  if (supplierId) {
    const supplier = await db.supplier.findFirst({
      where: { id: supplierId, companyId: auth.user.companyId },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
    }
  }

  const updated = await db.material.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(unit !== undefined ? { unit } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(unitPrice !== undefined ? { unitPrice } : {}),
      ...(supplierId !== undefined ? { supplierId } : {}),
      updatedAt: new Date(),
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    unit: updated.unit,
    unitPrice: toNumber(updated.unitPrice),
    category: updated.category,
    supplier: updated.supplier,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  const existing = await db.material.findFirst({
    where: { id: params.id, companyId: auth.user.companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  await db.material.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

