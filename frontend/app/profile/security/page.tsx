/*"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function SecurityPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  const enrollPasskey = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error("User not authenticated")

      const options = await fetch("/api/webauthn/register").then(res => res.json())

      const credential: any = await navigator.credentials.create({ publicKey: options })

      // Convert ArrayBuffers to JSON-safe format
      const credentialJSON = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
        },
      }

      await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestationResponse: credentialJSON, userId: user.id })
      })

      alert("Passkey enrolled successfully!")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to enroll passkey")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Security Settings</h1>
      {error && <div className="text-red-600">{error}</div>}
      <button
        onClick={enrollPasskey}
        disabled={loading}
        className="mt-4 p-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Enrolling..." : "Enable Face ID / Fingerprint"}
      </button>
    </div>
  )
}
*/