import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { getResendClient, getResendSender } from "@/lib/email/resend";
import { subscriptionService } from "@/lib/subscription/subscription.service";
import { featureGateService, FEATURE_CODES } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const companyName = body.companyName?.trim();
    const siret = body.siret?.trim() || null;
    const firstName = body.firstName?.trim() || "";
    const lastName = body.lastName?.trim() || "";
    const password = body.password;

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (companyName.length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasNumber) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter and one number" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let isFirstPlatformUser = false;

    const trialEnabled =
      String(process.env.BILLING_TRIAL_ENABLED || "").toLowerCase() === "true" ||
      process.env.BILLING_TRIAL_ENABLED === "1";
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS || "7");
    const validatedTrialDays = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 7;

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
          isPlatformAdmin: isFirstPlatformUser,
        } as any,
      });

      await subscriptionService.initializeCompanySubscription(
        company.id,
        { trialEnabled, trialDays: validatedTrialDays },
        tx,
      );

      await featureGateService.incrementUsage(company.id, FEATURE_CODES.MAX_USERS, 1, null, tx);
    });

    // Email delivery is separate from account creation: report provider failures
    // instead of silently showing success when Resend rejects the message.
    let emailSent = false;
    try {
      const resend = getResendClient();
      const from = getResendSender("admin");
      const { data, error } = await resend.emails.send({
        from,
        to: [email],
        subject: "Bienvenue sur BuildStock Pro !",
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Bienvenue ${escapeHtml(firstName || "sur BuildStock Pro")} !</h1><p>Votre compte ${escapeHtml(companyName)} a été créé avec succès.</p><p>Vous pouvez maintenant vous connecter à BuildStock Pro.</p></div>`,
      });

      if (error) {
        console.error("Registration welcome email rejected by Resend:", {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode,
        });
      } else {
        emailSent = Boolean(data?.id);
        if (!emailSent) {
          console.error("Registration welcome email: Resend returned no email ID.");
        }
      }
    } catch (emailError) {
      console.error("Registration succeeded but welcome email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      isPlatformAdmin: isFirstPlatformUser,
      emailSent,
      emailMessage: emailSent
        ? "Welcome email accepted by the email provider."
        : "Your account was created, but the welcome email could not be sent. Check the email address and try again later.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
