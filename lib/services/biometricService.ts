// lib/services/biometricService.ts
import { supabase } from '@/lib/supabase'

export const biometricService = {
  // Enregistrer une nouvelle empreinte biométrique
  async registerBiometric(userId: string) {
    try {
      // Vérifier si WebAuthn est disponible
      if (!this.isWebAuthnSupported()) {
        throw new Error('L\'authentification biométrique n\'est pas supportée par votre navigateur')
      }

      // Générer un challenge pour l'enregistrement
      const challengeBuffer = this.generateChallenge()
      
      // Créer un ID utilisateur
      const userIdBuffer = crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(userId)
)

      
      // Options pour la création de la clé publique
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: {
          name: "BuildStock Pro",
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(await userIdBuffer).slice(0, 16),
          name: userId,
          displayName: `Utilisateur ${userId.substring(0, 8)}`
        },
        pubKeyCredParams: [
          { type: "public-key" as const, alg: -7 }, // ES256
          { type: "public-key" as const, alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform" as const,
          userVerification: "required" as const,
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "none" as const,
        excludeCredentials: []
      }

      // Demander la création de la clé
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Création d\'identifiant annulée par l\'utilisateur')
      }

      // Enregistrer la clé dans la base de données
      const { error } = await supabase
        .from('user_biometric_credentials')
        .insert([{
          user_id: userId,
          credential_id: this.arrayBufferToBase64(credential.rawId),
          public_key: this.arrayBufferToBase64(credential.rawId),
          counter: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) {
        if (error.code === '23505') {
          throw new Error('Cette empreinte biométrique est déjà enregistrée')
        }
        throw error
      }

      return { 
        success: true, 
        credentialId: this.arrayBufferToBase64(credential.rawId).substring(0, 16) + '...'
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement biométrique:', error)
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Opération annulée ou non autorisée par l\'utilisateur')
          case 'InvalidStateError':
            throw new Error('Cet authentificateur est déjà enregistré pour ce compte')
          case 'NotSupportedError':
            throw new Error('Votre appareil ne supporte pas l\'authentification biométrique')
          case 'SecurityError':
            throw new Error('L\'opération nécessite une connexion HTTPS ou localhost')
          default:
            throw new Error(`Erreur technique: ${error.message}`)
        }
      }
      
      throw error
    }
  },

  // Vérifier l'authentification biométrique
  async verifyBiometric(userId: string) {
    try {
      // Récupérer la clé publique enregistrée
      const { data: credential, error } = await supabase
        .from('user_biometric_credentials')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Aucune empreinte biométrique enregistrée')
        }
        throw error
      }

      const challengeBuffer = this.generateChallenge()
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challengeBuffer,
        allowCredentials: [{
          type: "public-key" as const,
          id: this.base64ToArrayBuffer(credential.credential_id),
          transports: ["internal", "hybrid"] as AuthenticatorTransport[]
        }],
        userVerification: "required" as const,
        timeout: 60000,
        rpId: window.location.hostname
      }

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential | null

      if (!assertion) {
        throw new Error('Authentification annulée')
      }

      // Mettre à jour le compteur
      await supabase
        .from('user_biometric_credentials')
        .update({ 
          counter: (credential.counter || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', credential.id)

      return { 
        success: true,
        credentialId: this.arrayBufferToBase64(assertion.rawId)
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification biométrique:', error)
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Authentification refusée ou annulée')
          case 'SecurityError':
            throw new Error('L\'authentification nécessite une connexion sécurisée (HTTPS)')
          default:
            throw new Error(`Erreur d'authentification: ${error.message}`)
        }
      }
      
      throw error
    }
  },

  // Méthodes utilitaires
  generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return array.buffer
  },

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
    return btoa(binary)
  },

  base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer
},


  // Vérifier si l'utilisateur a déjà enregistré des identifiants biométriques
  async hasBiometricCredentials(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_biometric_credentials')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification des identifiants:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Erreur inattendue:', error)
      return false
    }
  },

  // Obtenir les informations sur les credentials biométriques
  async getBiometricCredentials(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_biometric_credentials')
        .select('id, credential_id, counter, last_used_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des identifiants:', error)
      return []
    }
  },

  // Supprimer les identifiants biométriques
  async deleteBiometricCredentials(userId: string, credentialId?: string) {
    try {
      let query = supabase
        .from('user_biometric_credentials')
        .delete()
        .eq('user_id', userId)

      if (credentialId) {
        query = query.eq('credential_id', credentialId)
      }

      const { error, count } = await query

      if (error) throw error
      
      return { 
        success: true, 
        deletedCount: count || 0 
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      throw error
    }
  },

  // Vérifier si WebAuthn est supporté
  isWebAuthnSupported(): boolean {
    return !!(
      window.PublicKeyCredential && 
      typeof window.PublicKeyCredential === 'function' &&
      navigator.credentials && 
      typeof navigator.credentials.create === 'function' &&
      typeof crypto !== 'undefined' &&
      typeof crypto.getRandomValues === 'function'
    )
  }
}