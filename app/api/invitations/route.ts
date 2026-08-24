import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyToken } from "@/lib/utils/edge-jwt"
import { cookies } from "next/headers"
import crypto from "crypto"
import { enforceMaxUsers, featureDeniedResponse } from "@/lib/subscription"

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get("companyId")
    if (!companyId) return NextResponse.json({ error: "companyId manquant" }, { status: 400 })

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

    // Verify user belongs to the requested company
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId }
    })

    if (!currentUser || currentUser.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch invitations
    const invitations = await db.invitation.findMany({
      where: { 
        companyId 
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(invitations)
    
  } catch (error: any) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role, companyId } = body

    if (!email || !role || !companyId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

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

    // Verify user has admin rights and belongs to the company
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId }
    })

    if (!currentUser || currentUser.role !== 'admin' || currentUser.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const maxUsers = await enforceMaxUsers(companyId, 1)
    if (!maxUsers.gate.allowed) {
      return featureDeniedResponse(
        maxUsers.gate,
        "Active user limit reached for your current subscription plan",
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    // Create invitation token and expiration
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const invitation = await db.invitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        companyId,
        invitedById: currentUser.id,
        token: invitationToken,
        expiresAt,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(invitation)
    
  } catch (err: any) {
    console.error("Create invitation error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
