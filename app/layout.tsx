import type React from "react"
import type { Metadata } from "next"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"
import ClientProviders from "@/components/layout/client-providers"
import { cookies } from "next/headers"
import { LOCALE_COOKIE, defaultLocale, isRtl, normalizeLocale } from "@/lib/i18n"

const inter = Inter({ subsets: ["latin"] })

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "BuildStock Pro - Gestion de Stocks et Calculs Structurels",
  description:
    "Solution complète de gestion de stocks et calculs structurels pour l'industrie de la construction",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const localeStr = cookieStore.get(LOCALE_COOKIE)?.value
  const initialLocale = normalizeLocale(localeStr) ?? defaultLocale
  const lang = initialLocale
  const dir = isRtl(initialLocale) ? "rtl" : "ltr"

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${inter.className} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-white" suppressHydrationWarning>
        <ClientProviders initialLocale={initialLocale}>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
