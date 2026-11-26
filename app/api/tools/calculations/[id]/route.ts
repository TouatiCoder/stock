import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";

interface RouteContext {
  params: { id: string };
}

/**
 * DELETE /api/tools/calculations/[id]
 * Deletes one saved calculation. Same scope as the list (GET /api/tools/calculations):
 * only the user who saved it, inside their company, can delete it.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  try {
    const result = await db.toolCalculation.deleteMany({
      where: { id: params.id, companyId: auth.user.companyId, userId: auth.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    console.error("Error deleting tool calculation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
