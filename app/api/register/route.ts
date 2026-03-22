import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import { featureGateService, FEATURE_CODES } from "@/lib/subscription";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const companyName = body.companyName?.trim();
    const firstName = body.firstName?.trim() || "";
    const lastName = body.lastName?.trim() || "";
    const password = body.password;

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let isFirstPlatformUser = false;

    const trialEnabled =
      String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
      process.env.BILLING_TRIAL_ENABLED === "1";
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7");

    await db.$transaction(async (tx) => {
      const usersCount = await tx.user.count();
      isFirstPlatformUser = usersCount === 0;

      const company = await tx.company.create({
        data: {
          name: companyName,
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
          trialDays: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7,
        },
        tx,
      );

      await featureGateService.incrementUsage(company.id, FEATURE_CODES.MAX_USERS, 1, null, tx);
    });

    try {
      await resend.emails.send({
        from: "BuildStock Admin <admin@realwalks.com>",
        to: email,
        subject: "Welcome to BuildStock Pro",
        html: `<h1>Welcome ${firstName || "there"}!</h1><p>Your company owner account is ready.</p>`,
      });
    } catch (emailError) {
      console.error("Email sending failed but registration succeeded:", emailError);
    }

    return NextResponse.json({ success: true, isPlatformAdmin: isFirstPlatformUser });
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
