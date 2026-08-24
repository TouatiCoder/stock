import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { enforceMaxUsers, featureDeniedResponse, featureGateService, FEATURE_CODES } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    const invite = await db.invitation.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    const now = new Date();
    if (invite.expiresAt && invite.expiresAt.getTime() < now.getTime()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invitation already used" }, { status: 409 });
    }

    const existingUser = await db.user.findUnique({ where: { email: invite.email } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const activatesExistingUser = Boolean(existingUser && !existingUser.active);
    const createsNewActiveUser = !existingUser;

    if (activatesExistingUser || createsNewActiveUser) {
      const maxUsers = await enforceMaxUsers(invite.companyId, 1);
      if (!maxUsers.gate.allowed) {
        return featureDeniedResponse(
          maxUsers.gate,
          "Active user limit reached for your current subscription plan",
        );
      }
    }

    if (existingUser) {
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          active: true,
          updatedAt: now,
        },
      });
    } else {
      await db.user.create({
        data: {
          email: invite.email,
          firstName: "",
          lastName: "",
          role: invite.role,
          companyId: invite.companyId,
          password: hashedPassword,
          active: true,
          updatedAt: now,
        },
      });
    }

    if (activatesExistingUser || createsNewActiveUser) {
      await featureGateService.incrementUsage(invite.companyId, FEATURE_CODES.MAX_USERS, 1);
    }

    await db.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: now, updatedAt: now },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
