import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";
import { itemsTotal, parsePurchaseOrderItems, toItemCreateData } from "@/lib/purchase-orders/items";

interface RouteContext {
  params: { id: string };
}

/**
 * PUT /api/purchase-orders/[id]/items
 * Replaces all lines of an order and recomputes its total, like the website's
 * updateOrderFull server action. Body: { items: [{ material_id, quantity, unit_price, notes? }] }
 */
export async function PUT(req: Request, { params }: RouteContext) {
  const auth = await requireRoles(["admin", "site_manager"]);
  if (auth.error || !auth.user) return auth.error;
  const user = auth.user;

  try {
    const body = await req.json().catch(() => null);
    const parsed = parsePurchaseOrderItems(body?.items);
    if (parsed.error !== undefined) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const items = parsed.items;

    const order = await db.purchaseOrder.findFirst({
      where: { id: params.id, companyId: user.companyId },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const count = await db.material.count({
      where: { id: { in: items.map((item) => item.materialId) }, companyId: user.companyId },
    });
    if (count !== items.length) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    await db.$transaction([
      db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: order.id } }),
      db.purchaseOrder.update({
        where: { id: order.id },
        data: {
          totalAmount: itemsTotal(items),
          updatedAt: new Date(),
          items: { create: toItemCreateData(items) },
        },
      }),
    ]);

    const updated = await db.purchaseOrder.findFirst({
      where: { id: order.id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { material: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating purchase order items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
