import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import { featureGateService, FEATURE_CODES } from "@/lib/subscription";

/**
 * TEMPORARILY DISABLED: Resend welcome emails while deployment is being verified.
 * To re-enable later, restore the Resend client and email-send block and configure
 * RESEND_API_KEY plus RESEND_FROM_ADMIN in Vercel Environment Variables.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body.email?.trim().toLowerCase()
    const companyName = body.companyName?.trim()
    const siret = body.siret?.trim() || null
    const firstName = body.firstName?.trim() || ""
    const lastName = body.lastName?.trim() || ""
    const password = body.password

    // Validate required fields
    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate company name
    if (companyName.length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUppercase || !hasNumber) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter and one number" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    let isFirstPlatformUser = false

    // Trial configuration from environment
    const trialEnabled =
      String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
      process.env.BILLING_TRIAL_ENABLED === "1"
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7")
    const validatedTrialDays = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7

    await db.$transaction(async (tx) => {
      const usersCount = await tx.user.count();
      isFirstPlatformUser = usersCount === 0;

      const company = await tx.company.create({
        data: {
          name: companyName,
          siret,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "admin",
          companyId: company.id,
          active: true,
          // First account in the whole platform gets Super Admin privileges.
          isPlatformAdmin: isFirstPlatformUser,
        } as any,
      });

      await subscriptionService.initializeCompanySubscription(
        company.id,
        {
          trialEnabled,
          trialDays: validatedTrialDays,
        },
        tx,
      );

      await featureGateService.incrementUsage(company.id, FEATURE_CODES.MAX_USERS, 1, null, tx);
    });

    // Welcome email intentionally skipped while Resend is temporarily disabled.
    return NextResponse.json({
      success: true,
      isPlatformAdmin: isFirstPlatformUser,
      emailSent: false,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
