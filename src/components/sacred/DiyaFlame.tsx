'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DiyaFlameProps {
  streak: number
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getFlameConfig(streak: number) {
  if (streak >= 60) return { h: 56, w: 28, glow: true, divine: true, intensity: 1.0 }
  if (streak >= 30) return { h: 48, w: 24, glow: true, divine: false, intensity: 0.85 }
  if (streak >= 14) return { h: 40, w: 20, glow: false, divine: false, intensity: 0.70 }
  if (streak >= 7)  return { h: 32, w: 16, glow: false, divine: false, intensity: 0.55 }
  return              { h: 24, w: 12, glow: false, divine: false, intensity: 0.40 }
}

const sizeMap = { sm: 0.65, md: 1.0, lg: 1.4 }

export function DiyaFlame({ streak, isActive = true, size = 'md', className }: DiyaFlameProps) {
  const scale = sizeMap[size]
  const flame = getFlameConfig(streak)
  const lampW = 64 * scale
  const lampH = 28 * scale

  return (
    <div className={cn('flex flex-col items-center gap-1 select-none', className)}>
      {/* Flame */}
      {isActive ? (
        <div
          className="relative flex justify-center"
          style={{ height: flame.h * scale, width: flame.w * scale + 20 }}
        >
          {/* Divine halo for 60+ day streak */}
          {flame.divine && (
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(212,168,71,0.35) 0%, transparent 70%)',
                height: flame.h * scale * 1.6,
                width: flame.w * scale * 3,
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: -4,
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Outer glow flame (streak 30+) */}
          {flame.glow && (
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full rounded-b-none origin-bottom"
              style={{
                width: flame.w * scale * 1.6,
                height: flame.h * scale * 0.85,
                background: 'radial-gradient(ellipse at 50% 80%, rgba(212,168,71,0.5) 0%, rgba(232,145,58,0.2) 60%, transparent 100%)',
                filter: 'blur(4px)',
              }}
              animate={{
                scaleX: [1, 0.9, 1.1, 0.95, 1],
                scaleY: [1, 1.04, 0.97, 1.05, 1],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Core flame */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
            style={{
              width: flame.w * scale,
              height: flame.h * scale,
            }}
            animate={{
              scaleX: [1, 0.87, 1.08, 0.93, 1],
              scaleY: [1, 1.05, 0.96, 1.07, 1],
              rotate:  [-1, 1.2, -0.8, 1.5, -1],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg
              viewBox="0 0 28 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <radialGradient id={`fg-${streak}`} cx="50%" cy="80%" r="60%">
                  <stop offset="0%"   stopColor="#FFF3C4" />
                  <stop offset="30%"  stopColor="#F2B366" />
                  <stop offset="65%"  stopColor="#E8913A" />
                  <stop offset="100%" stopColor="#C47420" stopOpacity="0.6" />
                </radialGradient>
              </defs>
              {/* Outer flame shape */}
              <path
                d="M14 0 C14 0 4 14 2 28 C0 40 6 56 14 56 C22 56 28 40 26 28 C24 14 14 0 14 0Z"
                fill={`url(#fg-${streak})`}
              />
              {/* Inner bright core */}
              <path
                d="M14 20 C14 20 10 30 10 38 C10 44 12 50 14 50 C16 50 18 44 18 38 C18 30 14 20 14 20Z"
                fill="rgba(255,249,200,0.8)"
              />
            </svg>
          </motion.div>

          {/* Wick */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-indigo-deep/60"
            style={{ width: 2 * scale, height: 6 * scale }}
          />
        </div>
      ) : (
        /* Extinguished — faint smoke curl */
        <div
          className="flex justify-center items-end"
          style={{ height: flame.h * scale * 0.6, width: flame.w * scale + 20 }}
        >
          <motion.div
            className="w-0.5 rounded-full bg-twilight/30"
            style={{ height: 20 * scale }}
            animate={{ scaleY: [1, 0.6, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      )}

      {/* Diya body */}
      <svg
        viewBox="0 0 64 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: lampW, height: lampH }}
      >
        <defs>
          <linearGradient id="diya-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isActive ? '#C47420' : '#A89070'} />
            <stop offset="100%" stopColor={isActive ? '#8B4F0A' : '#6B5040'} />
          </linearGradient>
          <linearGradient id="diya-oil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isActive ? '#F2B366' : '#C8A87A'} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isActive ? '#E8913A' : '#A08060'} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Bowl */}
        <path
          d="M8 8 Q8 2 32 2 Q56 2 56 8 L52 22 Q52 26 32 26 Q12 26 12 22 Z"
          fill="url(#diya-body)"
        />
        {/* Oil surface */}
        <ellipse cx="32" cy="9" rx="18" ry="5" fill="url(#diya-oil)" />
        {/* Spout */}
        <path d="M52 8 Q60 6 62 10 Q60 14 52 12 Z" fill="url(#diya-body)" />
        {/* Rim highlight */}
        <path d="M14 8 Q32 4 50 8" stroke="rgba(255,200,100,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Streak label */}
      <span
        className="text-xs font-medium"
        style={{ color: isActive ? '#C47420' : '#9B9080' }}
      >
        {isActive ? `Day ${streak}` : 'Streak broken'}
      </span>
    </div>
  )
}
