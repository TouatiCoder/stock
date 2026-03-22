import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/utils/edge-jwt";
import { getRpIdAndOrigin } from "@/lib/auth/webauthn";

function fromB64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; response?: AuthenticationResponseJSON };
    const email = body.email?.trim().toLowerCase();

    if (!email || !body.response) {
      return NextResponse.json({ error: "Missing email or assertion response" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.authMethod === "password_only") {
      return NextResponse.json({ error: "Biometric login is disabled" }, { status: 400 });
    }

    const challenge = await db.webAuthnChallenge.findFirst({
      where: { userId: user.id, purpose: "authentication", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Authentication challenge expired" }, { status: 400 });
    }

    const storedCredential = await db.webAuthnCredential.findUnique({
      where: { credentialId: body.response.id },
    });

    if (!storedCredential || storedCredential.userId !== user.id) {
      return NextResponse.json({ error: "Credential not found" }, { status: 400 });
    }

    const { rpID, origin } = getRpIdAndOrigin(req);

    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      authenticator: {
        id: storedCredential.credentialId,
        publicKey: fromB64Url(storedCredential.publicKey),
        counter: storedCredential.counter,
        transports: storedCredential.transports
          ? (storedCredential.transports.split(",").map((v) => v.trim()) as AuthenticatorTransport[])
          : [],
      },
    } as any);

    if (!verification.verified) {
      return NextResponse.json({ error: "Authentication verification failed" }, { status: 400 });
    }

    const newCounter = verification.authenticationInfo.newCounter;

    await db.$transaction([
      db.webAuthnCredential.update({
        where: { credentialId: storedCredential.credentialId },
        data: { counter: Number(newCounter || storedCredential.counter) },
      }),
      db.webAuthnChallenge.deleteMany({ where: { userId: user.id, purpose: "authentication" } }),
      db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    ]);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        companyId: user.companyId,
        isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("WebAuthn auth verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
