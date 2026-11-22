import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { parseBarcode } from "@/lib/materials/barcode";

/**
 * GET /api/materials/by-code?code=...
 * Finds the active material of the user's company carrying this QR / barcode
 * (used by the mobile scanner). 404 when no material has this code.
 */
export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const code = parseBarcode(new URL(req.url).searchParams.get("code"));
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const material = await db.material.findFirst({
      where: { companyId: user.companyId, barcode: code, isActive: true },
      select: { id: true, name: true, unit: true, unitPrice: true, supplierId: true, barcode: true },
    });

    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    return NextResponse.json({
      ...material,
      unitPrice: material.unitPrice != null ? Number(material.unitPrice) : null,
    });
  } catch (error) {
    console.error("Error finding material by code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
