import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { requireRoles } from "@/lib/backlog/security";
import { Prisma } from "@prisma/client";
import {
  generateOrderNumber,
  itemsTotal,
  parsePurchaseOrderItems,
  toItemCreateData,
  type PurchaseOrderItemInput,
} from "@/lib/purchase-orders/items";

export async function GET(req: Request) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Number(url.searchParams.get("limit") || "50");

  try {
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(orders, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.error || !auth.user) return auth.error;
  const user = auth.user;

  try {
    const body = await req.json();
    const { supplierId, orderDate, expectedDelivery } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }

    const supplier = await db.supplier.findFirst({
      where: { id: String(supplierId), companyId: user.companyId, isActive: true },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Optional order lines (used by the mobile app). When present they are
    // created in the same transaction as the order header.
    let items: PurchaseOrderItemInput[] = [];
    if (body.items !== undefined) {
      const parsed = parsePurchaseOrderItems(body.items);
      if (parsed.error !== undefined) return NextResponse.json({ error: parsed.error }, { status: 400 });
      items = parsed.items;

      const count = await db.material.count({
        where: { id: { in: items.map((item) => item.materialId) }, companyId: user.companyId },
      });
      if (count !== items.length) {
        return NextResponse.json({ error: "Material not found" }, { status: 404 });
      }
    }

    const create = (orderNumber: string) =>
      db.purchaseOrder.create({
        data: {
          orderNumber,
          status: "pending",
          supplierId: supplier.id,
          companyId: user.companyId,
          createdById: user.id,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          totalAmount: items.length ? itemsTotal(items) : undefined,
          updatedAt: new Date(),
          ...(items.length ? { items: { create: toItemCreateData(items) } } : {}),
        },
        include: { supplier: { select: { id: true, name: true } } },
      });

    // Order numbers are unique: retry on the rare random collision.
    for (let attempt = 0; ; attempt++) {
      try {
        const order = await create(generateOrderNumber());
        return NextResponse.json(order, { status: 201 });
      } catch (error) {
        const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!duplicate || attempt >= 4) throw error;
      }
    }
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
