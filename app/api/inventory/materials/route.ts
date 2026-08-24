import { NextResponse } from "next/server";
import { inventoryService } from "@/lib/services/inventoryService";
import { requireRoles } from "@/lib/backlog/security";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const category = url.searchParams.get("category") || url.searchParams.get("categoryId") || undefined;
  const supplierId = url.searchParams.get("supplierId") || undefined;
  const lowStock = url.searchParams.get("lowStock") === "true";
  const criticalStock = url.searchParams.get("criticalStock") === "true";

  try {
    const materials = await inventoryService.getAllMaterials(auth.user.companyId, {
      search,
      category,
      supplierId,
      lowStock,
      criticalStock,
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Inventory materials error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}
