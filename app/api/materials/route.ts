import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock") === "true";

    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = user.companyId;
    if (!companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 });

    const searchLike = search ? `%${search}%` : null;
    const rows = await db.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT m.id, m.name, m.description, m.unit AS unit_of_measure, m.unit_price,
        m.category AS category_name, s.name AS supplier_name,
        COALESCE(SUM(i.quantity), 0) AS current_stock,
        COALESCE(MAX(i.min_threshold), 0) AS min_stock_level,
        COALESCE(MAX(i.min_threshold), 0) AS critical_threshold
      FROM materials m
      LEFT JOIN suppliers s ON s.id = m.supplier_id
      LEFT JOIN inventory i ON i.material_id = m.id
      WHERE m.company_id = ${companyId}
        ${category ? Prisma.sql`AND m.category = ${category}` : Prisma.empty}
        ${searchLike ? Prisma.sql`AND (m.name LIKE ${searchLike} OR m.description LIKE ${searchLike})` : Prisma.empty}
      GROUP BY m.id, m.name, m.description, m.unit, m.unit_price, m.category, s.name
      ${lowStock ? Prisma.sql`HAVING COALESCE(SUM(i.quantity), 0) <= COALESCE(MAX(i.min_threshold), 0)` : Prisma.empty}
      ORDER BY m.name ASC
    `);

    return NextResponse.json(rows.map((row) => ({
      ...row,
      category: row.category_name ? { name: row.category_name } : null,
      supplier: row.supplier_name ? { name: row.supplier_name } : null,
    })));
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, unit, unitPrice, category, supplierId, minStockLevel, maxStockLevel } = body;

    // Tenant scope must always come from the authenticated session, never from request input.
    const companyId = user.companyId;
    if (!companyId || !name?.trim() || !unit?.trim()) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const parsedUnitPrice = unitPrice == null || String(unitPrice) === "" ? null : Number(unitPrice);
    const parsedMin = minStockLevel == null || String(minStockLevel) === "" ? 0 : Number(minStockLevel);
    const parsedMax = maxStockLevel == null || String(maxStockLevel) === "" ? null : Number(maxStockLevel);

    if (parsedUnitPrice !== null && (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0)) {
      return NextResponse.json({ error: "Invalid unit price" }, { status: 400 });
    }
    if (!Number.isFinite(parsedMin) || parsedMin < 0 || (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax < 0))) {
      return NextResponse.json({ error: "Invalid stock threshold" }, { status: 400 });
    }
    if (parsedMax !== null && parsedMax < parsedMin) {
      return NextResponse.json({ error: "Maximum stock cannot be lower than minimum stock" }, { status: 400 });
    }

    if (supplierId) {
      const supplier = await db.supplier.findFirst({ where: { id: supplierId, companyId }, select: { id: true } });
      if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      const material = await tx.material.create({
        data: {
          name: name.trim(), description: description ?? null, unit: unit.trim(),
          unitPrice: parsedUnitPrice !== null ? new Prisma.Decimal(String(parsedUnitPrice)) : null,
          category: category ?? null, supplierId: supplierId ?? null, companyId, updatedAt: new Date(),
        },
      });
      await tx.inventory.create({
        data: {
          quantity: new Prisma.Decimal(0), minThreshold: new Prisma.Decimal(String(parsedMin)),
          maxThreshold: parsedMax !== null ? new Prisma.Decimal(String(parsedMax)) : null,
          materialId: material.id, companyId, updatedAt: new Date(),
        },
      });
      return material;
    });

    return NextResponse.json({
      id: created.id, name: created.name, description: created.description, unit: created.unit,
      unitPrice: created.unitPrice != null ? Number(created.unitPrice) : null,
      category: created.category, supplierId: created.supplierId, companyId: created.companyId,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A material with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
