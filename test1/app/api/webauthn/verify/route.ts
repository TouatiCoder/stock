import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { attestationResponse, userId } = body;

  const supabase = getSupabaseClient();
  const { data } = await supabase.from("webauthn_challenges").select("challenge").eq("user_id", userId).single();
  const expectedChallenge = data?.challenge;

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: "http://localhost:3000", // ou ton domaine prod
    expectedRPID: "localhost",
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }

  const credential = verification.registrationInfo.credential;
  const credentialId = Buffer.from(credential.id, "base64");
  const publicKey = Buffer.from(credential.publicKey); 

  // ✅ signCount maintenant sur registrationInfo
  const signCount = 0;

  await supabase.from("webauthn_credentials").insert({
    user_id: userId,
    credential_id: credentialId,
    public_key: publicKey,
    sign_count: signCount,
  });

  return NextResponse.json({ ok: true });
}
