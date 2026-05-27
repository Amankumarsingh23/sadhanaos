'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const { loading, error, signUp, signInWithGoogle, clearError } = useAuth()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => { clearError() }, [clearError])

  // '__EMAIL_CONFIRMATION__' sentinel → show a success notice instead of an error
  const showConfirmation = error?.message === '__EMAIL_CONFIRMATION__'
  const displayError     = error && !showConfirmation ? error : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signUp(name, email, password)
  }

  if (showConfirmation || confirmed) {
    return (
      <div className="rounded-card bg-parchment border border-sandstone shadow-sacred p-8 space-y-4 text-center">
        <div className="text-4xl">🕊</div>
        <h2 className="font-display text-2xl font-semibold text-indigo-deep">Check your inbox</h2>
        <p className="text-twilight text-sm leading-relaxed">
          We sent a confirmation link to <strong className="text-indigo-deep">{email}</strong>.
          Click the link to activate your account and begin your sadhana.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-sm text-sacred-saffron hover:text-saffron-deep font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-parchment border border-sandstone shadow-sacred p-8 space-y-6">
      {/* Brand header */}
      <div className="text-center space-y-1">
        <div className="text-3xl mb-2">🕉</div>
        <h1 className="font-display text-3xl font-semibold text-indigo-deep tracking-wide">
          Begin Sadhana
        </h1>
        <p className="font-devanagari text-twilight text-base">साधना का शुभारम्भ करें</p>
      </div>

      {/* Error banner */}
      {displayError && (
        <div className="rounded-card bg-rose-red/8 border border-rose-red/30 px-4 py-3 text-sm text-rose-red">
          {displayError.message}
        </div>
      )}

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Your name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          hint="Minimum 6 characters"
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Create Account
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-sandstone" />
        <span className="text-xs text-twilight">or</span>
        <div className="flex-1 h-px bg-sandstone" />
      </div>

      {/* Google OAuth */}
      <Button
        variant="secondary"
        className="w-full gap-2"
        loading={loading}
        disabled={loading}
        onClick={signInWithGoogle}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      {/* Footer link */}
      <p className="text-center text-sm text-twilight">
        Already have an account?{' '}
        <Link href="/login" className="text-sacred-saffron hover:text-saffron-deep font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
