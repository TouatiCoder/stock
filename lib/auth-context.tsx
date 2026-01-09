'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation' // ✅ أضفنا usePathname

// Export UserRole type
export type UserRole = 'admin' | 'site_manager' | 'structural_engineer'

// Types pour les données d'inscription
interface RegisterData {
  email: string
  password: string
  companyName: string
  siret?: string
}

// Type pour le profil utilisateur depuis notre table
interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  company_id: string
  phone?: string
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname() // ✅ معرفة المسار الحالي

  useEffect(() => {
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user) {
          // إذا سجل الدخول، نجلب البروفايل
          await fetchUserProfile(session.user.id)
        } else {
          // 🔻 التعديل الجذري هنا لإصلاح مشكلة الدعوات 🔻
          setUserProfile(null)
          
          // تحديد الصفحات التي لا يجب الطرد منها
          const publicPaths = ['/login', '/signup', '/invite', '/forgot-password', '/auth']
          
          // نستخدم window.location.pathname للتأكد من المسار الحالي بدقة داخل الـ callback
          const currentPath = window.location.pathname
          const isPublicPage = publicPaths.some(path => currentPath.startsWith(path))

          // لا تقم بالطرد إذا كنا في صفحة عامة (مثل صفحة الدعوة)
          if (!isPublicPage && currentPath !== '/') {
            router.push('/')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router]) // pathname ليس ضرورياً في المصفوفة لأننا نستخدم window.location

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      setUserProfile(data)
      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(
          authError.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect'
            : authError.message
        )
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur retourné')
      }

      const profile = await fetchUserProfile(authData.user.id)
      
      if (!profile) {
        throw new Error('Profil utilisateur non trouvé')
      }

      switch (profile.role) {
        case 'admin':
          router.push('/dashboard')
          break
        case 'site_manager':
          router.push('/dashboard/site-manager')
          break
        case 'structural_engineer':
          router.push('/dashboard/engineer')
          break
        default:
          router.push('/dashboard')
      }

      router.refresh()

    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      
      // 1. التحقق من عدم وجود أدمن سابق (اختياري، التريجر يقوم به أيضاً)
      const { data: existingAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      if (existingAdmin) {
        throw new Error('Le compte admin existe déjà. Utilisez une invitation.')
      }

      // 2. إنشاء الشركة
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.companyName,
          email: data.email, // أصبح الآن يقبل القيمة الفارغة بفضل التعديل السابق
          currency: 'MAD',
          country: 'Maroc',
          timezone: 'Africa/Casablanca',
          is_active: true,
        })
        .select()
        .single()

      if (companyError) throw new Error(`Erreur création entreprise: ${companyError.message}`)

      // 3. إنشاء حساب الدخول (Supabase سيرسل الإيميل تلقائياً)
      // ملاحظة: التريجر في قاعدة البيانات سينشئ البروفايل في public.users تلقائياً
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`, // رابط العودة بعد تفعيل الإيميل
          data: {
            company_id: companyData.id,
            company_name: data.companyName,
            role: 'admin',
            first_name: 'Admin', // قيم افتراضية
            last_name: ''
          },
        },
      })

      if (authError) throw authError
      
      // لن نقوم بتسجيل الدخول هنا لأن الإيميل يحتاج تفعيل
      
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ 
      user: userProfile, 
      session, 
      isLoading, 
      login, 
      register, 
      logout 
    }}>
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