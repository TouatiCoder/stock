import { Suspense } from "react"
import CallbackClient from "././callback-client"

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Connexion en cours...</div>}>
      <CallbackClient />
    </Suspense>
  )
}
