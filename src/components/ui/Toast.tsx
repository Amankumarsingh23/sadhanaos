'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onDismiss: () => void
  duration?: number
  description?: string
}

const config: Record<ToastType, { icon: React.FC<{ size?: number; className?: string }>; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle,    bg: 'bg-sage-green/10',  border: 'border-sage-green/30',  text: 'text-sage-green'   },
  error:   { icon: XCircle,        bg: 'bg-rose-red/10',    border: 'border-rose-red/30',    text: 'text-rose-red'     },
  info:    { icon: Info,           bg: 'bg-sky-blue/10',    border: 'border-sky-blue/30',    text: 'text-sky-blue'     },
  warning: { icon: AlertTriangle,  bg: 'bg-warm-clay/10',   border: 'border-warm-clay/30',   text: 'text-warm-clay'    },
}

export function Toast({ message, type = 'info', onDismiss, duration = 4000, description }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  const { icon: Icon, bg, border, text } = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{    opacity: 0, x: 80 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={cn(
        'flex items-start gap-3 rounded-card border px-4 py-3 shadow-warm-lg min-w-[280px] max-w-sm',
        'bg-parchment',
        border
      )}
    >
      <Icon size={18} className={cn('mt-0.5 flex-shrink-0', text)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-indigo-deep">{message}</p>
        {description && <p className="mt-0.5 text-xs text-twilight">{description}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-twilight hover:text-indigo-deep transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

/* Toaster container — mount once in layout/page */
interface ToasterProps {
  toasts: Array<{ id: string; message: string; type?: ToastType; description?: string }>
  onDismiss: (id: string) => void
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            description={t.description}
            onDismiss={() => onDismiss(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
