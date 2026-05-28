'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Shield, Wind, Bot } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard',   label: 'Home',   labelHi: 'घर',     Icon: Home          },
  { href: '/log',         label: 'Log',    labelHi: 'लॉग',    Icon: ClipboardList },
  { href: '/urge-shield', label: 'Shield', labelHi: 'शील्ड',  Icon: Shield        },
  { href: '/dhyana',      label: 'Dhyana', labelHi: 'ध्यान',  Icon: Wind          },
  { href: '/rishi',       label: 'Rishi',  labelHi: 'ऋषि',   Icon: Bot           },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 md:hidden',
        'bg-parchment/95 backdrop-blur-lg border-t border-sandstone',
        'safe-area-bottom',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map(({ href, label, labelHi, Icon }) => {
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
                className={cn(
                  'transition-colors',
                  active ? 'text-sacred-saffron' : 'text-twilight'
                )}
              />
              <span
                className={cn(
                  'font-devanagari text-[10px] leading-none transition-colors',
                  active ? 'text-sacred-saffron font-semibold' : 'text-twilight'
                )}
              >
                {labelHi}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
