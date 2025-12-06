"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "admin" | "supervisor" | "engineer"

export interface User {
  id: string
  email: string
  name: string
  company_id: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger l'utilisateur au montage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Simuler la récupération de la session
        const storedUser = localStorage.getItem("buildstock_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simuler l'authentification
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        company_id: "company-1",
        role: "admin", // À remplacer par la logique réelle
      }

      setUser(mockUser)
      localStorage.setItem("buildstock_user", JSON.stringify(mockUser))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("buildstock_user")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}
