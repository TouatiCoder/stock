'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { AuthService } from '@/lib/mysql/auth-service'

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Invalid email format" }
    }

    // Password minimum length
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" }
    }

    const result = await AuthService.login(email, password)
    
    if (!result) {
      return { error: "Invalid email or password" }
    }
    if (result.user.authMethod === "biometric_only") {
      return { error: "Password login is disabled for this account. Use biometric login." }
    }

    // Store token in cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    revalidatePath('/', 'layout')
    return {
      success: true,
      previousLoginAt: result.meta.previousLoginAt,
      subscriptionStatus: result.meta.subscriptionStatus,
      subscriptionTrialEndsAt: result.meta.subscriptionTrialEndsAt,
    }
    
  } catch (error: any) {
    console.error('Login action error:', error)
    return { error: "An error occurred. Please try again." }
  }
}
