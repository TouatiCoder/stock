import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  try {
    const { rpID } = getRpIdAndOrigin(req);
    const allowedCredentials = await db.webAuthnCredential.findMany({
      where: {
        authenticatorAttachment: "platform",
        deviceType: "singleDevice",
        user: {
          active: true,
          authMethod: { in: ["biometric_only", "biometric_password"] },
          company: { isActive: true },
        },
      },
      select: { credentialId: true, transports: true },
      take: 1000,
    } as any);

    if (allowedCredentials.length === 0) {
      return NextResponse.json({
        available: false,
        reason: "no_biometric_accounts",
      });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: allowedCredentials.map((cred) => ({
        id: cred.credentialId,
        type: "public-key",
        transports: cred.transports
          ? (cred.transports.split(",").map((v) => v.trim()) as AuthenticatorTransport[])
          : undefined,
      })) as any,
    });

    const challengeRow = await db.webAuthnLoginChallenge.create({
      data: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json({
      available: true,
      options,
      challengeId: challengeRow.id,
    });
  } catch (error) {
    console.error("WebAuthn login options error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
