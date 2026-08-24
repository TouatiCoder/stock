import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Validate invitation token. Uses Prisma (MySQL). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  try {
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or invalid" },
        { status: 404 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "Invitation already accepted" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      email: invitation.email,
      role: invitation.role,
      company: {
        id: invitation.company.id,
        name: invitation.company.name,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
