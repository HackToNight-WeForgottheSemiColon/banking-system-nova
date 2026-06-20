'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from './api-client'

interface User {
  id: number
  username: string
  role: string
  fullName: string
  email: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ['/login', '/sign-up', '/reset-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('session_token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await apiClient<{ user: User }>('/auth/me')
        setUser(res.user)
      } catch (err) {
        console.error('Failed to load user', err)
        localStorage.removeItem('session_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '')
      if (!user && !isPublicRoute) {
        router.push('/login')
      } else if (user && isPublicRoute) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, pathname, router])

  const login = async (username: string, password: string) => {
    try {
      const res = await apiClient<{ token: string; user: User }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password })
        }
      )
      localStorage.setItem('session_token', res.token)
      setUser(res.user)
      router.push('/dashboard')
    } catch (err) {
      throw err
    }
  }

  const register = async (data: any) => {
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      router.push('/login')
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('session_token')
    setUser(null)
    router.push('/login')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
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
