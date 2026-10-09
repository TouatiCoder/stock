import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service is not configured. Set RESEND_API_KEY to enable welcome emails." },
        { status: 503 },
      );
    }

    const { email, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@hamishona.com",
      to: email,
      subject: 'Bienvenue sur BuildStock Pro !',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Bienvenue ${String(name || "sur BuildStock Pro").replace(/[<>]/g, "")} !</h2>
          <p>Votre compte administrateur a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter à votre espace de travail.</p>
          <br/>
        </div>
      `,
    });

    if (error) {
      console.error("Welcome email send failed:", error);
      return NextResponse.json({ error: "Unable to send welcome email" }, { status: 502 });
    }

    return NextResponse.json({ message: 'Email sent' });
  } catch (error) {
    console.error("Send welcome email error:", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
