import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
      <div className="p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
          <p className="text-slate-500">We've sent a verification link to your email address</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Check your email and click the verification link to complete your signup. Once verified, you'll be able to
            sign in.
          </p>
        </div>

        <Link href="/auth/login">
          <Button className="w-full">Go to Login</Button>
        </Link>
      </div>
    </Card>
  )
}
