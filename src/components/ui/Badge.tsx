import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'saffron'
  | 'gold'
  | 'lotus'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  saffron: 'bg-sacred-saffron/15 text-saffron-deep border-sacred-saffron/30',
  gold:    'bg-temple-gold/15   text-saffron-deep border-temple-gold/40',
  lotus:   'bg-lotus-pink/15   text-lotus-pink   border-lotus-pink/30',
  success: 'bg-sage-green/15   text-sage-green   border-sage-green/30',
  info:    'bg-sky-blue/15     text-sky-blue     border-sky-blue/30',
  warning: 'bg-warm-clay/15    text-warm-clay    border-warm-clay/30',
  danger:  'bg-rose-red/15     text-rose-red     border-rose-red/30',
  muted:   'bg-sandstone/60    text-twilight     border-sandstone',
  outline: 'bg-transparent     text-indigo-mid   border-sandstone',
}

const dotColors: Record<BadgeVariant, string> = {
  saffron: 'bg-sacred-saffron',
  gold:    'bg-temple-gold',
  lotus:   'bg-lotus-pink',
  success: 'bg-sage-green',
  info:    'bg-sky-blue',
  warning: 'bg-warm-clay',
  danger:  'bg-rose-red',
  muted:   'bg-twilight',
  outline: 'bg-indigo-mid',
}

export function Badge({ className, variant = 'saffron', size = 'md', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
