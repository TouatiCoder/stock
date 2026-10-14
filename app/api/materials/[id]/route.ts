import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

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

    // Verify the material belongs to the user's company
    const existingMaterial = await db.material.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
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
      },
      select: { id: true },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.inventory.deleteMany({
        where: { materialId: params.id },
      });

      await tx.material.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete this material because it is used in other records." },
        { status: 409 },
      );
    }

    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
