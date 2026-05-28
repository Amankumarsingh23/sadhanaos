'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

type PatternKey = '4-7-8' | 'box' | 'anulom-vilom' | 'bhramari'
type PhaseName = 'inhale' | 'hold' | 'exhale' | 'hold2'

interface Phase {
  name: PhaseName
  duration: number  // seconds
  label: string
  labelHi: string
  scale: number
}

const PATTERNS: Record<PatternKey, { label: string; phases: Phase[] }> = {
  '4-7-8': {
    label: '4-7-8 Breathing',
    phases: [
      { name: 'inhale', duration: 4, label: 'Inhale',    labelHi: 'श्वास',   scale: 1.3 },
      { name: 'hold',   duration: 7, label: 'Hold',      labelHi: 'रोकें',   scale: 1.3 },
      { name: 'exhale', duration: 8, label: 'Exhale',    labelHi: 'निश्वास', scale: 0.75 },
    ],
  },
  box: {
    label: 'Box Breathing',
    phases: [
      { name: 'inhale', duration: 4, label: 'Inhale',    labelHi: 'श्वास',   scale: 1.3 },
      { name: 'hold',   duration: 4, label: 'Hold',      labelHi: 'रोकें',   scale: 1.3 },
      { name: 'exhale', duration: 4, label: 'Exhale',    labelHi: 'निश्वास', scale: 0.75 },
      { name: 'hold2',  duration: 4, label: 'Hold',      labelHi: 'रोकें',   scale: 0.75 },
    ],
  },
  bhramari: {
    label: 'Bhramari (Humming Bee)',
    phases: [
      { name: 'inhale', duration: 4, label: 'Inhale',    labelHi: 'श्वास',     scale: 1.3  },
      { name: 'exhale', duration: 8, label: 'Hum (ॐ)',   labelHi: 'ॐ ह्म्म्',  scale: 0.75 },
    ],
  },
  'anulom-vilom': {
    label: 'Anulom Vilom',
    phases: [
      { name: 'inhale', duration: 4, label: 'Inhale (L)', labelHi: 'श्वास (बायाँ)',   scale: 1.3 },
      { name: 'hold',   duration: 4, label: 'Hold',       labelHi: 'रोकें',            scale: 1.3 },
      { name: 'exhale', duration: 4, label: 'Exhale (R)', labelHi: 'निश्वास (दायाँ)', scale: 0.75 },
      { name: 'hold2',  duration: 4, label: 'Hold',       labelHi: 'रोकें',            scale: 0.75 },
    ],
  },
}

interface BreathingCircleProps {
  pattern?:          PatternKey
  size?:             number
  className?:        string
  autoStart?:        boolean
  onCycleComplete?:  () => void
}

export function BreathingCircle({ pattern = '4-7-8', size = 200, className, autoStart = false, onCycleComplete }: BreathingCircleProps) {
  const config = PATTERNS[pattern]
  const [active, setActive] = useState(autoStart)
  const onCycleRef = useRef(onCycleComplete)
  useEffect(() => { onCycleRef.current = onCycleComplete }, [onCycleComplete])
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [countdown, setCountdown] = useState(config.phases[0].duration)
  const [cycles, setCycles] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentPhase = config.phases[phaseIdx]

  const clearTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
  }, [])

  useEffect(() => {
    if (!active) return
    setCountdown(currentPhase.duration)
    tickRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTick()
          setPhaseIdx((i) => {
            const next = (i + 1) % config.phases.length
            if (next === 0) { setCycles((cy) => cy + 1); onCycleRef.current?.() }
            return next
          })
          return currentPhase.duration
        }
        return c - 1
      })
    }, 1000)
    return clearTick
  }, [active, phaseIdx, currentPhase.duration, config.phases.length, clearTick])

  function toggle() {
    if (active) {
      clearTick()
      setActive(false)
      setPhaseIdx(0)
      setCountdown(config.phases[0].duration)
      setCycles(0)
    } else {
      setActive(true)
    }
  }

  const radius = size / 2 - 8
  const circ   = 2 * Math.PI * radius
  const progress = 1 - countdown / currentPhase.duration

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      {/* Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer pulse ring when active */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-sky-blue/30"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: currentPhase.duration, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* SVG ring */}
        <svg
          width={size}
          height={size}
          className="-rotate-90 absolute inset-0"
          aria-hidden
        >
          <defs>
            <linearGradient id="breath-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#7AAEC4" />
              <stop offset="100%" stopColor="#2B2D5B" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E8D5BE" strokeWidth="4" />
          {/* Progress */}
          {active && (
            <motion.circle
              cx={size/2} cy={size/2} r={radius}
              fill="none"
              stroke="url(#breath-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              className="transition-all duration-1000 linear"
            />
          )}
        </svg>

        {/* Breathing circle */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #7AAEC4 0%, #4A4C7A 60%, #2B2D5B 100%)',
          }}
          animate={active ? { scale: currentPhase.scale } : { scale: 1 }}
          transition={{
            duration: currentPhase.duration,
            ease: currentPhase.name === 'inhale'  ? 'easeIn'
               : currentPhase.name === 'exhale'   ? 'easeOut'
               : 'linear',
          }}
        >
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={currentPhase.name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{    opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="font-devanagari text-sm text-dawn-white/90 text-center leading-tight">
                    {currentPhase.labelHi}
                  </span>
                  <span className="text-xs text-dawn-white/60">
                    {currentPhase.label}
                  </span>
                  <span className="text-2xl font-display font-light text-dawn-white tabular-nums">
                    {countdown}
                  </span>
                </motion.div>
              ) : (
                <motion.span
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-dawn-white/70 font-display italic"
                >
                  Ready
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-card text-sm font-medium transition-all',
            active
              ? 'bg-sandstone text-indigo-mid hover:bg-rose-red/10 hover:text-rose-red'
              : 'bg-sky-blue text-dawn-white hover:bg-sky-blue/90 shadow-warm-sm'
          )}
        >
          {active ? <Square size={14} /> : <Play size={14} />}
          {active ? 'Stop' : 'Begin'}
        </button>
        {cycles > 0 && (
          <span className="text-xs text-twilight">
            {cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed
          </span>
        )}
      </div>

      {/* Pattern label */}
      <p className="text-xs text-twilight">{config.label}</p>
    </div>
  )
}
