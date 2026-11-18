import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { enforceMaxUsers, featureDeniedResponse } from "@/lib/subscription";
import { isRemovedUserEmail, removedUserEmail } from "@/lib/users/removed-users";

type RouteContext = { params: Promise<{ userId: string }> };

/** Loads the target of an admin action, or returns the matching error response. */
async function resolveTarget(userId: string) {
  const user = await checkAuth();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  if (user.id === userId) {
    return { error: NextResponse.json({ error: "Cannot change your own account" }, { status: 400 }) };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, email: true, active: true, isPlatformAdmin: true },
  });

  if (!target || isRemovedUserEmail(target.email)) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  if (target.companyId !== user.companyId || target.isPlatformAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { target };
}

/** PATCH { active: boolean }: activates or deactivates a company user. */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { userId } = await params;
    const { target, error } = await resolveTarget(userId);
    if (error) return error;
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (typeof body?.active !== "boolean") {
      return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
    }

    if (body.active && !target.active) {
      // An invited user has no password yet: only accepting the invitation can activate them.
      const pendingInvitation = await db.invitation.findFirst({
        where: { email: target.email, companyId: target.companyId, acceptedAt: null },
        select: { id: true },
      });
      if (pendingInvitation) {
        return NextResponse.json({ error: "This user has not accepted their invitation yet" }, { status: 409 });
      }

      const maxUsers = await enforceMaxUsers(target.companyId, 1);
      if (!maxUsers.gate.allowed) {
        return featureDeniedResponse(maxUsers.gate, "Active user limit reached for your current subscription plan");
      }
    }

    await db.user.update({
      where: { id: target.id },
      data: { active: body.active, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, active: body.active });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** Erases the account, or throws P2003 when another record still references it. */
async function eraseUser(userId: string, email: string, companyId: string) {
  await db.$transaction([
    db.project.updateMany({ where: { siteManagerId: userId }, data: { siteManagerId: null } }),
    db.project.updateMany({ where: { structuralEngineerId: userId }, data: { structuralEngineerId: null } }),
    db.invitation.deleteMany({ where: { email, companyId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}

/** Removes the person from the account while keeping the records they created. */
async function anonymizeUser(userId: string, email: string, companyId: string) {
  const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  await db.$transaction([
    db.project.updateMany({ where: { siteManagerId: userId }, data: { siteManagerId: null } }),
    db.project.updateMany({ where: { structuralEngineerId: userId }, data: { structuralEngineerId: null } }),
    db.invitation.deleteMany({ where: { email, companyId } }),
    db.webAuthnCredential.deleteMany({ where: { userId } }),
    db.webAuthnChallenge.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        email: removedUserEmail(userId),
        password: unusablePassword,
        authMethod: "password_only",
        firstName: "Utilisateur",
        lastName: "supprimé",
        phone: null,
        active: false,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      },
    }),
  ]);
}

/**
 * DELETE: deactivates the user (used by the website).
 * DELETE ?permanent=true: removes the user. An account without history is erased;
 * otherwise it is anonymized so orders, checklists and payments are kept.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { userId } = await params;
    const { target, error } = await resolveTarget(userId);
    if (error) return error;
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (new URL(req.url).searchParams.get("permanent") !== "true") {
      await db.user.update({
        where: { id: userId },
        data: { active: false, updatedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    const historyCounts = await Promise.all([
      db.purchaseOrder.count({ where: { createdById: userId } }),
      db.checklist.count({ where: { createdById: userId } }),
      db.planPayment.count({ where: { OR: [{ requestedById: userId }, { confirmedById: userId }] } }),
      db.invitation.count({ where: { invitedById: userId } }),
      db.stockMovement.count({ where: { userId } }),
    ]);

    if (historyCounts.some((count) => count > 0)) {
      await anonymizeUser(userId, target.email, target.companyId);
      return NextResponse.json({ success: true, removal: "anonymized" });
    }

    try {
      await eraseUser(userId, target.email, target.companyId);
      return NextResponse.json({ success: true, removal: "erased" });
    } catch (eraseError) {
      const stillReferenced = eraseError instanceof Prisma.PrismaClientKnownRequestError && eraseError.code === "P2003";
      if (!stillReferenced) throw eraseError;
      await anonymizeUser(userId, target.email, target.companyId);
      return NextResponse.json({ success: true, removal: "anonymized" });
    }
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
