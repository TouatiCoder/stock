"use client"

import { ReactNode } from "react"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

type AuthLayoutProps = {
  title?: string
  subtitle?: string
  children: ReactNode
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        {title && <h1 className="text-2xl font-bold mb-2">{title}</h1>}
        {subtitle && (
          <p className="text-sm text-gray-600 mb-6">{subtitle}</p>
        )}

        {children}
      </div>
    </div>
  )
}
