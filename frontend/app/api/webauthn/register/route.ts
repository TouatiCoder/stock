import { NextRequest, NextResponse } from "next/server"
import { createApiClient } from "@/lib/supabase/server"
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse 
} from "@simplewebauthn/server"

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
      return NextResponse.json({ 
        error: "User not found. Please sign in with password first." 
      }, { status: 404 })
    }

    // Récupérer les credentials existantes
    const { data: existingCredentials } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", user.id)

    // ✅ CORRECTION : userID doit être Uint8Array, pas string
    const userID = new Uint8Array(Buffer.from(user.id))

    const options = await generateRegistrationOptions({
      rpName: "BuildStock Pro",
      rpID,
      userID, // <-- Uint8Array maintenant
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: "none" as const,
      excludeCredentials: existingCredentials?.map((cred: any) => ({
        id: Buffer.from(cred.credential_id, "base64url").toString("base64url"),
        type: "public-key" as const,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred" as const,
        userVerification: "preferred" as const,
      },
      timeout: 60000,
    })

    // Stocker le challenge
    await supabase
      .from("webauthn_challenges")
      .upsert({
        user_id: user.id,
        challenge: options.challenge,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Error generating registration options:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate registration options" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const body = await request.json()
    const { registrationResponse, email } = body

    if (!registrationResponse || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur et le challenge
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challengeData.challenge,
      expectedOrigin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 401 })
    }

    const { registrationInfo } = verification

    // ✅ CORRECTION : Les propriétés sont maintenant dans registrationInfo.credential
    // Pour debug, log la structure complète
    console.log("Registration info structure:", JSON.stringify(registrationInfo, null, 2))
    
    // Accès sécurisé avec fallback
    const credential = registrationInfo.credential
    
    if (!credential) {
      throw new Error("Credential not found in registration info")
    }

    const credentialID = credential.id
    const credentialPublicKey = credential.publicKey
    const counter = credential.counter || 0

    if (!credentialID || !credentialPublicKey) {
      throw new Error("Invalid credential structure")
    }

    // Convertir en base64url pour stockage
    const credentialIDBase64 = Buffer.from(credentialID).toString("base64url")
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString("base64url")

    // Enregistrer la nouvelle credential
    await supabase.from("webauthn_credentials").insert({
      user_id: user.id,
      credential_id: credentialIDBase64,
      public_key: publicKeyBase64,
      counter: counter,
      transports: registrationResponse.response.transports 
        ? JSON.stringify(registrationResponse.response.transports)
        : null,
      device_type: "platform",
    })

    // Supprimer le challenge
    await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("id", challengeData.id)

    return NextResponse.json({ 
      success: true,
      message: "Passkey registered successfully"
    })
  } catch (error) {
    console.error("Error verifying registration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration verification failed" },
      { status: 500 }
    )
  }
}