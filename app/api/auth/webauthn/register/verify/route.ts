import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

function toB64(input: Uint8Array) {
  return Buffer.from(input).toString("base64url");
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { response?: RegistrationResponseJSON };
    if (!body?.response) {
      return NextResponse.json({ error: "Missing registration response" }, { status: 400 });
    }

    const challenge = await db.webAuthnChallenge.findFirst({
      where: { userId: user.id, purpose: "registration", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Registration challenge expired" }, { status: 400 });
    }

    const { rpID, origin } = getRpIdAndOrigin(req);

    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const credentialId = Buffer.from(credentialID).toString("base64url");

    await db.webAuthnCredential.upsert({
      where: { credentialId },
      update: {
        publicKey: toB64(credentialPublicKey),
        counter: Number(counter || 0),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        credentialId,
        publicKey: toB64(credentialPublicKey),
        counter: Number(counter || 0),
        transports: null,
        deviceType: null,
        backedUp: null,
        updatedAt: new Date(),
      },
    });

    await db.webAuthnChallenge.deleteMany({ where: { userId: user.id, purpose: "registration" } });

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("WebAuthn registration verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
