import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { inventoryService } from "@/lib/services/inventoryService"
import { requireRoles } from "@/lib/backlog/security"

export async function GET() {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"])
  if (auth.error || !auth.user) return auth.error

  try {
    const [categories, suppliers] = await Promise.all([
      inventoryService.getCategories(auth.user.companyId),
      db.supplier.findMany({
        where: {
          companyId: auth.user.companyId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ])

    return NextResponse.json({ categories, suppliers })
  } catch (error) {
    console.error("Inventory material filters error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory filters" }, { status: 500 })
  }
}
