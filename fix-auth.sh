#!/bin/bash
cd /root/corporate-learning-platform-v2
cat > lib/auth-context.tsx << 'EOFILE'
"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'student'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    
    async function checkAuth() {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/auth/me', {
          signal: controller.signal,
          credentials: 'include'
        })
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && mounted) {
          console.error('Auth check failed:', error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа')
    }

    setUser(data.user)
    
    if (data.user.role === 'admin') {
      window.location.replace('/admin/dashboard')
    } else if (data.user.role === 'manager') {
      window.location.replace('/manager/dashboard')
    } else {
      window.location.replace('/dashboard')
    }
  }, [])

  const register = useCallback(async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Ошибка регистрации')
    }

    setUser(result.user)
    
    if (result.user.role === 'admin') {
      window.location.replace('/admin/dashboard')
    } else if (result.user.role === 'manager') {
      window.location.replace('/manager/dashboard')
    } else {
      window.location.replace('/dashboard')
    }
  }, [])

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }, [router])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout
  }), [user, loading, login, register, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
EOFILE
echo "Fixed"

