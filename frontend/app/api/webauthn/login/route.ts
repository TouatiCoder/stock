import { NextRequest, NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase/server" 
import { 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse,
  AuthenticationResponseJSON 
} from "@simplewebauthn/server"
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { randomUUID } from "crypto"

// Configuration WebAuthn
const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || "localhost"
const expectedOrigin = process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || "http://localhost:3000"

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Récupérer les credentials de l'utilisateur
    const { data: credentials } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", user.id)

    // ✅ CORRECTION : Convertir Buffer en string Base64URL
    const allowCredentials = (credentials || []).map((cred: any) => {
      const transports: AuthenticatorTransportFuture[] = cred.transports 
        ? JSON.parse(cred.transports)
        : undefined

      // Convertir la credential_id (déjà en base64url dans la DB) en Buffer puis en string
      const credentialIdBuffer = Buffer.from(cred.credential_id, "base64url")
      
      return {
        // ✅ Convertir Buffer en string Base64URL
        id: credentialIdBuffer.toString("base64url"),
        type: "public-key" as const,
        transports
      }
    })

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60000,
    })

    // Stocker le challenge temporairement
    await supabase
      .from("webauthn_challenges")
      .upsert({
        user_id: user.id,
        challenge: options.challenge,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Error generating auth options:", error)
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const body = await request.json()
    const { assertionResponse, email } = body

    if (!assertionResponse || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Récupérer le challenge stocké
    const { data: challengeData } = await supabase
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!challengeData) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 400 })
    }

    // Chercher toutes les credentials de l'utilisateur
    const { data: allCredentials } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", user.id)

    if (!allCredentials || allCredentials.length === 0) {
      return NextResponse.json({ error: "No passkey found for this user" }, { status: 404 })
    }

    // Utiliser la première credential
    const credential = allCredentials[0]
    
    // Vérifier la réponse d'authentification
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse as AuthenticationResponseJSON,
      expectedChallenge: challengeData.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: credential.credential_id,
        publicKey: credential.public_key,
        counter: credential.counter,
        transports: credential.transports 
          ? JSON.parse(credential.transports) 
          : undefined,
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 401 })
    }

    // Mettre à jour le compteur
    await supabase
      .from("webauthn_credentials")
      .update({ 
        counter: verification.authenticationInfo.newCounter,
        updated_at: new Date().toISOString()
      })
      .eq("id", credential.id)

    // Supprimer le challenge utilisé
    await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("id", challengeData.id)

    // Utiliser l'admin API pour créer une session
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${expectedOrigin}/dashboard`
      }
    })

    if (authError) {
      console.error("Admin auth error:", authError)
      
      // Fallback : créer une session custom
      const customToken = randomUUID()
      
      await supabase
        .from("webauthn_sessions")
        .insert({
          user_id: user.id,
          token: customToken,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })

      return NextResponse.json({ 
        success: true, 
        token: customToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      authData
    })

  } catch (error) {
    console.error("Error verifying authentication:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication verification failed" },
      { status: 500 }
    )
  }
}