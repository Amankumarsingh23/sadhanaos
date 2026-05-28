import { motion } from 'framer-motion'
import Link from 'next/link'

interface EmptyStateProps {
  icon?:        string
  title:        string
  description?: string
  ctaLabel?:    string
  ctaHref?:     string
  className?:   string
}

export function EmptyState({
  icon = '🙏',
  title,
  description,
  ctaLabel,
  ctaHref,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}
    >
      <motion.span
        className="text-5xl mb-4 select-none"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.span>

      <p className="font-display text-lg text-indigo-deep font-semibold leading-snug max-w-xs">
        {title}
      </p>

      {description && (
        <p className="text-sm text-twilight mt-2 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-card bg-sacred-saffron text-white text-sm font-semibold shadow-warm-sm hover:bg-saffron-light transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </motion.div>
  )
}
