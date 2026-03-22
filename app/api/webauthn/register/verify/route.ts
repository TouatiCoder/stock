import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

function toB64Url(input: Uint8Array) {
  return Buffer.from(input).toString("base64url");
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await db.user.findFirst({
      where: { id: user.id, active: true, company: { isActive: true } },
      select: { id: true, authMethod: true },
    });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { response?: RegistrationResponseJSON };
    if (!body?.response) return NextResponse.json({ error: "Missing registration response" }, { status: 400 });

    const challenge = await db.webAuthnChallenge.findFirst({
      where: { userId: dbUser.id, purpose: "registration", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) return NextResponse.json({ error: "Challenge expired" }, { status: 400 });

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

    const reg = verification.registrationInfo;
    const attachment = (body.response as any)?.authenticatorAttachment;

    if (attachment !== "platform") {
      console.warn("Rejected WebAuthn registration: non-platform authenticator attachment", {
        userId: dbUser.id,
        attachment,
      });
      return NextResponse.json(
        { error: "Only Windows Hello platform authenticators are allowed." },
        { status: 400 }
      );
    }

    if (reg.credentialDeviceType !== "singleDevice") {
      console.warn("Rejected WebAuthn registration: multi-device credential", {
        userId: dbUser.id,
        credentialDeviceType: reg.credentialDeviceType,
      });
      return NextResponse.json(
        { error: "Only Windows Hello platform authenticators are allowed." },
        { status: 400 }
      );
    }

    const credentialId = toB64Url(reg.credentialID);

    await db.$transaction([
      db.webAuthnCredential.upsert({
        where: { credentialId },
        update: {
          publicKey: toB64Url(reg.credentialPublicKey),
          counter: Number(reg.counter || 0),
          authenticatorAttachment: "platform",
          deviceType: reg.credentialDeviceType || null,
          backedUp: reg.credentialBackedUp ?? null,
          updatedAt: new Date(),
        } as any,
        create: {
          userId: dbUser.id,
          credentialId,
          publicKey: toB64Url(reg.credentialPublicKey),
          counter: Number(reg.counter || 0),
          authenticatorAttachment: "platform",
          deviceType: reg.credentialDeviceType || null,
          backedUp: reg.credentialBackedUp ?? null,
          transports: null,
          updatedAt: new Date(),
        } as any,
      }),
      db.webAuthnChallenge.deleteMany({ where: { userId: dbUser.id, purpose: "registration" } }),
      db.user.update({
        where: { id: dbUser.id },
        data: {
          authMethod: dbUser.authMethod === "password_only" ? "biometric_password" : dbUser.authMethod,
        },
      }),
    ]);

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("WebAuthn register verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
