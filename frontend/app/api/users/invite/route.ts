// @/app/api/users/invite/route.ts - VERSION CORRIGÉE
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { generateInvitationEmailHTML } from '@/emails/invitation-email'

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Vérification de l'utilisateur administrateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Authentification requise" 
      }, { status: 401 })
    }
    
    // 2. Vérification des permissions admin - CORRECTION ICI : ajouter 'id' dans le select
    const { data: currentUser } = await supabase
      .from("users")
      .select("id, role, full_name, email") // ← AJOUTEZ 'id' ICI
      .eq("id", user.id)
      .single()
    
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ 
        error: "Permissions insuffisantes. Seuls les administrateurs peuvent inviter des utilisateurs." 
      }, { status: 403 })
    }
    
    // 3. Validation des données
    const body = await request.json()
    const { email, role, full_name } = body
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ 
        error: "Adresse email invalide" 
      }, { status: 400 })
    }
    
    const validRoles = ['admin', 'chef_de_chantier', 'ingenieur_structure']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Rôle invalide. Rôles valides : ${validRoles.join(', ')}` 
      }, { status: 400 })
    }
    
    // 4. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email, status")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()
    
    if (existingUser) {
      if (existingUser.status === 'invited') {
        return NextResponse.json({ 
          error: "Une invitation est déjà en attente pour cet utilisateur" 
        }, { status: 409 })
      }
      return NextResponse.json({ 
        error: "Un utilisateur avec cette adresse email existe déjà" 
      }, { status: 409 })
    }
    
    // 5. Créer un client admin avec la clé de service
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // 6. Générer un token d'invitation sécurisé
    const invitationToken = crypto.randomUUID()
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    
    // 7. Créer l'utilisateur dans Auth (sans mot de passe)
    const { data: authData, error: authCreateError } = await adminSupabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      email_confirm: true, // Confirmer automatiquement pour l'invitation
      user_metadata: {
        full_name: full_name || email.split("@")[0],
        role: role,
        invitation_token: invitationToken,
        invited_by: currentUser.email,
        invited_at: new Date().toISOString()
      }
    })
    
    if (authCreateError) {
      console.error("❌ Erreur création utilisateur Auth:", authCreateError)
      return NextResponse.json({ 
        error: `Échec de la création du compte: ${authCreateError.message}` 
      }, { status: 400 })
    }
    
    // 8. Créer le profil dans la table users
    if (!authData.user) {
      return NextResponse.json({ 
        error: "Échec de la création de l'utilisateur" 
      }, { status: 400 })
    }
    
    const { error: profileError } = await supabase
      .from("users")
      .insert([{
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        role,
        full_name: full_name || email.split("@")[0],
        invitation_token: invitationToken,
        invitation_expires: invitationExpires.toISOString(),
        invited_by: currentUser.id, // ← UTILISEZ currentUser.id ICI
        invited_by_email: currentUser.email,
        status: 'invited',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
    
    if (profileError) {
      // Nettoyage: supprimer l'utilisateur Auth en cas d'échec
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: `Échec création profil: ${profileError.message}` 
      }, { status: 400 })
    }
    
    // 9. Générer le lien d'invitation sécurisé
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/accept-invitation?token=${invitationToken}&email=${encodeURIComponent(email)}`
    
    // 10. Envoyer l'email d'invitation professionnel
    let emailError: any = null
    try {
      const emailHtml = generateInvitationEmailHTML({
    recipientName: full_name || email.split("@")[0],
    inviterName: currentUser.full_name || currentUser.email.split("@")[0],
    inviterEmail: currentUser.email,
    companyName: "BuildStock Pro",
    invitationLink: invitationLink,
    role: role,
    expirationDate: invitationExpires.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })
      
      const { data: emailData, error: resendError } = await resend.emails.send({
    from: 'BuildStock Pro <onboarding@buildstockpro.com>',
    to: email,
    subject: `🎯 Invitation à rejoindre BuildStock Pro`,
    html: emailHtml,
    tags: [{ name: 'category', value: 'invitation' }],
  })
      if (resendError) {
        emailError = resendError
        console.error("❌ Erreur envoi email:", resendError)
      } else {
        console.log("✅ Email envoyé:", emailData?.id)
      }
      
    } catch (error) {
      emailError = error
      console.error("❌ Erreur génération email:", error)
    }
    
    // 11. Journaliser l'action d'audit
    try {
      await supabase
        .from("audit_logs")
        .insert([{
          user_id: currentUser.id, // ← UTILISEZ currentUser.id ICI
          action: "user_invited",
          entity_type: "user",
          entity_id: authData.user.id,
          changes: { 
            email, 
            role, 
            invited_by: currentUser.email,
            invitation_sent: !emailError
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          created_at: new Date().toISOString()
        }])
    } catch (auditError) {
      console.error("❌ Erreur journalisation audit:", auditError)
      // Ne pas bloquer la réponse en cas d'erreur d'audit
    }
    
    // 12. Retourner une réponse détaillée
    const responseData = {
      success: true, 
      message: emailError 
        ? "Utilisateur créé, mais l'email n'a pas pu être envoyé. Vous pouvez réenvoyer l'invitation."
        : "Invitation envoyée avec succès",
      data: {
        user_id: authData.user.id,
        email: email,
        role: role,
        invitation_expires: invitationExpires.toISOString(),
        status: 'invited',
        // Ne pas inclure le lien dans la réponse en production
        ...(process.env.NODE_ENV === 'development' && { invitation_link: invitationLink })
      }
    }
    
    if (emailError) {
      return NextResponse.json({
        ...responseData,
        warning: "L'email n'a pas pu être envoyé. Veuillez réessayer.",
        email_error: emailError.message
      }, { status: 207 }) // 207 Multi-Status
    }
    
    return NextResponse.json(responseData)
    
  } catch (error: any) {
    console.error("❌ Erreur interne:", error)
    
    // Message d'erreur sécurisé
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : "Une erreur interne est survenue. Contactez l'administrateur."
    
    return NextResponse.json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        name: error.name 
      })
    }, { status: 500 })
  }
}