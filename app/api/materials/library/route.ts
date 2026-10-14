import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();

  const whereClause = {
    companyId: auth.user.companyId,
    ...(category && category !== "all" ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { category: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, categories] = await Promise.all([
    db.material.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.material.findMany({
      where: {
        companyId: auth.user.companyId,
        NOT: [{ category: null }],
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unit: item.unit,
      unitPrice: toNumber(item.unitPrice),
      category: item.category,
      supplier: item.supplier,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    categories: categories
      .map((row) => row.category)
      .filter((value): value is string => Boolean(value)),
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const unit = String(body?.unit || "").trim();
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const category = typeof body?.category === "string" ? body.category.trim() : null;
  const supplierId = typeof body?.supplierId === "string" ? body.supplierId.trim() : null;
  const unitPrice = toNumber(body?.unitPrice);

  if (!name || !unit) {
    return NextResponse.json({ error: "name and unit are required" }, { status: 400 });
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

  const created = await db.material.create({
    data: {
      name,
      description,
      unit,
      unitPrice: unitPrice == null ? null : unitPrice,
      category,
      supplierId,
      companyId: auth.user.companyId,
      updatedAt: new Date(),
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      name: created.name,
      description: created.description,
      unit: created.unit,
      unitPrice: toNumber(created.unitPrice),
      category: created.category,
      supplier: created.supplier,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
    { status: 201 },
  );
}
