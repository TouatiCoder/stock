import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, authMethod: true, active: true },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.authMethod === "password_only") {
      return NextResponse.json({ error: "Biometric login is disabled for this account" }, { status: 400 });
    }

    const credentials = await db.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });

    if (credentials.length === 0) {
      return NextResponse.json({ error: "No biometric credentials registered" }, { status: 400 });
    }

    const { rpID } = getRpIdAndOrigin(req);

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        type: "public-key",
        transports: cred.transports ? (cred.transports.split(",").map((v) => v.trim()) as AuthenticatorTransport[]) : undefined,
      })) as any,
    });

    await db.webAuthnChallenge.deleteMany({ where: { userId: user.id, purpose: "authentication" } });
    await db.webAuthnChallenge.create({
      data: {
        userId: user.id,
        purpose: "authentication",
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("WebAuthn auth options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
