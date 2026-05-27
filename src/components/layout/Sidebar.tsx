'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, ClipboardList, Shield, Wind, BookOpen, Heart,
  Sparkles, Pen, BarChart3, Bot, Target, Settings,
  LogOut, ChevronLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_ITEMS, type NavItem } from '@/lib/constants'
import { DiyaFlame } from '@/components/sacred/DiyaFlame'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/* Map icon string → lucide component */
const ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Home, ClipboardList, Shield, Wind, BookOpen, Heart,
  Sparkles, Pen, BarChart3, Bot, Target, Settings,
}

interface SidebarProps {
  streak?: number
  isActive?: boolean
  userName?: string
  userEmail?: string
  open: boolean
  onClose: () => void
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = ICONS[item.icon] ?? Home
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-r-xl px-3 py-2.5 text-sm',
        'transition-all duration-150',
        active
          ? 'bg-sacred-saffron/12 text-saffron-deep font-semibold'
          : 'text-indigo-mid hover:bg-sandstone/70 hover:text-indigo-deep'
      )}
    >
      {/* Active left border */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-sacred-saffron" />
      )}
      <Icon
        size={16}
        className={cn(
          'flex-shrink-0 transition-colors',
          active ? 'text-sacred-saffron' : 'text-twilight group-hover:text-indigo-mid'
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {/* Hindi label tooltip on hover */}
      <span
        className={cn(
          'absolute right-3 text-xs opacity-0 group-hover:opacity-60 transition-opacity',
          'font-devanagari text-twilight pointer-events-none',
          active && 'opacity-40'
        )}
      >
        {item.labelHi}
      </span>
    </Link>
  )
}

export function Sidebar({
  streak = 1,
  isActive = true,
  userName,
  userEmail,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const content = (
    <div className="flex h-full flex-col bg-parchment border-r border-sandstone">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-indigo-deep tracking-wide leading-none">
            SadhanaOS
          </h1>
          <p className="font-devanagari text-xs text-twilight mt-0.5 tracking-widest" lang="sa">
            साधना
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden rounded-lg p-1.5 text-twilight hover:bg-sandstone hover:text-indigo-deep transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── Streak indicator ─────────────────────────────────────── */}
      <div className="mx-3 mb-3 rounded-card bg-dawn-white border border-sandstone px-4 py-3 flex items-center gap-3">
        <DiyaFlame streak={streak} isActive={isActive} size="sm" />
        <div>
          <p className="text-xs font-semibold text-indigo-deep">
            Day {streak} <span className="text-twilight font-normal">of 60</span>
          </p>
          <p className="text-xs text-twilight mt-0.5">
            {isActive ? 'Streak active' : 'Streak broken'}
          </p>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="mx-4 mb-2 h-px bg-sandstone/70" />
      <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-twilight/70">
        Navigation
      </p>

      {/* ── Nav items ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────────────── */}
      <div className="border-t border-sandstone px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sandstone/60 transition-colors group">
          {/* Avatar placeholder */}
          <div className="h-8 w-8 rounded-full bg-sacred-saffron/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-sacred-saffron">
              {userName?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-indigo-deep truncate">
              {userName ?? 'Sadhaka'}
            </p>
            <p className="text-xs text-twilight truncate">{userEmail ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-twilight hover:text-rose-red transition-colors opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 h-screen sticky top-0 overflow-hidden">
        {content}
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-indigo-deep/40 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] md:hidden overflow-hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
