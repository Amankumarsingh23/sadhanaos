'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, MessageCircle, BarChart3, X } from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { FeedbackWidget } from '@/components/ui/FeedbackWidget'
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
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [user,         setUser]         = useState<User | null>(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [streak,       setStreak]       = useState(1)
  const [isActive,     setIsActive]     = useState(true)
  const [deity,        setDeity]        = useState<string | null>(null)
  const [rishiFabOpen, setRishiFabOpen] = useState(false)

  // Hide FAB on Rishi page (already there)
  const showFab = !pathname.startsWith('/rishi')

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

  // ── Fetch streak + deity ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase.from('v_current_streak').select('current_streak').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('streak_maintained').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
      supabase.from('profiles').select('ist_deity').eq('id', user.id).single(),
    ]).then(([{ data: streakData }, { data: logData }, { data: profileData }]) => {
      const s = streakData?.current_streak ?? 1
      setStreak(s)
      setIsActive(logData?.streak_maintained ?? s > 0)
      setDeity(profileData?.ist_deity ?? null)
    })
  }, [user])

  // ── Register service worker (silent — no UI impact) ───────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */})
    }
  }, [])

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

      {/* ── Feedback widget — bottom-left, always visible ──────────── */}
      <FeedbackWidget userId={user.id} streak={streak} deity={deity} />

      {/* ── Floating Rishi FAB ─────────────────────────────────────── */}
      <AnimatePresence>
        {showFab && !rishiFabOpen && (
          <motion.button
            key="rishi-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRishiFabOpen(true)}
            className="fixed z-40 right-4 bottom-20 md:bottom-6 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-mid to-indigo-deep shadow-lg flex items-center justify-center border border-temple-gold/40"
            aria-label="Quick Rishi access"
          >
            {/* Subtle pulse ring */}
            <motion.span
              className="absolute inset-0 rounded-full border border-sacred-saffron/40"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <span className="font-devanagari text-xl text-sacred-saffron leading-none select-none">ऋ</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Rishi quick-access sheet ───────────────────────────────── */}
      <AnimatePresence>
        {rishiFabOpen && (
          <>
            <motion.div
              key="rishi-fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setRishiFabOpen(false)}
            />
            <motion.div
              key="rishi-fab-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-parchment rounded-t-2xl shadow-2xl px-5 pt-4 pb-8"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-sandstone" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-devanagari text-lg text-indigo-deep font-semibold">ऋषि मार्गदर्शन</p>
                  <p className="text-xs text-twilight italic">Your spiritual guide is ready</p>
                </div>
                <button onClick={() => setRishiFabOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-sandstone/40 text-twilight">
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Emergency */}
                <Link
                  href="/rishi?mode=emergency"
                  onClick={() => setRishiFabOpen(false)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl bg-rose-red/8 border border-rose-red/25 active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-red/15 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} className="text-rose-red" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-rose-red">आपातकालीन सहायता</p>
                    <p className="text-xs text-twilight">Struggling right now — immediate support</p>
                  </div>
                </Link>

                {/* Ask */}
                <Link
                  href="/rishi?mode=ask"
                  onClick={() => setRishiFabOpen(false)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl bg-sandstone/40 border border-sandstone active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-sacred-saffron/15 flex items-center justify-center shrink-0">
                    <MessageCircle size={18} className="text-sacred-saffron" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-indigo-deep">ऋषि से पूछें</p>
                    <p className="text-xs text-twilight">Ask anything about your sadhana</p>
                  </div>
                </Link>

                {/* Weekly */}
                <Link
                  href="/rishi?mode=weekly"
                  onClick={() => setRishiFabOpen(false)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl bg-sandstone/40 border border-sandstone active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-sage-green/15 flex items-center justify-center shrink-0">
                    <BarChart3 size={18} className="text-sage-green" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-indigo-deep">साप्ताहिक मार्गदर्शन</p>
                    <p className="text-xs text-twilight">This week&apos;s spiritual guidance report</p>
                  </div>
                </Link>
              </div>

              {/* Streak context */}
              <p className="text-center text-xs text-twilight/50 mt-4 font-devanagari">
                {streak} {streak === 1 ? 'दिन' : 'दिन'} की साधना — {isActive ? 'ज्योति प्रज्वलित है 🔥' : 'आज की साधना करें 🪔'}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ToastProvider>
  )
}
