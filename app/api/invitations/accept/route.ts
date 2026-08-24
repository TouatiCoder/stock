import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { enforceMaxUsers, featureDeniedResponse, featureGateService, FEATURE_CODES } from "@/lib/subscription";

/** Accept invitation: create user and mark invitation accepted. Uses Prisma (MySQL). */
export async function POST(request: NextRequest) {
  try {
    const { token, password, firstName, lastName } = await request.json();

    if (!token || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Token, password, firstName and lastName are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const invitation = await db.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const maxUsers = await enforceMaxUsers(invitation.companyId, 1);
    if (!maxUsers.gate.allowed) {
      return featureDeniedResponse(
        maxUsers.gate,
        "Active user limit reached for your current subscription plan",
      );
    }

    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: randomUUID(),
          email: invitation.email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: invitation.role,
          companyId: invitation.companyId,
          active: true,
          updatedAt: now,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: now, updatedAt: now },
      });

      await featureGateService.incrementUsage(
        invitation.companyId,
        FEATURE_CODES.MAX_USERS,
        1,
        null,
        tx,
      );
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
