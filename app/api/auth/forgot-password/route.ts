import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Forgot Password Error: RESEND_API_KEY is missing");
      return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@hamishona.com";
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Password reset request",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password reset</h2>
          <p>We received a request to reset your password.</p>
          <p>Click the link below to choose a new password:</p>
          <br/>
          <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If this was not you, ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Forgot Password Error: Resend send failed", emailError);
      return NextResponse.json({ error: "Unable to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
