import { Prisma } from "@prisma/client";

export type PurchaseOrderItemInput = {
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Validates order lines sent by the API clients (mobile app):
 * [{ material_id, quantity, unit_price, notes? }]. The line total is always
 * computed server-side. Returns an error message when the payload is invalid.
 */
export function parsePurchaseOrderItems(
  raw: unknown,
): { items: PurchaseOrderItemInput[]; error?: undefined } | { items?: undefined; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "At least one order item is required" };

  const items: PurchaseOrderItemInput[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const materialId = typeof entry?.material_id === "string" ? entry.material_id.trim() : "";
    const quantity = Number(entry?.quantity);
    const unitPrice = Number(entry?.unit_price);
    if (!materialId) return { error: "Each item needs a material" };
    if (seen.has(materialId)) return { error: "Each material can only appear once" };
    if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Item quantity must be greater than zero" };
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: "Item unit price must be zero or more" };
    seen.add(materialId);
    items.push({
      materialId,
      quantity: round2(quantity),
      unitPrice: round2(unitPrice),
      totalPrice: round2(quantity * unitPrice),
      notes: typeof entry?.notes === "string" && entry.notes.trim() ? entry.notes.trim() : null,
    });
  }
  return { items };
}

export function itemsTotal(items: PurchaseOrderItemInput[]) {
  return round2(items.reduce((sum, item) => sum + item.totalPrice, 0));
}

export function toItemCreateData(items: PurchaseOrderItemInput[]) {
  return items.map((item) => ({
    materialId: item.materialId,
    quantity: new Prisma.Decimal(String(item.quantity)),
    unitPrice: new Prisma.Decimal(String(item.unitPrice)),
    totalPrice: new Prisma.Decimal(String(item.totalPrice)),
    notes: item.notes,
    updatedAt: new Date(),
  }));
}

/** Same format as the website's order form: CMD-YYMMDD-NNN. */
export function generateOrderNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `CMD-${yy}${mm}${dd}-${random}`;
}
