"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CallbackClient() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Checking callback...")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      const next = searchParams.get("next") || "/dashboard"
      const invitationToken = searchParams.get("token")
      const errorDescription = searchParams.get("error_description")

      if (errorDescription) {
        setStatus("Callback failed")
        setErrorMsg(decodeURIComponent(errorDescription))
        return
      }

      if (invitationToken) {
        window.location.href = `/invite/accept?token=${encodeURIComponent(invitationToken)}`
        return
      }

      try {
        const meRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        })

        if (meRes.ok) {
          window.location.href = next
          return
        }
      } catch {
        // continue to login fallback
      }

      window.location.href = "/login"
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100 transition-all duration-300">
        {errorMsg ? (
          <div className="space-y-4 animate-in fade-in zoom-in">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-fit">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{status}</h2>
            <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-100">{errorMsg}</p>
            <div className="pt-4">
              <Button asChild className="w-full bg-gray-800 hover:bg-gray-900">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-2 rounded-full shadow-sm border border-blue-100">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{status}</h2>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
