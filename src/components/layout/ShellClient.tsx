'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface ShellClientProps {
  children: React.ReactNode
}

export function ShellClient({ children }: ShellClientProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      setAuthChecked(true)
      if (!u) router.replace('/login')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) router.replace('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Close sidebar on desktop resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // TODO: fetch real streak from Supabase (placeholder until streak logic is built)
  const streak = 1
  const isActive = true

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dawn-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-sacred-saffron border-t-transparent animate-spin" />
          <p className="font-display text-indigo-mid text-sm">Loading your sadhana…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name as string | undefined
    ?? user.email?.split('@')[0]

  return (
    <div className="flex h-screen overflow-hidden bg-dawn-white">
      <Sidebar
        streak={streak}
        isActive={isActive}
        userName={displayName}
        userEmail={user.email}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          streak={streak}
          isActive={isActive}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
