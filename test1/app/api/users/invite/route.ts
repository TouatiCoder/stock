// app/api/users/invite/route.ts - VERSION AVEC RESEND
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from 'resend'

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'onboarding@votredomaine.com'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Vérification de l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: "Authentification requise" 
      }, { status: 401 })
    }
    
    // 2. Vérification que l'utilisateur est admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("id, role, full_name, email")
      .eq("id", user.id)
      .single()
    
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ 
        error: "Permissions insuffisantes. Admin uniquement." 
      }, { status: 403 })
    }
    
    // 3. Validation des données
    const { email, role } = await request.json()
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ 
        error: "Email invalide" 
      }, { status: 400 })
    }
    
    // Rôles autorisés (pas admin pour les invitations)
    const validRoles = ['chef_de_chantier', 'ingenieur_structure']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Rôle invalide. Rôles autorisés: ${validRoles.join(', ')}` 
      }, { status: 400 })
    }
    
    // 4. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()
    
    if (existingUser) {
      return NextResponse.json({ 
        error: "Un utilisateur avec cet email existe déjà" 
      }, { status: 409 })
    }
    
    // 5. Vérifier si une invitation existe déjà
    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single()
    
    if (existingInvitation) {
      return NextResponse.json({ 
        error: "Une invitation valide existe déjà pour cet email" 
      }, { status: 409 })
    }
    
    // 6. Générer un token sécurisé
    const token = require('crypto').randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    
    // 7. Créer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .insert({
        email: email.toLowerCase().trim(),
        token: token,
        role: role,
        invited_by: currentUser.id,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (invitationError) {
      console.error("Invitation DB error:", invitationError)
      return NextResponse.json({ 
        error: "Erreur lors de la création de l'invitation" 
      }, { status: 500 })
    }
    
    // 8. Créer le lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/signup?token=${token}`
    
    // 9. Envoyer l'email avec Resend
    let emailSent = false
    let emailError = null
    
    try {
      const inviterName = currentUser.full_name || currentUser.email.split('@')[0]
      const roleDisplay = role === 'chef_de_chantier' ? 'Chef de Chantier' : 'Ingénieur Structure'
      
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: 'BuildStock Pro <onboarding@resend.dev>', // Changez avec votre domaine vérifié
        to: email,
        subject: `🎯 Invitation à rejoindre BuildStock Pro`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation BuildStock Pro</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .details { background: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
              .logo { font-size: 24px; font-weight: bold; color: white; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🏗️ BuildStock Pro</div>
              <h1>Vous êtes invité !</h1>
            </div>
            
            <div class="content">
              <p>Bonjour,</p>
              
              <p><strong>${inviterName}</strong> vous invite à rejoindre <strong>BuildStock Pro</strong>, 
              la plateforme de gestion de construction.</p>
              
              <div class="details">
                <p><strong>📧 Email :</strong> ${email}</p>
                <p><strong>👥 Rôle :</strong> ${roleDisplay}</p>
                <p><strong>👤 Invité par :</strong> ${inviterName} (${currentUser.email})</p>
                <p><strong>⏰ Lien valide jusqu'au :</strong> ${expiresAt.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              
              <p>Pour accepter cette invitation et créer votre compte, cliquez sur le bouton ci-dessous :</p>
              
              <p style="text-align: center;">
                <a href="${invitationLink}" class="button">
                  🚀 Accepter l'invitation
                </a>
              </p>
              
              <p>Ou copiez-collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #4f46e5; background: #f3f4f6; padding: 10px; border-radius: 5px;">
                ${invitationLink}
              </p>
              
              <p><strong>ℹ️ À propos de BuildStock Pro :</strong><br>
              Notre plateforme vous permet de gérer vos projets de construction, suivre les stocks, 
              gérer les dépenses et collaborer avec votre équipe en temps réel.</p>
              
              <div class="footer">
                <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
                <p>© ${new Date().getFullYear()} BuildStock Pro. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        // Tags pour le suivi
        tags: [
          { name: 'category', value: 'invitation' },
          { name: 'role', value: role }
        ]
      })
      
      if (resendError) {
        console.error("Resend error:", resendError)
        emailError = resendError
      } else {
        console.log("Email sent successfully:", emailData?.id)
        emailSent = true
      }
      
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      emailError = emailError
    }
    
    // 10. Retourner la réponse
    const responseData = {
      success: true,
      message: emailSent 
        ? "Invitation envoyée avec succès" 
        : "Invitation créée mais l'email n'a pas pu être envoyé",
      data: {
        invitationId: invitation.id,
        email: email,
        role: role,
        expiresAt: expiresAt.toISOString(),
        emailSent: emailSent,
        // En développement, on retourne aussi le lien
        ...(process.env.NODE_ENV === 'development' && { invitationLink })
      }
    }
    
    // Si email échoue, on retourne quand même le succès mais avec warning
    if (!emailSent) {
      return NextResponse.json({
        ...responseData,
        warning: "L'email n'a pas pu être envoyé. Vous pouvez copier le lien manuellement.",
        emailError: emailError?.message
      }, { status: 207 }) // 207 Multi-Status
    }
    
    return NextResponse.json(responseData)
    
  } catch (error: any) {
    console.error("API invite error:", error)
    
    return NextResponse.json({ 
      error: "Erreur serveur interne",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    }, { status: 500 })
  }
}