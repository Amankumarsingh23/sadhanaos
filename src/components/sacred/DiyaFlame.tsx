'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DiyaFlameProps {
  streak:     number
  isActive?:  boolean
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

function getFlameConfig(streak: number) {
  if (streak >= 60) return { h: 56, w: 28, glow: true,  divine: true,  intensity: 1.0  }
  if (streak >= 30) return { h: 48, w: 24, glow: true,  divine: false, intensity: 0.85 }
  if (streak >= 14) return { h: 40, w: 20, glow: false, divine: false, intensity: 0.70 }
  if (streak >= 7)  return { h: 32, w: 16, glow: false, divine: false, intensity: 0.55 }
  return               { h: 24, w: 12, glow: false, divine: false, intensity: 0.40 }
}

const sizeMap = { sm: 0.65, md: 1.0, lg: 1.4 }

// Three flicker layers with different timings — organic, non-repeating feel
const FLICKER = [
  { dur: 1.6, delay: 0,   sx: [1, 0.85, 1.1,  0.93, 1], sy: [1, 1.06, 0.96, 1.08, 1], rot: [-1,   1.3, -0.9,  1.6,  -1]   },
  { dur: 2.1, delay: 0.3, sx: [1, 1.08, 0.88, 1.05, 1], sy: [1, 0.94, 1.07, 0.97, 1], rot: [0.8, -1.1,  1.4, -0.7,  0.8]  },
  { dur: 1.3, delay: 0.7, sx: [1, 0.92, 1.07, 0.88, 1], sy: [1, 1.04, 0.95, 1.09, 1], rot: [-1.2, 0.9, -1.5,  1.0, -1.2]  },
]

const SMOKE = [
  { dx: 0,  dur: 1.4, delay: 0   },
  { dx: 6,  dur: 1.8, delay: 0.2 },
  { dx: -5, dur: 1.6, delay: 0.5 },
]

export function DiyaFlame({ streak, isActive = true, size = 'md', className }: DiyaFlameProps) {
  const sc    = sizeMap[size]
  const flame = getFlameConfig(streak)
  const lampW = 64 * sc
  const lampH = 28 * sc

  return (
    <div className={cn('flex flex-col items-center gap-1 select-none', className)}>

      {/* ── Flame / smoke zone ─────────────────────────────────────────── */}
      <div
        className="relative flex justify-center"
        style={{ height: flame.h * sc + 8, width: flame.w * sc + 24 }}
      >
        <AnimatePresence mode="wait">
          {isActive ? (

            /* ── Active flame ── */
            <motion.div
              key="flame-on"
              initial={{ opacity: 0, scale: 0.12, y: 8 }}
              animate={{ opacity: 1,  scale: 1,    y: 0 }}
              exit={{   opacity: 0,  scale: 0.08,  y: -6 }}
              transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{ width: flame.w * sc + 24, height: flame.h * sc + 8 }}
            >
              {/* Halo for 60+ days */}
              {flame.divine && (
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                  style={{
                    width:      flame.w * sc * 3.5,
                    height:     flame.h * sc * 1.8,
                    background: 'radial-gradient(ellipse, rgba(212,168,71,0.35) 0%, transparent 65%)',
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}

              {/* Glow bloom for 30+ days */}
              {flame.glow && (
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full origin-bottom pointer-events-none"
                  style={{
                    width:      flame.w * sc * 1.7,
                    height:     flame.h * sc * 0.9,
                    background: 'radial-gradient(ellipse at 50% 80%, rgba(212,168,71,0.4) 0%, rgba(232,145,58,0.16) 60%, transparent 100%)',
                    filter:     'blur(4px)',
                  }}
                  animate={{ scaleX: FLICKER[1].sx, scaleY: FLICKER[1].sy }}
                  transition={{ duration: FLICKER[1].dur, repeat: Infinity, delay: FLICKER[1].delay }}
                />
              )}

              {/* Outer flame body */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
                style={{ width: flame.w * sc, height: flame.h * sc }}
                animate={{ scaleX: FLICKER[0].sx, scaleY: FLICKER[0].sy, rotate: FLICKER[0].rot }}
                transition={{ duration: FLICKER[0].dur, repeat: Infinity, ease: 'easeInOut', delay: FLICKER[0].delay }}
              >
                <svg viewBox="0 0 28 56" fill="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <radialGradient id={`diya-fg-${streak}`} cx="50%" cy="80%" r="60%">
                      <stop offset="0%"   stopColor="#FFF3C4" />
                      <stop offset="30%"  stopColor="#F2B366" />
                      <stop offset="65%"  stopColor="#E8913A" />
                      <stop offset="100%" stopColor="#C47420" stopOpacity="0.6" />
                    </radialGradient>
                  </defs>
                  <path
                    d="M14 0 C14 0 4 14 2 28 C0 40 6 56 14 56 C22 56 28 40 26 28 C24 14 14 0 14 0Z"
                    fill={`url(#diya-fg-${streak})`}
                  />
                </svg>
              </motion.div>

              {/* Inner bright core — faster, chaotic layer */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
                style={{ width: flame.w * sc * 0.55, height: flame.h * sc * 0.7 }}
                animate={{ scaleX: FLICKER[2].sx, scaleY: FLICKER[2].sy, rotate: FLICKER[2].rot }}
                transition={{ duration: FLICKER[2].dur, repeat: Infinity, ease: 'easeInOut', delay: FLICKER[2].delay }}
              >
                <svg viewBox="0 0 28 56" fill="none" style={{ width: '100%', height: '100%' }}>
                  <path
                    d="M14 10 C14 10 10 24 10 36 C10 44 12 52 14 52 C16 52 18 44 18 36 C18 24 14 10 14 10Z"
                    fill="rgba(255,249,200,0.85)"
                  />
                </svg>
              </motion.div>

              {/* Wick */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-indigo-deep/60"
                style={{ width: 2 * sc, height: 6 * sc }}
              />
            </motion.div>

          ) : (

            /* ── Dead flame — rising smoke ── */
            <motion.div
              key="flame-off"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0, y: -8, transition: { duration: 0.25 } }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end justify-center"
              style={{ width: flame.w * sc + 24, height: flame.h * sc * 0.7 }}
            >
              {SMOKE.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute bottom-0 rounded-full bg-twilight/25"
                  style={{ width: 3 * sc, left: `calc(50% + ${p.dx * sc}px)` }}
                  animate={{
                    height:  [8 * sc, 18 * sc, 6 * sc],
                    opacity: [0.35, 0.12, 0.35],
                    y:       [0, -8 * sc, 0],
                    scaleX:  [1, 1.4, 0.7, 1],
                  }}
                  transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>

          )}
        </AnimatePresence>
      </div>

      {/* ── Diya bowl ──────────────────────────────────────────────────── */}
      <svg viewBox="0 0 64 28" fill="none" style={{ width: lampW, height: lampH }}>
        <defs>
          <linearGradient id={`diya-body-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isActive ? '#C47420' : '#A89070'} />
            <stop offset="100%" stopColor={isActive ? '#8B4F0A' : '#6B5040'} />
          </linearGradient>
          <linearGradient id={`diya-oil-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isActive ? '#F2B366' : '#C8A87A'} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isActive ? '#E8913A' : '#A08060'} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path d="M8 8 Q8 2 32 2 Q56 2 56 8 L52 22 Q52 26 32 26 Q12 26 12 22 Z" fill="url(#diya-body-a)" />
        <ellipse cx="32" cy="9" rx="18" ry="5" fill="url(#diya-oil-a)" />
        <path d="M52 8 Q60 6 62 10 Q60 14 52 12 Z" fill="url(#diya-body-a)" />
        <path d="M14 8 Q32 4 50 8" stroke="rgba(255,200,100,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* ── Streak label ────────────────────────────────────────────────── */}
      <span className="text-xs font-medium" style={{ color: isActive ? '#C47420' : '#9B9080' }}>
        {isActive ? `Day ${streak}` : 'Streak broken'}
      </span>
    </div>
  )
}
