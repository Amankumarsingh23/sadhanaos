'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthError {
  message: string
}

interface UseAuthReturn {
  loading: boolean
  error: AuthError | null
  signIn:         (email: string, password: string) => Promise<void>
  signUp:         (name: string, email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut:        () => Promise<void>
  clearError:     () => void
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<AuthError | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError({ message: (err as { message?: string }).message ?? 'Sign in failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [router])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (err) throw err
      // If email confirmation is disabled, session is set immediately
      if (data.session) {
        router.push('/onboarding')
        router.refresh()
      } else {
        // Email confirmation required — show a message (handled in page)
        setError({ message: '__EMAIL_CONFIRMATION__' })
      }
    } catch (err: unknown) {
      setError({ message: (err as { message?: string }).message ?? 'Sign up failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [router])

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (err) throw err
      // Browser will redirect to Google — loading stays true
    } catch (err: unknown) {
      setError({ message: (err as { message?: string }).message ?? 'Google sign in failed.' })
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    setLoading(false)
  }, [router])

  return { loading, error, signIn, signUp, signInWithGoogle, signOut, clearError }
}
