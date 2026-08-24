import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findFirst({
      where: { id: user.id, active: true, company: { isActive: true } },
      select: { id: true, email: true, companyId: true },
    });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.webAuthnCredential.findMany({
      where: { userId: dbUser.id },
      select: { credentialId: true, transports: true },
    });

    const { rpID } = getRpIdAndOrigin(req);

    const options = await generateRegistrationOptions({
      rpName: "BuildStock Pro",
      rpID,
      userName: dbUser.email,
      userID: dbUser.id,
      timeout: 60000,
      attestationType: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true,
      },
      excludeCredentials: existing.map((cred) => ({
        id: cred.credentialId,
        type: "public-key",
        transports: cred.transports ? (cred.transports.split(",").map((v) => v.trim()) as AuthenticatorTransport[]) : undefined,
      })) as any,
    });

    await db.webAuthnChallenge.deleteMany({ where: { userId: dbUser.id, purpose: "registration" } });
    await db.webAuthnChallenge.create({
      data: {
        userId: dbUser.id,
        purpose: "registration",
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("WebAuthn register options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
