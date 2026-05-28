'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, ClipboardList, Shield, Wind, Bot, LayoutGrid,
  BarChart3, Target, BookOpen, Heart, Sparkles, PenLine, Settings, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard',   labelHi: 'घर',    Icon: Home          },
  { href: '/log',         labelHi: 'लॉग',   Icon: ClipboardList },
  { href: '/urge-shield', labelHi: 'शील्ड', Icon: Shield        },
  { href: '/dhyana',      labelHi: 'ध्यान',  Icon: Wind          },
  { href: '/rishi',       labelHi: 'ऋषि',   Icon: Bot           },
] as const

const MORE_ITEMS = [
  { href: '/analytics',   labelHi: 'दर्पण',      label: 'Analytics', Icon: BarChart3 },
  { href: '/goals',       labelHi: 'लक्ष्य',      label: 'Goals',     Icon: Target    },
  { href: '/granthalaya', labelHi: 'ग्रन्थालय',   label: 'Library',   Icon: BookOpen  },
  { href: '/prarthana',   labelHi: 'प्रार्थना',    label: 'Prayer',    Icon: Heart     },
  { href: '/chintan',     labelHi: 'चिन्तन',      label: 'Journal',   Icon: PenLine   },
  { href: '/skincare',    labelHi: 'रूप साधना',   label: 'Skincare',  Icon: Sparkles  },
  { href: '/settings',    labelHi: 'विधि',         label: 'Settings',  Icon: Settings  },
] as const

export function BottomTabBar() {
  const pathname    = usePathname()
  const [showMore, setShowMore] = useState(false)

  // "More" is considered active if current page is one of the MORE_ITEMS routes
  const moreActive = MORE_ITEMS.some(({ href }) => pathname.startsWith(href))

  return (
    <>
      {/* ── Main tab bar ── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-parchment/95 backdrop-blur-lg border-t border-sandstone"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-14">
          {TABS.map(({ href, labelHi, Icon }) => {
            const active = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="bottom-tab-indicator"
                    className="absolute top-0 inset-x-2 h-0.5 bg-sacred-saffron rounded-b-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  className={cn('transition-colors', active ? 'text-sacred-saffron' : 'text-twilight')}
                />
                <span className={cn(
                  'font-devanagari text-[10px] leading-none transition-colors',
                  active ? 'text-sacred-saffron font-semibold' : 'text-twilight'
                )}>
                  {labelHi}
                </span>
              </Link>
            )
          })}

          {/* ── More button ── */}
          <button
            onClick={() => setShowMore(true)}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          >
            {moreActive && !showMore && (
              <motion.div
                layoutId="bottom-tab-indicator"
                className="absolute top-0 inset-x-2 h-0.5 bg-sacred-saffron rounded-b-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <LayoutGrid
              size={20}
              className={cn('transition-colors', moreActive ? 'text-sacred-saffron' : 'text-twilight')}
            />
            <span className={cn(
              'font-devanagari text-[10px] leading-none transition-colors',
              moreActive ? 'text-sacred-saffron font-semibold' : 'text-twilight'
            )}>
              और
            </span>
          </button>
        </div>
      </nav>

      {/* ── More sheet + backdrop ── */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
              onClick={() => setShowMore(false)}
            />

            {/* Sheet */}
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-parchment rounded-t-2xl shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-sandstone" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-sandstone/60">
                <div>
                  <p className="font-devanagari text-base text-indigo-deep font-semibold">सभी पृष्ठ</p>
                  <p className="text-xs text-twilight italic">All Pages</p>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-sandstone/40 text-twilight"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid of pages */}
              <div className="grid grid-cols-4 gap-1 p-4">
                {MORE_ITEMS.map(({ href, labelHi, label, Icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowMore(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all active:scale-95',
                        active
                          ? 'bg-sacred-saffron/10 border border-sacred-saffron/30'
                          : 'bg-sandstone/20 border border-transparent'
                      )}
                    >
                      <Icon
                        size={22}
                        className={active ? 'text-sacred-saffron' : 'text-twilight'}
                      />
                      <span className={cn(
                        'font-devanagari text-[10px] leading-tight text-center',
                        active ? 'text-sacred-saffron font-semibold' : 'text-twilight'
                      )}>
                        {labelHi}
                      </span>
                      <span className="text-[9px] text-twilight/60 leading-none">{label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Sacred footer */}
              <p className="text-center text-xs text-twilight/40 font-devanagari pb-2">
                ॐ तत् सत्
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
