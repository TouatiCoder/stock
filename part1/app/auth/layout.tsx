import type React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-white font-bold text-xl hover:opacity-80">
          BuildStock Pro
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
