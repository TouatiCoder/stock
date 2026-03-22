import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { cookies } from "next/headers";
import { Resend } from "resend";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { enforceMaxUsers, featureDeniedResponse } from "@/lib/subscription";

const resend = new Resend(process.env.RESEND_API_KEY);
const ALLOWED_INVITE_ROLES = new Set(["site_manager", "structural_engineer"]);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("auth-token")?.value;
    if (!tokenCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(tokenCookie);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await db.user.findUnique({ where: { id: payload.userId } });
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { email, role, firstName, lastName } = await req.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanRole = typeof role === "string" ? role : "";
    const cleanFirstName = typeof firstName === "string" ? firstName.trim() : "";
    const cleanLastName = typeof lastName === "string" ? lastName.trim() : "";

    if (!cleanEmail || !cleanFirstName || !cleanLastName) {
      return NextResponse.json({ error: "Email, nom et prenom sont obligatoires" }, { status: 400 });
    }

    if (!ALLOWED_INVITE_ROLES.has(cleanRole)) {
      return NextResponse.json({ error: "Role not allowed" }, { status: 400 });
    }

    const maxUsers = await enforceMaxUsers(currentUser.companyId, 1);
    if (!maxUsers.gate.allowed) {
      return featureDeniedResponse(
        maxUsers.gate,
        "Active user limit reached for your current subscription plan",
      );
    }

    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const tempPassword = await bcrypt.hash(crypto.randomBytes(12).toString("hex"), 10);
    const now = new Date();

    await db.user.create({
      data: {
        email: cleanEmail,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        role: cleanRole,
        companyId: currentUser.companyId,
        password: tempPassword,
        active: false,
        updatedAt: now,
      },
    });

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.invitation.create({
      data: {
        email: cleanEmail,
        role: cleanRole,
        token: inviteToken,
        expiresAt,
        companyId: currentUser.companyId,
        invitedById: currentUser.id,
        updatedAt: now,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${appUrl}/invite/accept?token=${inviteToken}`;

    try {
      await resend.emails.send({
        from: "BuildStock Invitations <invites@realwalks.com>",
        to: cleanEmail,
        subject: "Invitation à rejoindre BuildStock Pro",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Bonjour ${cleanFirstName},</h2>
            <p>Vous avez été invité par ${currentUser.firstName} à rejoindre l'équipe.</p>
            <p>Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe et activer votre compte:</p>
            <p><a href="${acceptUrl}" style="color: #2563eb;">Activer mon compte</a></p>
            <p>Ce lien expirera le ${expiresAt.toLocaleString("fr-FR")}.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Invite email send failed:", emailError);
    }

    return NextResponse.json({ success: true, token: inviteToken });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
