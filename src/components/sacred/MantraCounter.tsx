'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MantraCounterProps {
  mantra?: string
  target?: number
  className?: string
  onMalaComplete?: () => void
}

const FULL_CIRCLE = 2 * Math.PI * 88  // circumference for r=88 (in the 200px SVG)

function buildDots(total: number): { cx: number; cy: number }[] {
  const cx = 100
  const cy = 100
  const r  = 88
  return Array.from({ length: total }, (_, i) => {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2
    return { cx: cx + r * Math.cos(angle), cy: cy + r * Math.sin(angle) }
  })
}

export function MantraCounter({ mantra = 'ॐ नमः शिवाय', target = 108, className, onMalaComplete }: MantraCounterProps) {
  const [count, setCount] = useState(0)
  const [burst, setBurst] = useState(false)
  const dots = buildDots(target)
  const completed = Math.floor(count / target)
  const inCycle   = count % target

  const onMalaRef  = useRef(onMalaComplete)
  const prevMalas  = useRef(0)
  useEffect(() => { onMalaRef.current = onMalaComplete }, [onMalaComplete])
  useEffect(() => {
    if (completed > prevMalas.current) {
      prevMalas.current = completed
      onMalaRef.current?.()
    }
  }, [completed])

  const increment = useCallback(() => {
    setCount((c) => {
      const next = c + 1
      if (next % target === 0) {
        setBurst(true)
        setTimeout(() => setBurst(false), 600)
      }
      return next
    })
    if ('vibrate' in navigator) navigator.vibrate(18)
  }, [target])

  const reset = useCallback(() => {
    setCount(0)
    setBurst(false)
  }, [])

  return (
    <div className={cn('flex flex-col items-center gap-4 select-none', className)}>
      {/* Mantra name */}
      <p className="font-devanagari text-base text-sacred-saffron text-center leading-relaxed" lang="sa">
        {mantra}
      </p>

      {/* Mala ring + tap button */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* 108 bead dots */}
        <svg
          width={200}
          height={200}
          className="absolute inset-0"
          aria-hidden
        >
          {dots.map((d, i) => {
            const filled = i < inCycle
            const isNext = i === inCycle && inCycle < target
            return (
              <motion.circle
                key={i}
                cx={d.cx}
                cy={d.cy}
                r={filled ? 3 : 2}
                fill={filled ? '#E8913A' : isNext ? '#F2B366' : '#E8D5BE'}
                initial={false}
                animate={{ scale: filled && i === inCycle - 1 ? [1.5, 1] : 1 }}
                transition={{ duration: 0.25 }}
              />
            )
          })}
        </svg>

        {/* Tap button */}
        <motion.button
          onClick={increment}
          whileTap={{ scale: 0.93 }}
          className={cn(
            'absolute inset-8 rounded-full flex flex-col items-center justify-center gap-0.5',
            'bg-parchment border-2 border-sandstone',
            'shadow-warm-md hover:shadow-warm-lg',
            'transition-shadow duration-200',
            'focus:outline-none focus:ring-2 focus:ring-sacred-saffron focus:ring-offset-2'
          )}
          aria-label={`Count ${count + 1}`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{    opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.18 }}
              className="text-3xl font-display font-semibold text-indigo-deep tabular-nums leading-none"
            >
              {inCycle === 0 && count > 0 ? target : inCycle}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs text-twilight">/ {target}</span>
        </motion.button>

        {/* Burst on mala completion */}
        <AnimatePresence>
          {burst && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-8 rounded-full border-2 border-temple-gold pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-center">
        <div>
          <p className="text-xs text-twilight">Total</p>
          <p className="text-lg font-display font-semibold text-indigo-deep">{count}</p>
        </div>
        {completed > 0 && (
          <div>
            <p className="text-xs text-twilight">Malas</p>
            <p className="text-lg font-display font-semibold text-sacred-saffron">{completed}</p>
          </div>
        )}
      </div>

      {/* Reset */}
      {count > 0 && (
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-twilight hover:text-rose-red transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      )}
    </div>
  )
}
