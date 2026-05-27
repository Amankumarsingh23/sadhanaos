'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

type StreakTier = {
  label: string
  bg: string
  border: string
  text: string
  glow: boolean
  icon: string
}

function getTier(streak: number, isActive: boolean): StreakTier {
  if (!isActive) return {
    label: 'Streak broken',
    bg:     'bg-sandstone/60',
    border: 'border-sandstone',
    text:   'text-twilight',
    glow:   false,
    icon:   '○',
  }
  if (streak >= 60) return {
    label: `Day ${streak}`,
    bg:     'bg-gradient-to-br from-temple-gold/20 to-sacred-saffron/15',
    border: 'border-temple-gold/60',
    text:   'text-saffron-deep',
    glow:   true,
    icon:   '🪷',
  }
  if (streak >= 46) return {
    label: `Day ${streak}`,
    bg:     'bg-gradient-to-br from-sacred-saffron/20 to-saffron-light/10',
    border: 'border-sacred-saffron/50',
    text:   'text-saffron-deep',
    glow:   true,
    icon:   '🔥',
  }
  if (streak >= 22) return {
    label: `Day ${streak}`,
    bg:     'bg-gradient-to-br from-temple-gold/15 to-parchment',
    border: 'border-temple-gold/40',
    text:   'text-saffron-deep',
    glow:   false,
    icon:   '✦',
  }
  if (streak >= 8) return {
    label: `Day ${streak}`,
    bg:     'bg-gradient-to-br from-sandstone/80 to-parchment',
    border: 'border-sandstone',
    text:   'text-indigo-mid',
    glow:   false,
    icon:   '◆',
  }
  return {
    label: `Day ${streak}`,
    bg:     'bg-parchment',
    border: 'border-sandstone',
    text:   'text-indigo-mid',
    glow:   false,
    icon:   '◇',
  }
}

const sizeClasses = {
  sm: { wrapper: 'px-2.5 py-1.5 gap-1.5', icon: 'text-sm', label: 'text-xs', day: 'text-sm' },
  md: { wrapper: 'px-3.5 py-2 gap-2',     icon: 'text-base', label: 'text-xs', day: 'text-base' },
  lg: { wrapper: 'px-5 py-3 gap-2.5',     icon: 'text-lg',  label: 'text-sm', day: 'text-xl'  },
}

export function StreakBadge({ streak, isActive = true, size = 'md', className }: StreakBadgeProps) {
  const tier = getTier(streak, isActive)
  const sz   = sizeClasses[size]

  const badge = (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        tier.bg, tier.border, tier.text,
        sz.wrapper,
        tier.glow && 'shadow-saffron-glow',
        className
      )}
    >
      <span className={sz.icon} aria-hidden>{tier.icon}</span>
      <span className={cn('font-display font-semibold', sz.day)}>
        {isActive ? streak : '—'}
      </span>
      <span className={cn('text-current/60', sz.label)}>{tier.label}</span>
    </div>
  )

  if (!tier.glow) return badge

  return (
    <motion.div
      className="relative inline-flex"
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {badge}
      {/* Subtle divine shimmer ring */}
      {streak >= 60 && (
        <motion.div
          className="absolute inset-0 rounded-full border border-temple-gold/40 pointer-events-none"
          animate={{ scale: [1, 1.12, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}
