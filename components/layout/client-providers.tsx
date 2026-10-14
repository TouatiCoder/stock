 'use client'
 
 import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function GlobalLiveRefresh() {
  const router = useRouter()

  useEffect(() => {
    let refreshing = false
    const refresh = () => {
      if (document.visibilityState !== 'visible' || refreshing) return
      refreshing = true
      router.refresh()
      // Next router.refresh() only updates Server Components. Also notify client-side
      // React Query/SWR listeners so mounted tables and widgets reload their DB data.
      window.dispatchEvent(new Event('buildstock:refresh'))
      // Prevent overlapping refresh requests; release before the next one-second tick.
      window.setTimeout(() => { refreshing = false }, 900)
    }

    const intervalId = window.setInterval(refresh, 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  return null
}

 import { LocaleProvider } from '@/components/LocaleProvider'
 import { AuthProvider } from '@/lib/mysql/auth-context'
 import { Toaster } from '@/components/ui/sonner'
 import { LanguageModal } from '@/components/LanguageModal'
 import type { Locale } from '@/lib/i18n'
 
 type ClientProvidersProps = {
   initialLocale: Locale
   children: React.ReactNode
 }
 
 const ClientProviders = ({ initialLocale, children }: ClientProvidersProps) => {
   return (
     <LocaleProvider initialLocale={initialLocale}>
       <AuthProvider>
         <GlobalLiveRefresh />
         {children}
         <LanguageModal />
         <Toaster />
       </AuthProvider>
     </LocaleProvider>
   )
 }
 
 export default ClientProviders
