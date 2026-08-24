import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyToken } from "@/lib/utils/edge-jwt"
import { cookies } from "next/headers"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Verify authentication
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has permission to delete invitations
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete invitation
    await db.invitation.delete({
      where: { 
        id,
        companyId: currentUser.companyId
      }
    })

    return NextResponse.json({ success: true })
    
  } catch (err: any) {
    console.error("Delete invitation error:", err)
    return NextResponse.json({ success: false, message: err.message }, { status: 400 })
  }
}