import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    
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

    return NextResponse.json(suppliers);

  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}