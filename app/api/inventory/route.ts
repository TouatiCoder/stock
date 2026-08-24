import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { inventoryService } from "@/lib/services/inventoryService";

export async function PATCH(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const materialId = typeof body?.material_id === "string" ? body.material_id : "";
    const warehouseId = typeof body?.warehouse_id === "string" ? body.warehouse_id : "";
    const quantity = Number(body?.quantity);

    if (!materialId || !warehouseId || !Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "Material, warehouse and a non-negative quantity are required" },
        { status: 400 },
      );
    }

    const [material, warehouse] = await Promise.all([
      db.material.findFirst({
        where: { id: materialId, companyId: user.companyId },
        select: { id: true },
      }),
      db.warehouse.findFirst({
        where: { id: warehouseId, companyId: user.companyId },
        select: { id: true },
      }),
    ]);

    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    if (!warehouse) return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });

    const inventoryRow = await db.inventory.findFirst({
      where: { materialId, warehouseId, companyId: user.companyId },
      orderBy: { createdAt: "asc" },
    });

    if (inventoryRow) {
      const updated = await db.inventory.update({
        where: { id: inventoryRow.id },
        data: { quantity: new Prisma.Decimal(String(quantity)), updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, quantity: Number(updated.quantity) });
    }

    const created = await db.inventory.create({
      data: {
        materialId,
        warehouseId,
        quantity: new Prisma.Decimal(String(quantity)),
        minThreshold: new Prisma.Decimal(0),
        maxThreshold: null,
        companyId: user.companyId,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, quantity: Number(created.quantity) });
  } catch (error) {
    console.error("Error setting inventory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const operation = typeof body?.operation === "string" ? body.operation : "entry";
    const materialId = typeof body?.material_id === "string" ? body.material_id : "";
    const quantity = Number(body?.quantity);
    const notes = typeof body?.notes === "string" ? body.notes : "";

    if (!materialId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Material and a positive quantity are required" }, { status: 400 });
    }

    if (operation === "entry") {
      const warehouseId = typeof body?.warehouse_id === "string" ? body.warehouse_id : "";
      if (!warehouseId) {
        return NextResponse.json({ error: "Destination warehouse is required" }, { status: 400 });
      }

      const movement = await inventoryService.recordStockEntry({
        companyId: user.companyId,
        userId: user.id,
        materialId,
        warehouseId,
        quantity,
        notes,
      });

      return NextResponse.json({
        success: true,
        message: "Stock entry recorded",
        id: movement.id,
      });
    }

    if (operation === "transfer") {
      const sourceWarehouseId = typeof body?.source_warehouse_id === "string" ? body.source_warehouse_id : "";
      const destinationWarehouseId =
        typeof body?.destination_warehouse_id === "string" ? body.destination_warehouse_id : "";

      if (!sourceWarehouseId || !destinationWarehouseId) {
        return NextResponse.json({ error: "Source and destination warehouses are required" }, { status: 400 });
      }

      const movement = await inventoryService.transferStockBetweenWarehouses({
        companyId: user.companyId,
        userId: user.id,
        materialId,
        sourceWarehouseId,
        destinationWarehouseId,
        quantity,
        notes,
      });

      return NextResponse.json({
        success: true,
        message: "Stock transfer recorded",
        id: movement.id,
      });
    }

    return NextResponse.json({ error: "Unsupported inventory operation" }, { status: 400 });
  } catch (error) {
    console.error("Error updating inventory:", error);

    if (error instanceof Error) {
      const knownMessages = new Set([
        "Material not found",
        "Warehouse not found",
        "Insufficient stock in source warehouse",
        "Source and destination warehouses must be different",
        "Quantity must be greater than zero",
      ]);

      if (knownMessages.has(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
