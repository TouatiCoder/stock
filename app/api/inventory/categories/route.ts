import { NextResponse } from "next/server"
import { requireRoles } from "@/lib/backlog/security"
import { db } from "@/lib/db"

// PATCH /api/inventory/categories — rename a category
export async function PATCH(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"])
  if (auth.error || !auth.user) return auth.error

  const { oldName, newName } = await req.json()
  if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
    return NextResponse.json({ error: "oldName and newName are required" }, { status: 400 })
  }

  await db.material.updateMany({
    where: { companyId: auth.user.companyId, category: oldName },
    data: { category: newName.trim() },
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/inventory/categories — delete one (?name=xxx) or all
export async function DELETE(req: Request) {
  const auth = await requireRoles(["admin", "site_manager", "structural_engineer"])
  if (auth.error || !auth.user) return auth.error

  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")

  if (name) {
    await db.material.updateMany({
      where: { companyId: auth.user.companyId, category: name },
      data: { category: null },
    })
  } else {
    await db.material.updateMany({
      where: { companyId: auth.user.companyId },
      data: { category: null },
    })
  }

  return NextResponse.json({ success: true })
}
