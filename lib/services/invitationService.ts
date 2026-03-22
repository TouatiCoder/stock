// lib/services/invitationService.ts
export interface InvitationRequest {
  email: string
  role: 'site_manager' | 'structural_engineer'
  companyId: string
  invitedBy: string
  companyName: string
  inviterName: string
}

export interface InvitationResponse {
  id: string
  email: string
  token: string
  role: 'site_manager' | 'structural_engineer'
  expires_at: string
  accepted_at?: string
  created_at: string
  inviter?: {
    first_name: string
    last_name: string
  }
}

export interface ValidateInvitationResponse {
  isValid: boolean;
  email: string;
  role: string;
  company: {
    id: string;
    name: string;
  };
  error?: string;
}

export const invitationService = {
  async getCompanyInvitations(companyId: string): Promise<InvitationResponse[]> {
    const res = await fetch(`/api/invitations?companyId=${companyId}`)
    if (!res.ok) throw new Error(`Erreur récupération invitations: ${res.statusText}`)
    return res.json()
  },

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const res = await fetch(`/api/invitations/${invitationId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Erreur annulation invitation: ${res.statusText}`)
    return true
  },

  async sendInvitation(invitation: InvitationRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invitation.email,
          subject: 'Invitation BuildStock Pro',
          html: `<p>Bonjour, vous avez été invité(e) à rejoindre BuildStock Pro. Cliquez <a href="${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.invitedBy}">ici</a> pour accepter.</p>`,
          invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.invitedBy}`,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        return { success: false, message: errorText }
      }

      const result = await res.json()
      return { success: true, data: result }
    } catch (err: any) {
      console.error('Erreur fetch invitation:', err)
      return { success: false, message: err.message }
    }
  },

  async validateInvitation(token: string): Promise<ValidateInvitationResponse> {
    try {
      const res = await fetch(`/api/invitations/validate/${token}`)
      if (!res.ok) {
        const errorData = await res.json();
        return { 
          isValid: false, 
          email: '', 
          role: '', 
          company: { id: '', name: '' },
          error: errorData.error || 'Invalid invitation token' 
        }
      }
      return res.json()
    } catch (err: any) {
      console.error('Error validating invitation:', err)
      return { 
        isValid: false, 
        email: '', 
        role: '', 
        company: { id: '', name: '' },
        error: err.message 
      }
    }
  },

  async acceptInvitation(
    token: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName
        })
      })

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, message: errorData.error || 'Failed to accept invitation' }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      return { success: false, message: err.message }
    }
  }
}