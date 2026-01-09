// app/api/send-invitation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, invitationLink } = body

    // Vérifier que l'email n'est pas vide
    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'BuildStock Pro <re-play@touatiayoub.net>',
      to: [to],
      subject,
      html,
      // Optionnel: Ajouter un texte brut pour les clients email qui ne supportent pas HTML
      text: `Vous avez été invité(e) à rejoindre notre plateforme BuildStock Pro.\n\nPour activer votre compte, cliquez sur le lien suivant : ${invitationLink}\n\nCe lien expirera dans 7 jours.\n\nCordialement,\nL'équipe BuildStock Pro`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    console.log('Email sent successfully:', { to, emailId: data?.id })
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Email envoyé avec succès'
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Échec de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}