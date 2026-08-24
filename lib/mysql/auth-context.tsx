'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCommonTranslations } from '@/components/LocaleProvider'

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  isPlatformAdmin: boolean;
  authMethod?: "password_only" | "biometric_only" | "biometric_password";
  phone?: string;
  lastLoginAt?: string;
  subscriptionStatus?: string;
  subscriptionTrialEndsAt?: string | null;
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const t = useCommonTranslations()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data.user)
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      setUserProfile(null)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshUser()
      setIsLoading(false)
    }
    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('loginFailed'))

      setUserProfile(data.user)
      if (data.previousLoginAt) {
        toast.info(`Last login: ${new Date(data.previousLoginAt).toLocaleString()}`)
      } else {
        toast.info("Welcome! This is your first login.")
      }

      if (data.subscriptionStatus === "trialing") {
        sessionStorage.setItem(
          "trial-popup",
          JSON.stringify({
            status: "trialing",
            trialEndsAt: data.subscriptionTrialEndsAt || null,
            at: Date.now(),
          }),
        )
      }
      toast.success(t('loginSuccess'))
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: any) => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || t('registrationFailed'))

      toast.success(t('registrationSuccess'))
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUserProfile(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <AuthContext.Provider value={{ user: userProfile, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
