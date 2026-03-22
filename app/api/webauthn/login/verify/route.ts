import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/utils/edge-jwt";
import { getRpIdAndOrigin, parseTransports } from "@/lib/auth/webauthn";

function fromB64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;

export async function POST(req: Request) {
  try {
    const ipAddress = getClientIp(req);
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

    const failedAttempts = await (db as any).webAuthnLoginAttempt.count({
      where: { ipAddress, success: false, createdAt: { gte: windowStart } },
    });
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      console.warn("WebAuthn login rate limit hit", { ipAddress, failedAttempts });
      return NextResponse.json(
        { error: "Too many biometric login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      challengeId?: string;
      response?: AuthenticationResponseJSON;
    };

    if (!body.challengeId || !body.response) {
      return NextResponse.json({ error: "Missing challengeId or assertion response" }, { status: 400 });
    }

    const challenge = await db.webAuthnLoginChallenge.findFirst({
      where: { id: body.challengeId, expiresAt: { gt: new Date() } },
    });
    if (!challenge) return NextResponse.json({ error: "Challenge expired" }, { status: 400 });

    const storedCredential = (await db.webAuthnCredential.findUnique({
      where: { credentialId: body.response.id },
    })) as any;
    if (!storedCredential) {
      await (db as any).webAuthnLoginAttempt.create({
        data: {
          ipAddress,
          credentialId: body.response.id,
          success: false,
          reason: "credential_not_found",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "Credential not found" }, { status: 400 });
    }

    if (storedCredential.authenticatorAttachment !== "platform" || storedCredential.deviceType !== "singleDevice") {
      console.warn("Rejected non-Windows-Hello credential at login", {
        ipAddress,
        credentialId: storedCredential.credentialId,
        authenticatorAttachment: storedCredential.authenticatorAttachment,
        deviceType: storedCredential.deviceType,
      });
      await (db as any).webAuthnLoginAttempt.create({
        data: {
          ipAddress,
          credentialId: storedCredential.credentialId,
          success: false,
          reason: "non_platform_or_multidevice",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "Only Windows Hello platform authenticators are allowed." },
        { status: 400 }
      );
    }

    const transports = parseTransports(storedCredential.transports);
    const hasCrossPlatformTransport = transports.some((t) => t === "usb" || t === "nfc" || t === "ble" || t === "hybrid");
    if (hasCrossPlatformTransport) {
      console.warn("Rejected credential with cross-platform transport", {
        ipAddress,
        credentialId: storedCredential.credentialId,
        transports,
      });
      await (db as any).webAuthnLoginAttempt.create({
        data: {
          ipAddress,
          credentialId: storedCredential.credentialId,
          success: false,
          reason: "cross_platform_transport",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "Only Windows Hello platform authenticators are allowed." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        id: storedCredential.userId,
        active: true,
        companyId: { not: "" },
        company: { isActive: true },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        isPlatformAdmin: true,
        authMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.authMethod === "password_only") {
      return NextResponse.json({ error: "Biometric login disabled for this account" }, { status: 403 });
    }

    const { rpID, origin } = getRpIdAndOrigin(req);

    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      authenticator: {
        credentialID: fromB64Url(storedCredential.credentialId),
        credentialPublicKey: fromB64Url(storedCredential.publicKey),
        counter: storedCredential.counter,
        transports,
      },
    });

    if (!verification.verified) {
      await (db as any).webAuthnLoginAttempt.create({
        data: {
          ipAddress,
          credentialId: storedCredential.credentialId,
          success: false,
          reason: "verification_failed",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "Authentication verification failed" }, { status: 400 });
    }

    await db.$transaction([
      db.webAuthnCredential.update({
        where: { credentialId: storedCredential.credentialId },
        data: { counter: Number(verification.authenticationInfo.newCounter || storedCredential.counter) },
      }),
      db.webAuthnLoginChallenge.deleteMany({ where: { id: challenge.id } }),
      (db as any).webAuthnLoginAttempt.create({
        data: {
          ipAddress,
          credentialId: storedCredential.credentialId,
          success: true,
          reason: "ok",
          updatedAt: new Date(),
        },
      }),
      db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    ]);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      isPlatformAdmin: Boolean(user.isPlatformAdmin),
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
        isPlatformAdmin: Boolean(user.isPlatformAdmin),
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
    console.error("WebAuthn login verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
