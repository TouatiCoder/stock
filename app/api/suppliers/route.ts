import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ALWAYS use authenticated user's companyId - NO parameter override allowed
    const companyId = user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    const suppliers = await db.supplier.findMany({
      where: { 
        companyId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(suppliers, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}