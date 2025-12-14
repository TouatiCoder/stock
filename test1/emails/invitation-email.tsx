// @/emails/invitation-email-simple.tsx
export const generateInvitationEmailHTML = (props: {
  recipientName: string
  inviterName: string
  inviterEmail: string
  companyName: string
  invitationLink: string
  role: string
  expirationDate: string
}): string => {
  const { 
    recipientName, 
    inviterName, 
    inviterEmail, 
    companyName, 
    invitationLink, 
    role, 
    expirationDate 
  } = props
  
  const roleTranslations: Record<string, string> = {
    'admin': 'Administrateur',
    'chef_de_chantier': 'Chef de Chantier',
    'ingenieur_structure': 'Ingénieur Structure'
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rejoignez ${companyName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
            color: #374151;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 32px 24px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
        }
        .content {
            padding: 32px 24px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            font-weight: 600;
            padding: 12px 32px;
            border-radius: 6px;
            margin: 24px 0;
        }
        .footer {
            text-align: center;
            padding: 24px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            background-color: #f8fafc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0 0 8px 0; color: #111827;">🏗️ ${companyName}</h1>
            <p style="margin: 0; color: #6b7280;">Plateforme de gestion de construction</p>
        </div>
        
        <div class="content">
            <h2 style="margin: 0 0 16px 0; color: #111827;">Bonjour ${recipientName},</h2>
            
            <p style="margin-bottom: 16px;">
                <strong>${inviterName}</strong> (${inviterEmail}) vous invite à rejoindre
                <strong> ${companyName}</strong> en tant que <strong>${roleTranslations[role] || role}</strong>.
            </p>
            
            <p style="margin-bottom: 24px;">
                Vous aurez accès à une plateforme complète pour gérer vos projets de construction, 
                suivre les coûts, gérer l'inventaire et collaborer avec votre équipe.
            </p>
            
            <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accepter l'invitation</a>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 16px;">
                ⏰ Ce lien expire le ${expirationDate}
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 8px 0;">
                Vous avez des questions ? Répondez à cet email ou contactez-nous à
                <a href="mailto:support@buildstockpro.com" style="color: #2563eb;">support@buildstockpro.com</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${companyName}. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>
  `
}