'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-indigo-deep/40 backdrop-blur-sm"
            onClick={(e) => e.target === overlayRef.current && onClose()}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 16  }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              'relative z-10 w-full mx-4 bg-parchment rounded-modal shadow-warm-xl',
              'border border-sandstone',
              size === 'sm' && 'max-w-sm',
              size === 'md' && 'max-w-lg',
              size === 'lg' && 'max-w-2xl',
              className
            )}
          >
            {/* Top saffron accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-sacred-saffron via-saffron-light to-temple-gold rounded-t-modal" />

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 className="font-display text-xl font-semibold text-indigo-deep">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-twilight hover:text-indigo-deep hover:bg-sandstone/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-twilight hover:text-indigo-deep hover:bg-sandstone/60 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            <div className={cn('px-6 pb-6', title ? 'pt-0' : 'pt-4')}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
