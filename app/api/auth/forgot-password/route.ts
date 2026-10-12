import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { getAppUrl, getResendClient, getResendSender } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    // Keep the response generic to avoid revealing whether an account exists.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: getResendSender("security"),
      to: email,
      subject: "Password reset request — BuildStock Pro",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#172033">
          <h2>Reset your BuildStock Pro password</h2>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Reset password</a></p>
          <p>This link expires in one hour. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend password-reset email failed:", error);
      return NextResponse.json({ error: "Unable to send reset email" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Email service unavailable" }, { status: 500 });
  }
}
