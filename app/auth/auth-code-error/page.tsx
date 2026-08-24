"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useAuthTranslations } from "@/components/LocaleProvider"

export default function AuthErrorPage() {
  const t = useAuthTranslations("authCodeError")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-red-700">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {t("description")}
          </p>

          <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200 text-left">
            <strong>{t("tipTitle")}</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>{t("tipItem1")}</li>
              <li>{t("tipItem2")}</li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
