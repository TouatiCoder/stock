"use client"

import { SignupForm } from "@/components/auth/signup-form"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export function SignupOpenView() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
