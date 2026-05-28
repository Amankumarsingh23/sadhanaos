'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { ToastProvider } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ─── Sacred loading messages ──────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'ॐ...',
  'प्रकाशो अयम्...',
  'तत् त्वम् असि...',
  'अहम् ब्रह्मास्मि...',
  'सत् चित् आनन्द...',
]

function SacredLoader() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-parchment to-dawn-white">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="text-5xl select-none"
        >
          🕉️
        </motion.div>

        <div className="h-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="font-devanagari text-sacred-saffron text-xl text-center"
            >
              {LOADING_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="text-sm text-twilight font-display italic">
          Preparing your sacred space…
        </p>

        <div className="w-32 h-0.5 rounded-full bg-sandstone overflow-hidden">
          <motion.div
            className="h-full bg-sacred-saffron rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

interface ShellClientProps {
  children: React.ReactNode
}

export function ShellClient({ children }: ShellClientProps) {
  const router = useRouter()
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [user,         setUser]         = useState<User | null>(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [streak,       setStreak]       = useState(1)
  const [isActive,     setIsActive]     = useState(true)

  // ── Auth ───────────────────────────────────────────────────────────────────
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

  // ── Fetch streak ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase.from('v_current_streak').select('current_streak').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('streak_maintained').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
    ]).then(([{ data: streakData }, { data: logData }]) => {
      const s = streakData?.current_streak ?? 1
      setStreak(s)
      setIsActive(logData?.streak_maintained ?? s > 0)
    })
  }, [user])

  // ── Close sidebar on resize ────────────────────────────────────────────────
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 768) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!authChecked) return <SacredLoader />
  if (!user) return null

  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0]

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-dawn-white">
        <Sidebar
          streak={streak}
          isActive={isActive}
          userName={displayName}
          userEmail={user.email}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header
            streak={streak}
            isActive={isActive}
            onMenuClick={() => setSidebarOpen(true)}
          />
          {/* pb-20 on mobile to clear the bottom tab bar */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      <BottomTabBar />
    </ToastProvider>
  )
}
