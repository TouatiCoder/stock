 'use client'
 
 import dynamic from 'next/dynamic'
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
         {children}
         <LanguageModal />
         <Toaster />
       </AuthProvider>
     </LocaleProvider>
   )
 }
 
 export default ClientProviders
