import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true, email: true } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await db.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true },
    });

    const { rpID } = getRpIdAndOrigin(req);

    const options = await generateRegistrationOptions({
      rpName: "BuildStock Pro",
      rpID,
      userName: dbUser.email,
      userID: dbUser.id,
      attestationType: "none",
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      excludeCredentials: existing.map((cred) => ({
        id: cred.credentialId,
        type: "public-key",
      })) as any,
    });

    await db.webAuthnChallenge.deleteMany({ where: { userId: user.id, purpose: "registration" } });
    await db.webAuthnChallenge.create({
      data: {
        userId: user.id,
        purpose: "registration",
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("WebAuthn registration options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
