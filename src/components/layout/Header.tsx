'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Flame, PlusCircle } from 'lucide-react'
import { PAGE_TITLES } from '@/lib/constants'
import { getHinduDate, cn } from '@/lib/utils'

interface HeaderProps {
  streak?: number
  isActive?: boolean
  onMenuClick: () => void
  className?: string
}

export function Header({ streak = 1, isActive = true, onMenuClick, className }: HeaderProps) {
  const pathname = usePathname()
  const page = PAGE_TITLES[pathname] ?? { title: 'SadhanaOS', titleHi: 'साधना', subtitle: '' }
  const hinduDate = getHinduDate()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-4 px-5 py-3',
        'bg-parchment/90 backdrop-blur-md border-b border-sandstone',
        className
      )}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden rounded-lg p-2 text-twilight hover:text-indigo-deep hover:bg-sandstone/60 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-lg font-semibold text-indigo-deep leading-tight truncate">
            {page.title}
          </h2>
          <span
            className="hidden sm:inline font-devanagari text-sm text-twilight"
            lang="sa"
          >
            {page.titleHi}
          </span>
        </div>
        {page.subtitle && (
          <p className="text-xs text-twilight truncate hidden sm:block">{page.subtitle}</p>
        )}
      </div>

      {/* ── Right side ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Tithi / date — hidden on small screens */}
        <div className="hidden lg:flex flex-col items-end">
          <span
            className="font-devanagari text-xs text-indigo-mid leading-tight"
            lang="hi"
            title="Approximate Hindu Panchang"
          >
            {hinduDate.formatted}
          </span>
          <span className="text-[10px] text-twilight">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Compact streak badge */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
            'border transition-all',
            isActive
              ? 'bg-sacred-saffron/10 border-sacred-saffron/30 text-saffron-deep'
              : 'bg-sandstone/60 border-sandstone text-twilight'
          )}
        >
          <Flame
            size={12}
            className={isActive ? 'text-sacred-saffron' : 'text-twilight'}
          />
          <span>Day {streak}</span>
        </div>

        {/* Log Today CTA */}
        <Link
          href="/log"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-card text-sm font-medium bg-sacred-saffron text-dawn-white hover:bg-saffron-light active:bg-saffron-deep transition-colors shadow-warm-sm"
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Log Today</span>
        </Link>
      </div>
    </header>
  )
}
