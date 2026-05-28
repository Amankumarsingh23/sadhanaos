'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Play, Square, RotateCcw, ChevronDown, AlertTriangle } from 'lucide-react'
import { BreathingCircle } from '@/components/sacred/BreathingCircle'
import { MantraCounter } from '@/components/sacred/MantraCounter'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────
function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function todayISO() { return new Date().toISOString().split('T')[0] }
function fmtTimer(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
function dayLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })
}

// ── Types ──────────────────────────────────────────────────────────────────
type MedType = 'silent' | 'mantra' | 'breath' | 'tratak'
type TimerState = 'idle' | 'running' | 'complete'
type NostrilSide = 'left' | 'right' | 'both'

interface MedStats {
  totalSessions: number
  totalHours: number
  avgMinutes: number
  streak: number
  last14: { date: string; minutes: number; label: string }[]
}

interface TechniqueData {
  id: 'anulom-vilom' | 'bhramari' | 'kapalbhati' | 'box' | '4-7-8'
  nameHi: string
  nameEn: string
  desc: string
  benefits: string[]
  sutra: string | null
  defaultRounds: number
  roundOptions: number[]
  warning?: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const PRESETS = [5, 10, 15, 20, 30]

const MED_TYPES: { key: MedType; labelHi: string; labelEn: string }[] = [
  { key: 'silent',  labelHi: 'मौन ध्यान',   labelEn: 'Silent Meditation' },
  { key: 'mantra',  labelHi: 'मंत्र ध्यान', labelEn: 'Mantra Meditation' },
  { key: 'breath',  labelHi: 'श्वास ध्यान', labelEn: 'Breath Awareness' },
  { key: 'tratak',  labelHi: 'त्राटक',       labelEn: 'Candle Gazing' },
]

const TECHNIQUES: TechniqueData[] = [
  {
    id: 'anulom-vilom',
    nameHi: 'अनुलोम-विलोम',
    nameEn: 'Alternate Nostril Breathing',
    desc: 'Purifies the nadis (energy channels) and balances left and right hemispheres of the brain.',
    benefits: ['Reduces anxiety', 'Balances nervous system', 'Improves focus', 'Purifies energy channels'],
    sutra: 'Yoga Sutras 2.49 — "Pranayama is the regulation of the incoming and outgoing breath"',
    defaultRounds: 10,
    roundOptions: [5, 10, 15, 20],
  },
  {
    id: 'bhramari',
    nameHi: 'भ्रामरी',
    nameEn: 'Humming Bee Breath',
    desc: 'The humming vibration stimulates the vagus nerve and calms the mind instantly. Ideal before sleep or study.',
    benefits: ['Dissolves stress', 'Soothes anger', 'Aids deep sleep', 'Improves voice quality'],
    sutra: 'Yoga Sutras 2.52 — "Thus the veil over the inner light is destroyed"',
    defaultRounds: 7,
    roundOptions: [5, 7, 10, 15],
  },
  {
    id: 'kapalbhati',
    nameHi: 'कपालभाति',
    nameEn: 'Skull Shining Breath',
    desc: 'Rapid exhalations with passive inhalation. Detoxifies the lungs, energizes the system, and strengthens the core.',
    benefits: ['Detoxifies lungs', 'Boosts energy', 'Strengthens diaphragm', 'Improves digestion'],
    sutra: null,
    defaultRounds: 60,
    roundOptions: [30, 60, 120],
    warning: 'Not recommended if you have high BP, are pregnant, or have recently eaten.',
  },
  {
    id: 'box',
    nameHi: 'बॉक्स ब्रीदिंग',
    nameEn: 'Box Breathing (4-4-4-4)',
    desc: 'Equal-count rhythm on all four sides. Perfect before deep work, prayer, or any sacred activity.',
    benefits: ['Improves focus', 'Reduces anxiety', 'Builds discipline', 'Stabilizes the mind'],
    sutra: 'Yoga Sutras 2.50 — "Regulated by place, time, and number, breath becomes long and subtle"',
    defaultRounds: 10,
    roundOptions: [5, 10, 15, 20],
  },
  {
    id: '4-7-8',
    nameHi: '4-7-8 श्वास',
    nameEn: 'Relaxation Breath',
    desc: 'Inhale 4, hold 7, exhale 8. Activates the parasympathetic nervous system. Best for urge resistance and sleep.',
    benefits: ['Reduces urges instantly', 'Aids deep sleep', 'Lowers heart rate', 'Controls anxiety'],
    sutra: 'Yoga Sutras 2.53 — "And the mind becomes fit for dharana (concentration)"',
    defaultRounds: 4,
    roundOptions: [4, 6, 8],
  },
]

// Anulom Vilom 8-phase full round
interface AvPhase { count: number; label: string; labelHi: string; nostril: NostrilSide; scale: number }
const AV_PHASES: AvPhase[] = [
  { count: 4, label: 'Inhale',  labelHi: 'श्वास',   nostril: 'left',  scale: 1.3  },
  { count: 4, label: 'Hold',    labelHi: 'रोकें',   nostril: 'both',  scale: 1.3  },
  { count: 4, label: 'Exhale',  labelHi: 'निश्वास', nostril: 'right', scale: 0.75 },
  { count: 4, label: 'Hold',    labelHi: 'रोकें',   nostril: 'both',  scale: 0.75 },
  { count: 4, label: 'Inhale',  labelHi: 'श्वास',   nostril: 'right', scale: 1.3  },
  { count: 4, label: 'Hold',    labelHi: 'रोकें',   nostril: 'both',  scale: 1.3  },
  { count: 4, label: 'Exhale',  labelHi: 'निश्वास', nostril: 'left',  scale: 0.75 },
  { count: 4, label: 'Hold',    labelHi: 'रोकें',   nostril: 'both',  scale: 0.75 },
]

// ── TimerCircle ────────────────────────────────────────────────────────────
function TimerCircle({ elapsed, total, size = 240, state }: {
  elapsed: number; total: number; size?: number; state: TimerState
}) {
  const r    = size / 2 - 14
  const circ = 2 * Math.PI * r
  const pct  = Math.min(1, elapsed / Math.max(1, total))
  const rem  = Math.max(0, total - elapsed)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Breathing pulse ring */}
      {state === 'running' && (
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -12, background: 'radial-gradient(circle, rgba(232,145,58,0.12) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* SVG ring */}
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F2B366" />
            <stop offset="100%" stopColor="#E8913A" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#3B3D70" strokeWidth={8} />
        {state !== 'idle' && (
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="url(#timer-grad)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            className="transition-all duration-1000 ease-linear"
          />
        )}
      </svg>

      {/* Indigo disc with countdown */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center gap-1"
        style={{ inset: 14, background: '#2B2D5B' }}
      >
        {state === 'complete' ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-3xl">🙏</p>
            <p className="text-dawn-white/80 text-xs mt-1 font-display">Complete</p>
          </motion.div>
        ) : (
          <>
            <span className="font-display font-light text-dawn-white tabular-nums"
              style={{ fontSize: size * 0.22 }}>
              {fmtTimer(rem)}
            </span>
            <span className="text-dawn-white/40 text-xs">
              {state === 'idle' ? 'ready' : 'remaining'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ── NostrilIndicator ───────────────────────────────────────────────────────
function NostrilIndicator({ active }: { active: NostrilSide }) {
  const leftOn  = active === 'left'  || active === 'both'
  const rightOn = active === 'right' || active === 'both'

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Left */}
      <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${leftOn ? '' : 'opacity-30'}`}>
        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500
          ${leftOn ? 'border-sacred-saffron bg-sacred-saffron/20' : 'border-sandstone bg-transparent'}`}>
          <span className="text-xs text-sacred-saffron font-medium">L</span>
        </div>
        <span className={`text-xs font-medium ${leftOn ? 'text-sacred-saffron' : 'text-twilight/50'}`}>
          {active === 'left' ? '← In' : active === 'both' ? '⊙' : 'Left'}
        </span>
      </div>

      {/* Center label */}
      <div className="text-center">
        <span className="text-xs text-twilight/60 uppercase tracking-wider">
          {active === 'both' ? 'Hold' : active === 'left' ? 'Inhale' : 'Exhale'}
        </span>
      </div>

      {/* Right */}
      <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${rightOn ? '' : 'opacity-30'}`}>
        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500
          ${rightOn ? 'border-sacred-saffron bg-sacred-saffron/20' : 'border-sandstone bg-transparent'}`}>
          <span className="text-xs text-sacred-saffron font-medium">R</span>
        </div>
        <span className={`text-xs font-medium ${rightOn ? 'text-sacred-saffron' : 'text-twilight/50'}`}>
          {active === 'right' ? 'Out →' : active === 'both' ? '⊙' : 'Right'}
        </span>
      </div>
    </div>
  )
}

// ── AnulomVilomSession ─────────────────────────────────────────────────────
function AnulomVilomSession({ targetRounds, onComplete }: { targetRounds: number; onComplete: () => void }) {
  const [phaseIdx,   setPhaseIdx]   = useState(0)
  const [countdown,  setCountdown]  = useState(AV_PHASES[0].count)
  const [rounds,     setRounds]     = useState(0)
  const [active,     setActive]     = useState(true)
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef  = useRef(false)

  const phase = AV_PHASES[phaseIdx]

  const clearTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
  }, [])

  useEffect(() => {
    if (!active) return
    setCountdown(phase.count)
    tickRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearTick()
          setPhaseIdx(i => {
            const next = (i + 1) % AV_PHASES.length
            if (next === 0) {
              setRounds(r => {
                const newR = r + 1
                if (newR >= targetRounds && !doneRef.current) {
                  doneRef.current = true
                  setTimeout(() => { setActive(false); onComplete() }, 400)
                }
                return newR
              })
            }
            return next
          })
          return AV_PHASES[(phaseIdx + 1) % AV_PHASES.length].count
        }
        return c - 1
      })
    }, 1000)
    return clearTick
  }, [active, phaseIdx, phase.count, targetRounds, clearTick, onComplete])

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Breathing circle */}
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width={160} height={160} className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx={80} cy={80} r={66} fill="none" stroke="#3B3D70" strokeWidth={4} />
        </svg>
        <motion.div
          className="absolute inset-5 rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 40%, #7AAEC4 0%, #4A4C7A 60%, #2B2D5B 100%)' }}
          animate={{ scale: phase.scale }}
          transition={{ duration: phase.count, ease: phase.scale > 1 ? 'easeIn' : 'easeOut' }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-devanagari text-xs text-dawn-white/80">{phase.labelHi}</span>
            <span className="text-xl font-display font-light text-dawn-white tabular-nums">{countdown}</span>
            <span className="text-xs text-dawn-white/50">{phase.label}</span>
          </div>
        </motion.div>
      </div>

      <NostrilIndicator active={phase.nostril} />

      {/* Round counter */}
      <p className="text-sm text-twilight">
        Round <span className="font-semibold text-indigo-deep">{Math.min(rounds + 1, targetRounds)}</span> of {targetRounds}
      </p>
    </div>
  )
}

// ── KapalbhatiSession ──────────────────────────────────────────────────────
function KapalbhatiSession({ targetStrokes, onComplete }: { targetStrokes: number; onComplete: () => void }) {
  const [strokes,   setStrokes]   = useState(0)
  const [phase,     setPhase]     = useState<'breathing' | 'resting'>('breathing')
  const [restLeft,  setRestLeft]  = useState(60)
  const [totalRounds, setTotalRounds] = useState(1)
  const [round,     setRound]     = useState(1)
  const doneRef = useRef(false)

  // Auto-strokes at 1/sec
  useEffect(() => {
    if (phase !== 'breathing') return
    const iv = setInterval(() => {
      setStrokes(s => {
        const next = s + 1
        if (next >= targetStrokes) {
          clearInterval(iv)
          if (round >= totalRounds && !doneRef.current) {
            doneRef.current = true
            setTimeout(onComplete, 800)
          } else {
            setPhase('resting')
            setRestLeft(60)
          }
        }
        return next
      })
    }, 600) // ~100 strokes/min
    return () => clearInterval(iv)
  }, [phase, targetStrokes, round, totalRounds, onComplete])

  // Rest countdown
  useEffect(() => {
    if (phase !== 'resting') return
    const iv = setInterval(() => {
      setRestLeft(r => {
        if (r <= 1) {
          clearInterval(iv)
          setStrokes(0)
          setRound(rnd => rnd + 1)
          setPhase('breathing')
          return 60
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [phase])

  const strokePct = (strokes % targetStrokes) / targetStrokes

  return (
    <div className="flex flex-col items-center gap-5">
      {phase === 'breathing' ? (
        <>
          {/* Rapid pulse visual */}
          <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
            <motion.div
              className="absolute inset-0 rounded-full bg-sacred-saffron/10"
              animate={{ scale: [1, 1.12, 0.95, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="w-20 h-20 rounded-full"
              style={{ background: 'radial-gradient(circle, #E8913A 0%, #2B2D5B 70%)' }}
              animate={{ scale: [1, 0.88, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-semibold text-dawn-white tabular-nums">
                {strokes % targetStrokes || (strokes > 0 ? targetStrokes : 0)}
              </span>
            </div>
          </div>

          {/* Bar */}
          <div className="w-48 h-1.5 rounded-full bg-sandstone overflow-hidden">
            <motion.div
              className="h-full bg-sacred-saffron rounded-full"
              animate={{ width: `${strokePct * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <p className="text-sm text-twilight">
            Round {round}/{totalRounds} · {strokes}/{targetStrokes} strokes
          </p>

          {/* Round selector */}
          {round === 1 && strokes === 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-twilight">Total rounds:</span>
              {[1, 3, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setTotalRounds(r)}
                  className={`w-8 h-7 rounded-lg text-xs font-medium border transition-all
                    ${totalRounds === r ? 'bg-sacred-saffron text-dawn-white border-sacred-saffron' : 'border-sandstone text-twilight hover:border-sacred-saffron/50'}`}
                >{r}</button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center space-y-3">
          <div className="text-3xl">🌿</div>
          <p className="font-devanagari text-lg text-indigo-deep">विश्राम (Rest)</p>
          <p className="text-sm text-twilight">Breathe naturally for {restLeft} seconds</p>
          <div className="w-40 h-2 rounded-full bg-sandstone overflow-hidden mx-auto">
            <div
              className="h-full bg-sage-green rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((60 - restLeft) / 60) * 100}%` }}
            />
          </div>
          <p className="text-xs text-twilight">Round {round} complete · Up next: Round {round + 1}</p>
        </div>
      )}
    </div>
  )
}

// ── TechniqueSession (for box, 4-7-8, bhramari) ───────────────────────────
type BcPattern = 'box' | '4-7-8' | 'bhramari'

function TechniqueSession({ pattern, targetRounds, onComplete }: {
  pattern: BcPattern; targetRounds: number; onComplete: () => void
}) {
  const [done,   setDone]   = useState(0)
  const doneRef = useRef(false)

  const handleCycle = useCallback(() => {
    setDone(d => {
      const next = d + 1
      if (next >= targetRounds && !doneRef.current) {
        doneRef.current = true
        setTimeout(onComplete, 600)
      }
      return next
    })
  }, [targetRounds, onComplete])

  return (
    <div className="flex flex-col items-center gap-4">
      <BreathingCircle
        pattern={pattern}
        size={180}
        autoStart
        onCycleComplete={handleCycle}
      />
      <p className="text-sm text-twilight">
        Round <span className="font-semibold text-indigo-deep">{Math.min(done + 1, targetRounds)}</span> of {targetRounds}
      </p>
    </div>
  )
}

// ── TechniqueCard ──────────────────────────────────────────────────────────
function TechniqueCard({
  technique, onComplete,
}: {
  technique: TechniqueData
  onComplete: (id: string) => void
}) {
  const [open,        setOpen]        = useState(false)
  const [rounds,      setRounds]      = useState(technique.defaultRounds)
  const [active,      setActive]      = useState(false)
  const [done,        setDone]        = useState(false)

  const handleStart = () => { setActive(true); setDone(false) }
  const handleStop  = () => { setActive(false); setDone(false) }

  const handleComplete = useCallback(() => {
    setActive(false)
    setDone(true)
    onComplete(technique.id)
  }, [technique.id, onComplete])

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-devanagari font-display text-base font-semibold text-indigo-deep">
              {technique.nameHi}
            </h3>
            {done && <span className="text-xs text-sage-green font-semibold">✓ Done</span>}
          </div>
          <p className="text-xs text-twilight mt-0.5">{technique.nameEn}</p>
        </div>
        <ChevronDown size={16} className={`text-twilight transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-sandstone">

              {/* Description + benefits */}
              <div className="pt-4 space-y-3">
                <p className="text-sm text-twilight leading-relaxed">{technique.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {technique.benefits.map(b => (
                    <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-dawn-white border border-sandstone text-twilight">
                      {b}
                    </span>
                  ))}
                </div>
                {technique.sutra && (
                  <p className="text-xs text-twilight/60 italic border-l-2 border-sandstone pl-3">
                    {technique.sutra}
                  </p>
                )}
                {technique.warning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warm-clay/10 border border-warm-clay/30">
                    <AlertTriangle size={14} className="text-warm-clay shrink-0 mt-0.5" />
                    <p className="text-xs text-warm-clay">{technique.warning}</p>
                  </div>
                )}
              </div>

              {/* Round selector (when not active) */}
              {!active && !done && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-twilight">
                    {technique.id === 'kapalbhati' ? 'Strokes per round:' : 'Rounds:'}
                  </span>
                  {technique.roundOptions.map(r => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all
                        ${rounds === r
                          ? 'bg-sacred-saffron text-dawn-white border-sacred-saffron'
                          : 'border-sandstone text-twilight hover:border-sacred-saffron/50'}`}
                    >{r}</button>
                  ))}
                </div>
              )}

              {/* Guided session */}
              <AnimatePresence mode="wait">
                {active ? (
                  <motion.div
                    key="session"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="rounded-card bg-indigo-deep/5 border border-indigo-deep/10 p-5">
                      {technique.id === 'anulom-vilom' ? (
                        <AnulomVilomSession targetRounds={rounds} onComplete={handleComplete} />
                      ) : technique.id === 'kapalbhati' ? (
                        <KapalbhatiSession targetStrokes={rounds} onComplete={handleComplete} />
                      ) : (
                        <TechniqueSession
                          pattern={technique.id as BcPattern}
                          targetRounds={rounds}
                          onComplete={handleComplete}
                        />
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleStop} className="w-full text-twilight">
                      <Square size={12} /> Stop Session
                    </Button>
                  </motion.div>
                ) : done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-2"
                  >
                    <p className="text-2xl">🙏</p>
                    <p className="font-devanagari text-base text-sage-green font-semibold">सत्कार्य पूर्ण!</p>
                    <p className="text-xs text-twilight">Session logged to your daily record.</p>
                    <button onClick={handleStop} className="text-xs text-twilight/60 hover:text-twilight underline mt-1">
                      Practice again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button variant="primary" size="md" onClick={handleStart} className="w-full">
                      <Play size={14} /> Start Guided Session
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MedStatsCard ───────────────────────────────────────────────────────────
function MedStatsCard({ stats }: { stats: MedStats | null }) {
  if (!stats) return null

  const chartData = stats.last14.map(d => ({ label: dayLabel(d.date), minutes: d.minutes }))

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="font-display text-base font-semibold text-indigo-deep">Meditation Stats</h3>
      </div>
      <div className="px-5 pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Sessions',      value: String(stats.totalSessions) },
            { label: 'Total Hours',   value: `${stats.totalHours}h` },
            { label: 'Avg Session',   value: `${stats.avgMinutes}m` },
            { label: 'Day Streak',    value: String(stats.streak) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-dawn-white border border-sandstone rounded-card p-3 text-center">
              <p className="text-lg font-bold font-display text-indigo-deep">{value}</p>
              <p className="text-xs text-twilight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        {stats.totalSessions > 0 && (
          <div>
            <p className="text-xs text-twilight mb-2">Last 14 days (minutes)</p>
            <ResponsiveContainer width="100%" height={64}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6B6D9E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${v ?? 0} min`, '']}
                  contentStyle={{ background: '#F5EDE0', border: '1px solid #E8D5BE', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="minutes" fill="#E8913A" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.totalSessions === 0 && (
          <p className="text-sm text-twilight text-center py-2">Complete your first session to see stats.</p>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DhyanaPage() {
  const [tab,       setTab]       = useState<'meditation' | 'pranayama'>('meditation')

  // Meditation timer state
  const [timerState,  setTimerState]  = useState<TimerState>('idle')
  const [durationMin, setDurationMin] = useState(15)
  const [customVal,   setCustomVal]   = useState('')
  const [medType,     setMedType]     = useState<MedType>('silent')
  const [elapsed,     setElapsed]     = useState(0)
  const [stats,       setStats]       = useState<MedStats | null>(null)

  const totalSec = durationMin * 60

  // Fetch meditation stats
  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('log_date, meditation_minutes')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })

    const withMed = (logs ?? []).filter(l => (l.meditation_minutes ?? 0) > 0)
    const today   = todayISO()

    // Streak: consecutive days with meditation
    const sortedDates = [...new Set(withMed.map(l => l.log_date))].sort().reverse()
    let streak = 0
    for (let i = 0; i < sortedDates.length; i++) {
      if (sortedDates[i] === addDays(today, -i)) streak++
      else break
    }

    const totalSessions = withMed.length
    const totalMins     = withMed.reduce((s, l) => s + (l.meditation_minutes ?? 0), 0)

    const last14 = Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, -(13 - i))
      const log  = withMed.find(l => l.log_date === date)
      return { date, minutes: log?.meditation_minutes ?? 0, label: dayLabel(date) }
    })

    setStats({
      totalSessions,
      totalHours:  parseFloat((totalMins / 60).toFixed(1)),
      avgMinutes:  totalSessions ? Math.round(totalMins / totalSessions) : 0,
      streak,
      last14,
    })
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Timer countdown
  useEffect(() => {
    if (timerState !== 'running') return
    if (elapsed >= totalSec) {
      setTimerState('complete')
      autoLogMeditation(durationMin)
        .then(fetchStats)
        .catch(() => {})
      return
    }
    const iv = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(iv)
  }, [timerState, elapsed, totalSec, durationMin, fetchStats])

  async function autoLogMeditation(minutes: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = todayISO()
    const { data: existing } = await supabase
      .from('daily_logs').select('id, meditation_minutes')
      .eq('user_id', user.id).eq('log_date', today).maybeSingle()
    if (existing) {
      await supabase.from('daily_logs')
        .update({ meditation_minutes: (existing.meditation_minutes ?? 0) + minutes })
        .eq('id', existing.id)
    } else {
      await supabase.from('daily_logs')
        .insert({ user_id: user.id, log_date: today, meditation_minutes: minutes })
    }
  }

  async function autoLogPranayama(techniqueId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = todayISO()
    const { data: existing } = await supabase
      .from('daily_logs').select('id')
      .eq('user_id', user.id).eq('log_date', today).maybeSingle()
    if (existing) {
      await supabase.from('daily_logs')
        .update({ pranayama_done: true, pranayama_type: techniqueId })
        .eq('id', existing.id)
    }
  }

  const handleBegin = () => {
    setElapsed(0)
    setTimerState('running')
  }

  const handleStop = () => {
    if (elapsed > 60) autoLogMeditation(Math.floor(elapsed / 60)).catch(() => {})
    setTimerState('idle')
    setElapsed(0)
  }

  const handleDone = () => {
    setTimerState('idle')
    setElapsed(0)
  }

  const setPreset = (min: number) => {
    setDurationMin(min)
    setCustomVal('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-devanagari font-display text-2xl font-semibold text-indigo-deep">ध्यान साधना</h1>
        <p className="text-sm text-twilight mt-0.5">Meditation & Pranayama</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-sandstone/50">
        {(['meditation', 'pranayama'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${tab === t ? 'bg-parchment text-indigo-deep shadow-warm-sm' : 'text-twilight hover:text-indigo-deep'}`}
          >
            {t === 'meditation'
              ? <><span className="font-devanagari">ध्यान</span> · Meditation</>
              : <><span className="font-devanagari">प्राणायाम</span> · Pranayama</>
            }
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Meditation Tab ─────────────────────────────────────────────── */}
        {tab === 'meditation' && (
          <motion.div
            key="meditation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="space-y-5"
          >
            {/* Timer card */}
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-6">

              {/* Timer circle */}
              <div className="flex justify-center mb-6">
                <TimerCircle elapsed={elapsed} total={totalSec} state={timerState} />
              </div>

              {timerState === 'idle' && (
                <div className="space-y-4">
                  {/* Duration presets */}
                  <div>
                    <p className="text-xs text-twilight mb-2">Duration</p>
                    <div className="flex gap-2 flex-wrap">
                      {PRESETS.map(p => (
                        <button
                          key={p}
                          onClick={() => setPreset(p)}
                          className={`h-8 px-4 rounded-full text-sm font-medium border transition-all
                            ${durationMin === p && !customVal
                              ? 'bg-sacred-saffron text-dawn-white border-sacred-saffron'
                              : 'border-sandstone text-twilight hover:border-sacred-saffron/50'}`}
                        >{p} min</button>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" min={1} max={120}
                          value={customVal}
                          onChange={e => { setCustomVal(e.target.value); setDurationMin(Number(e.target.value) || 15) }}
                          placeholder="Custom"
                          className="h-8 w-20 px-2.5 rounded-full border border-sandstone text-sm text-indigo-deep bg-dawn-white placeholder:text-twilight/40 focus:outline-none focus:ring-2 focus:ring-sacred-saffron/50 text-center"
                        />
                        {customVal && <span className="text-xs text-twilight">min</span>}
                      </div>
                    </div>
                  </div>

                  {/* Type selector */}
                  <div>
                    <p className="text-xs text-twilight mb-2">Meditation type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MED_TYPES.map(({ key, labelHi, labelEn }) => (
                        <button
                          key={key}
                          onClick={() => setMedType(key)}
                          className={`px-3 py-2.5 rounded-card border text-left transition-all
                            ${medType === key
                              ? 'border-sacred-saffron bg-sacred-saffron/10'
                              : 'border-sandstone hover:border-sacred-saffron/40'}`}
                        >
                          <p className={`font-devanagari text-sm font-medium ${medType === key ? 'text-sacred-saffron' : 'text-indigo-deep'}`}>
                            {labelHi}
                          </p>
                          <p className="text-xs text-twilight">{labelEn}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button variant="sacred" size="lg" onClick={handleBegin} className="w-full shadow-gold-glow">
                    <Play size={16} /> Begin Meditation
                  </Button>
                </div>
              )}

              {timerState === 'running' && (
                <div className="space-y-4">
                  {/* Mantra counter alongside timer for mantra type */}
                  {medType === 'mantra' && (
                    <div className="flex justify-center py-2">
                      <MantraCounter target={108} />
                    </div>
                  )}

                  {medType !== 'mantra' && (
                    <div className="text-center">
                      <p className="font-devanagari text-lg text-twilight">{MED_TYPES.find(t => t.key === medType)?.labelHi}</p>
                      <p className="text-xs text-twilight/60 mt-0.5">
                        {medType === 'breath'  ? 'Follow your natural breath. When the mind wanders, gently return.' :
                         medType === 'tratak'  ? 'Fix your gaze on the candle flame. Do not blink. Let the eyes water if needed.' :
                         'Rest in the silence. You are awareness itself.'}
                      </p>
                    </div>
                  )}

                  <Button variant="ghost" size="md" onClick={handleStop} className="w-full text-twilight">
                    <Square size={14} /> End Session
                  </Button>
                </div>
              )}

              {timerState === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-3"
                >
                  <p className="font-devanagari text-xl text-indigo-deep font-semibold">सत्संग पूर्ण</p>
                  <p className="text-sm text-twilight">Session complete. {durationMin} minutes logged.</p>
                  <p className="text-xs text-twilight/60 italic">
                    &ldquo;The mind that is purified by meditation sees the Self clearly.&rdquo; — Gita 6.20
                  </p>
                  <Button variant="primary" size="md" onClick={handleDone} className="mt-2">
                    <RotateCcw size={14} /> New Session
                  </Button>
                </motion.div>
              )}
            </div>

            <MedStatsCard stats={stats} />
          </motion.div>
        )}

        {/* ── Pranayama Tab ──────────────────────────────────────────────── */}
        {tab === 'pranayama' && (
          <motion.div
            key="pranayama"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="space-y-3"
          >
            <div className="px-1 pb-1">
              <p className="text-sm text-twilight leading-relaxed">
                &ldquo;तस्मिन् सति श्वासप्रश्वासयोर्गतिविच्छेदः प्राणायामः।&rdquo;
              </p>
              <p className="text-xs text-twilight/60 italic mt-0.5">
                &ldquo;The regulation of breath is pranayama.&rdquo; — Yoga Sutras 2.49
              </p>
            </div>

            {TECHNIQUES.map(t => (
              <TechniqueCard
                key={t.id}
                technique={t}
                onComplete={id => autoLogPranayama(id).catch(() => {})}
              />
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
