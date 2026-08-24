import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// تأكد من وجود مفتاح API في ملف .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@hamishona.com",
      to: email,
      subject: 'Bienvenue sur BuildStock Pro !',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Bienvenue ${name} !</h2>
          <p>Votre compte administrateur a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter à votre espace de travail.</p>
          <br/>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email sent' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}