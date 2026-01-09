// lib/services/invitationService.ts
import { supabase } from '@/lib/supabase'

export interface Invitation {
  id: string
  email: string
  token: string
  role: 'site_manager' | 'structural_engineer'
  company_id: string
  invited_by: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

export const invitationService = {
  // Créer une invitation
  async createInvitation(email: string, role: 'site_manager' | 'structural_engineer', companyId: string, invitedBy: string) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('company_id', companyId)
        .single()

      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà dans cette entreprise')
      }

      // Générer un token unique
      const token = this.generateToken()
      
      // Date d'expiration (7 jours)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert([{
          email: email.toLowerCase().trim(),
          token,
          role,
          company_id: companyId,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      return invitation
    } catch (error) {
      console.error('Error creating invitation:', error)
      throw error
    }
  },

  // Envoyer l'email d'invitation
  async sendInvitationEmail(invitation: Invitation, companyName: string, inviterName: string) {
    try {
      // URL absolue pour le lien d'invitation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const invitationLink = `${baseUrl}/invite/${invitation.token}`
      
      // Générer le HTML de l'email
      const emailHtml = this.generateInvitationEmail(invitation, companyName, inviterName, invitationLink)

      console.log('Sending invitation email to:', invitation.email)
      console.log('Invitation link:', invitationLink)

      // Appeler votre API pour envoyer l'email via Resend
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: invitation.email,
          subject: `Invitation à rejoindre ${companyName} sur BuildStock Pro`,
          html: emailHtml,
          invitationLink
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Échec de l'envoi de l'email (${response.status})`)
      }

      const result = await response.json()
      
      console.log('Email API response:', result)
      
      return { 
        success: true, 
        data: result,
        invitationLink
      }
    } catch (error: any) {
      console.error('❌ Error in sendInvitationEmail:', error)
      
      // En mode développement, simuler l'envoi si l'API échoue
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Email service failed, simulating in dev mode')
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const invitationLink = `${baseUrl}/invite/${invitation.token}`
        
        console.log('📧 Simulated email:', {
          to: invitation.email,
          link: invitationLink
        })
        
        return { 
          success: true, 
          data: { simulated: true },
          invitationLink
        }
      }
      
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`)
    }
  },

  // Fonction generateInvitationEmail - UNE SEULE DÉFINITION
  generateInvitationEmail(invitation: Invitation, companyName: string, inviterName: string, link: string): string {
    const roleMap = {
      site_manager: 'Chef de Chantier',
      structural_engineer: 'Ingénieur Structure'
    }

    const roleDisplay = roleMap[invitation.role as keyof typeof roleMap] || invitation.role
    const expiryDate = new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation BuildStock Pro</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          
          .tagline {
            opacity: 0.9;
            font-size: 16px;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          p {
            margin-bottom: 16px;
            font-size: 16px;
            color: #4b5563;
          }
          
          .highlight {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #3b82f6;
          }
          
          .highlight p {
            margin-bottom: 8px;
            color: #1f2937;
          }
          
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
          }
          
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
          }
          
          .info-box {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          
          .info-title {
            color: #0369a1;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .footer {
            background-color: #f9fafb;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .warning {
            color: #dc2626;
            font-size: 14px;
            margin-top: 20px;
            padding: 12px;
            background-color: #fef2f2;
            border-radius: 6px;
            border: 1px solid #fecaca;
          }
          
          @media (max-width: 640px) {
            .content, .header, .footer {
              padding: 25px 20px;
            }
            
            h1 {
              font-size: 20px;
            }
            
            .button {
              width: 100%;
              padding: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏗️ BuildStock Pro</div>
            <div class="tagline">Gestion intelligente de chantier</div>
          </div>
          
          <div class="content">
            <h1>Invitation à rejoindre ${companyName}</h1>
            
            <p>Bonjour,</p>
            
            <p>Vous avez été invité(e) par <strong>${inviterName}</strong> à rejoindre 
            <strong>${companyName}</strong> sur BuildStock Pro.</p>
            
            <div class="highlight">
              <p><strong>📧 Email:</strong> ${invitation.email}</p>
              <p><strong>👥 Rôle attribué:</strong> ${roleDisplay}</p>
              <p><strong>🏢 Entreprise:</strong> ${companyName}</p>
            </div>
            
            <p>BuildStock Pro est une plateforme de gestion de chantier qui vous permettra de :</p>
            <ul style="margin-left: 20px; margin-bottom: 20px; color: #4b5563;">
              <li>Gérer les stocks de matériaux</li>
              <li>Suivre les commandes fournisseurs</li>
              <li>Planifier les projets de construction</li>
              <li>Collaborer avec votre équipe</li>
            </ul>
            
            <div class="button-container">
              <a href="${link}" class="button">🎯 Activer mon compte</a>
            </div>
            
            <div class="info-box">
              <div class="info-title">⏰ Date d'expiration</div>
              <p>Cette invitation expirera le <strong>${expiryDate}</strong></p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Si vous n'avez pas demandé cette invitation ou si vous ne reconnaissez pas cette entreprise, veuillez ignorer cet email.
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              Cet email a été envoyé par BuildStock Pro.<br>
              Si vous rencontrez des problèmes avec le bouton ci-dessus, copiez et collez le lien suivant dans votre navigateur :<br>
              <span style="color: #3b82f6; word-break: break-all;">${link}</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Valider un token d'invitation
  async validateInvitation(token: string) {
    try {
      // ❌ الكود القديم (هذا يسبب خطأ لأن الزائر غير مسجل)
      /* const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single()
      */

      // ✅ الكود الجديد (يستخدم الدالة الآمنة RPC)
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { token_input: token })

      if (error) throw error
      if (!data) throw new Error('Invitation introuvable')

      // تحويل البيانات
      const invitation = data as any

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Cette invitation a expiré')
      }

      if (invitation.accepted_at) {
        throw new Error('Cette invitation a déjà été utilisée')
      }

      return invitation
    } catch (error: any) {
      console.error('Error validating invitation:', error)
      throw new Error(error.message || "Lien invalide")
    }
  },

  // Accepter une invitation (créer l'utilisateur)
  async acceptInvitation(token: string, password: string, firstName: string, lastName: string) {
    try {
      const invitation = await this.validateInvitation(token)

      // Créer l'utilisateur
      const { data: user, error: userError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: invitation.role,
            company_id: invitation.company_id,
            is_active: true
          }
        }
      })

      if (userError) throw userError

      // Marquer l'invitation comme acceptée
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      return user
    } catch (error) {
      console.error('Error accepting invitation:', error)
      throw error
    }
  },

  // Récupérer les invitations d'une entreprise
  async getCompanyInvitations(companyId: string) {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        inviter:users!invitations_invited_by_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Annuler une invitation
  async cancelInvitation(invitationId: string) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (error) throw error
  },

  // Méthodes utilitaires
  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}