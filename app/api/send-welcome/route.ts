import { NextResponse } from "next/server";
import { getResendClient, getResendSender } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const resend = getResendClient();
    const from = getResendSender("admin");
    const safeName = typeof name === "string" ? name : "there";

    const { error } = await resend.emails.send({
      from,
      to: email.trim(),
      subject: "Bienvenue sur BuildStock Pro !",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Bienvenue ${safeName} !</h2>
          <p>Votre compte administrateur a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter à votre espace de travail.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Welcome email delivery failed:", error);
      return NextResponse.json({ error: "Email delivery failed" }, { status: 502 });
    }

    return NextResponse.json({ message: "Email sent" });
  } catch (error) {
    console.error("Welcome email configuration or request error:", error);
    return NextResponse.json({ error: "Email service is not configured or request failed" }, { status: 500 });
  }
}
