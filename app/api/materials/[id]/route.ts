import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { DUPLICATE_BARCODE_MESSAGE, isDuplicateBarcodeError, parseBarcode } from "@/lib/materials/barcode";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const material = await db.material.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        isActive: true,
      },
      include: {
        supplier: true,
        inventory: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(material, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      unit,
      unitPrice,
      category,
      supplierId,
      companyId,
      minStockLevel,
      maxStockLevel,
    } = body;
    // Only changed when the client sends it (older clients do not).
    const barcode = parseBarcode(body.barcode);

    // Verify the material belongs to the user's company
    const existingMaterial = await db.material.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        isActive: true,
      },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Update the material
    const updatedMaterial = await db.material.update({
      where: { id: params.id },
      data: {
        name,
        description,
        unit,
        unitPrice: unitPrice ? new Prisma.Decimal(String(unitPrice)) : null,
        category,
        supplierId: supplierId || null,
        ...(barcode !== undefined ? { barcode } : {}),
        updatedAt: new Date(),
      },
      include: {
        supplier: true,
      },
    });

    // Update or create inventory entry
    const existingInventory = await db.inventory.findFirst({
      where: { materialId: params.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingInventory) {
      await db.inventory.update({
        where: { id: existingInventory.id },
        data: {
          minThreshold: minStockLevel ? new Prisma.Decimal(String(minStockLevel)) : new Prisma.Decimal(0),
          maxThreshold: maxStockLevel ? new Prisma.Decimal(String(maxStockLevel)) : null,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.inventory.create({
        data: {
          materialId: params.id,
          quantity: new Prisma.Decimal(0),
          minThreshold: minStockLevel ? new Prisma.Decimal(String(minStockLevel)) : new Prisma.Decimal(0),
          maxThreshold: maxStockLevel ? new Prisma.Decimal(String(maxStockLevel)) : null,
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(updatedMaterial);
  } catch (error: unknown) {
    if (isDuplicateBarcodeError(error)) {
      return NextResponse.json({ error: DUPLICATE_BARCODE_MESSAGE }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A material with this name already exists" },
        { status: 409 },
      );
    }

    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const material = await db.material.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // The archived row keeps a distinct name so a new material can reuse the
    // original one (material names are unique).
    const archivedName = `${material.name.slice(0, 220)} (archivé ${material.id.slice(0, 6)})`;

    // A material used in purchase orders or stock movements is archived instead
    // of erased: it disappears from inventory, transfers and new orders, while
    // those orders and movements keep pointing to it.
    const archive = () =>
      db.$transaction([
        db.inventory.deleteMany({ where: { materialId: material.id } }),
        db.material.update({
          where: { id: material.id },
          data: { isActive: false, name: archivedName, updatedAt: new Date() },
        }),
      ]);

    const [orderLines, movements] = await Promise.all([
      db.purchaseOrderItem.count({ where: { materialId: material.id } }),
      db.stockMovement.count({ where: { materialId: material.id } }),
    ]);

    if (orderLines > 0 || movements > 0) {
      await archive();
      return NextResponse.json({ success: true, archived: true });
    }

    try {
      await db.$transaction(async (tx) => {
        await tx.inventory.deleteMany({
          where: { materialId: material.id },
        });

        await tx.material.delete({
          where: { id: material.id },
        });
      });
    } catch (deleteError: unknown) {
      const stillReferenced =
        deleteError instanceof Prisma.PrismaClientKnownRequestError && deleteError.code === "P2003";
      if (!stillReferenced) throw deleteError;
      await archive();
      return NextResponse.json({ success: true, archived: true });
    }

    return NextResponse.json({ success: true, archived: false });
  } catch (error: unknown) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
