import { NextResponse } from "next/server";
import { inventoryService } from "@/lib/services/inventoryService";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || "10");

  try {
    const movements = await inventoryService.getRecentStockMovements(auth.user.companyId, limit);
    return NextResponse.json(movements);
  } catch (error) {
    console.error("Inventory movements error:", error);
    return NextResponse.json({ error: "Failed to fetch movements" }, { status: 500 });
  }
}
