'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { BreathingCircle } from '@/components/sacred/BreathingCircle'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useUrgeLog } from '@/hooks/useUrgeLog'
import type { UrgeStats, UrgeLogRow } from '@/hooks/useUrgeLog'
import gitaData from '@/data/bhagavad-gita.json'

// ── Gita data ──────────────────────────────────────────────────────────────
type GitaVerse = {
  id: string; chapter: number; verse: number
  sanskrit: string; transliteration: string
  hindi_meaning: string; english_meaning: string
}
const ALL_VERSES: GitaVerse[] = (gitaData as { verses: GitaVerse[] }).verses
const CH6_VERSES = ALL_VERSES.filter(v => v.chapter === 6)
function randomCh6Verse(): GitaVerse {
  return CH6_VERSES[Math.floor(Math.random() * CH6_VERSES.length)]
}

// ── Constants ──────────────────────────────────────────────────────────────
const TRIGGER_TAGS = [
  { key: 'boredom',          label: 'Boredom' },
  { key: 'stress',           label: 'Stress' },
  { key: 'loneliness',       label: 'Loneliness' },
  { key: 'late_night',       label: 'Late Night' },
  { key: 'phone_scrolling',  label: 'Phone Scrolling' },
  { key: 'idle_time',        label: 'Idle Time' },
  { key: 'after_meal',       label: 'After Meal' },
  { key: 'social_media',     label: 'Social Media' },
  { key: 'explicit_content', label: 'Explicit Content' },
  { key: 'emotional_low',    label: 'Emotional Low' },
]

const TRIGGER_LABEL: Record<string, string> = Object.fromEntries(
  TRIGGER_TAGS.map(t => [t.key, t.label])
)

const SUGGESTIONS = [
  '20 pushups', 'Cold water on face', 'Called a friend',
  'Went for a walk', 'Prayed', 'Read a shloka',
]

// Wave heights (5 bars per intensity level)
const WAVE_HEIGHTS = [
  [8,  12, 10, 12, 8],
  [14, 20, 16, 20, 14],
  [22, 32, 26, 32, 22],
  [30, 44, 36, 44, 30],
  [38, 56, 46, 56, 38],
]
const INTENSITY_LABELS = ['Mild thought', 'Noticeable', 'Strong pull', 'Very strong', 'Overwhelming']

// ── Transition variant ─────────────────────────────────────────────────────
const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18 } },
}

// ── ShieldIcon ─────────────────────────────────────────────────────────────
function ShieldIcon({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sg" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#3B3D70" />
          <stop offset="100%" stopColor="#1D1F42" />
        </linearGradient>
      </defs>
      <path
        d="M50 6 L90 22 L90 57 C90 81 73 99 50 110 C27 99 10 81 10 57 L10 22 Z"
        fill="url(#sg)"
        stroke="#E8913A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M50 17 L80 29 L80 57 C80 75 66 90 50 99 C34 90 20 75 20 57 L20 29 Z"
        fill="none"
        stroke="rgba(232,145,58,0.28)"
        strokeWidth="1.5"
      />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="38"
        fill="#E8913A"
        fontFamily="Noto Serif Devanagari, serif"
      >
        ॐ
      </text>
    </svg>
  )
}

// ── WaveSelector ───────────────────────────────────────────────────────────
function WaveSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {WAVE_HEIGHTS.map((heights, i) => {
        const score = i + 1
        const isSel = value === score
        return (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all duration-150
              ${isSel
                ? 'border-sacred-saffron bg-sacred-saffron/10'
                : 'border-sandstone hover:border-sacred-saffron/40'}`}
          >
            <div className="flex items-end gap-0.5" style={{ height: 56 }}>
              {heights.map((h, j) => (
                <div
                  key={j}
                  className={`w-1.5 rounded-full transition-colors ${isSel ? 'bg-sacred-saffron' : 'bg-sandstone'}`}
                  style={{ height: h }}
                />
              ))}
            </div>
            <span className={`text-[10px] font-medium text-center leading-tight px-0.5
              ${isSel ? 'text-sacred-saffron' : 'text-twilight/70'}`}>
              {INTENSITY_LABELS[i]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── ConfettiParticles ──────────────────────────────────────────────────────
function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 0.9,
        color: ['#D4A847', '#E8913A', '#F2B366', '#D4A847', '#EDD8B8'][i % 5],
        size: 4 + Math.random() * 7,
        yEnd: -(280 + Math.random() * 320),
        xDrift: (Math.random() - 0.5) * 100,
      })),
    []
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.left}%`, bottom: 0, width: p.size, height: p.size, background: p.color }}
          initial={{ y: 0, x: 0, opacity: 1 }}
          animate={{ y: p.yEnd, x: p.xDrift, opacity: 0 }}
          transition={{ duration: 2.6, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ── StatPill ───────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dawn-white border border-sandstone rounded-card p-3 text-center">
      <p className="text-base font-bold font-display text-indigo-deep truncate">{value}</p>
      <p className="text-xs text-twilight mt-0.5">{label}</p>
    </div>
  )
}

// ── UrgeHistory ────────────────────────────────────────────────────────────
function intensityChip(n: number): string {
  if (n <= 2) return 'bg-sage-green/15 text-sage-green'
  if (n === 3) return 'bg-temple-gold/20 text-warm-clay'
  return 'bg-warm-clay/15 text-warm-clay'
}

function formatLogAt(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function UrgeHistory({
  logs, stats, open, setOpen,
}: {
  logs:    UrgeLogRow[]
  stats:   UrgeStats
  open:    boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-base font-semibold text-indigo-deep">Urge History</h3>
          {logs.length > 0 && (
            <span className="text-xs text-twilight">{logs.length} recorded</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-twilight transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
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

              {logs.length === 0 ? (
                <p className="pt-4 text-sm text-twilight text-center">No urges logged yet. Stay strong.</p>
              ) : (
                <>
                  {/* Stats grid */}
                  <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <StatPill label="Win Rate"      value={`${stats.winRate}%`} />
                    <StatPill label="Resisted"      value={`${stats.resisted}/${stats.total}`} />
                    <StatPill label="Avg Intensity" value={String(stats.avgIntensity)} />
                    {stats.topTrigger && (
                      <StatPill label="Top Trigger" value={TRIGGER_LABEL[stats.topTrigger] ?? stats.topTrigger} />
                    )}
                    {stats.topAction && (
                      <StatPill label="Top Coping" value={stats.topAction} />
                    )}
                  </div>

                  {/* Log list */}
                  <div className="space-y-2">
                    {logs.slice(0, 20).map(log => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-dawn-white border border-sandstone/60"
                      >
                        <div className="shrink-0 min-w-[68px]">
                          <p className="text-[10px] text-twilight leading-snug">{formatLogAt(log.logged_at)}</p>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${intensityChip(log.intensity)}`}>
                            {log.intensity}/5
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {(log.trigger_tags ?? []).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sandstone/60 text-twilight">
                                {TRIGGER_LABEL[tag] ?? tag}
                              </span>
                            ))}
                          </div>
                          {log.action_taken && (
                            <p className="text-xs text-twilight truncate">{log.action_taken}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {log.held_strong ? (
                            <span className="text-xs font-semibold text-sage-green">✓ Held</span>
                          ) : (
                            <span className="text-xs font-semibold text-warm-clay">Fell</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
type Screen = 'landing' | 'breathe' | 'log' | 'victory' | 'recovery'

export default function UrgeShieldPage() {
  const { logs, stats, streak, createLog } = useUrgeLog()

  const [screen,      setScreen]      = useState<Screen>('landing')
  const [breathLeft,  setBreathLeft]  = useState(60)
  const [breathDone,  setBreathDone]  = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)

  // Log form
  const [intensity,    setIntensity]    = useState(3)
  const [triggerTags,  setTriggerTags]  = useState<string[]>([])
  const [triggerNotes, setTriggerNotes] = useState('')
  const [actionTaken,  setActionTaken]  = useState('')
  const [heldStrong,   setHeldStrong]   = useState<boolean | null>(null)

  // Outcome extras
  const [victoryVerse,     setVictoryVerse]     = useState<GitaVerse | null>(null)
  const [recoveryJournal,  setRecoveryJournal]  = useState('')

  // 60-second breathing countdown (starts when screen becomes 'breathe')
  useEffect(() => {
    if (screen !== 'breathe') return
    setBreathLeft(60)
    setBreathDone(false)
    const iv = setInterval(() => {
      setBreathLeft(prev => {
        if (prev <= 1) { clearInterval(iv); setBreathDone(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [screen])

  const handleActivate = useCallback(() => setScreen('breathe'), [])

  const handleBreathContinue = useCallback(() => setScreen('log'), [])

  const handleSubmit = useCallback(async () => {
    if (heldStrong === null) return
    setSubmitting(true)
    await createLog({
      intensity,
      trigger_tags:  triggerTags,
      trigger_notes: triggerNotes || null,
      action_taken:  actionTaken || 'breathing exercise',
      held_strong:   heldStrong,
      breathing_done: true,
    })
    if (heldStrong) setVictoryVerse(randomCh6Verse())
    setScreen(heldStrong ? 'victory' : 'recovery')
    setSubmitting(false)
  }, [heldStrong, intensity, triggerTags, triggerNotes, actionTaken, createLog])

  const handleReset = useCallback(() => {
    setScreen('landing')
    setIntensity(3)
    setTriggerTags([])
    setTriggerNotes('')
    setActionTaken('')
    setHeldStrong(null)
    setVictoryVerse(null)
    setRecoveryJournal('')
  }, [])

  const toggleTrigger = useCallback((tag: string) => {
    setTriggerTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      <AnimatePresence mode="wait">

        {/* ── Landing ────────────────────────────────────────────────────── */}
        {screen === 'landing' && (
          <motion.div key="landing" {...fade} className="space-y-6">
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-8 text-center space-y-6">

              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl opacity-40 rounded-full bg-sacred-saffron" />
                  <ShieldIcon size={112} />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-2xl font-semibold text-indigo-deep leading-snug">
                  You are stronger than this moment.
                </h1>
                <p className="font-devanagari text-lg text-twilight">
                  हर तूफ़ान गुज़र जाता है
                </p>
                <p className="text-sm text-twilight italic">Every storm passes.</p>
              </div>

              <Button
                variant="sacred"
                size="lg"
                onClick={handleActivate}
                className="w-full text-base shadow-gold-glow"
              >
                🛡️ Activate Shield
              </Button>

              <p className="text-xs text-twilight">
                A 60-second breathing intervention. Then we document.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Breathe ────────────────────────────────────────────────────── */}
        {screen === 'breathe' && (
          <motion.div key="breathe" {...fade}>
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-6 text-center space-y-6">

              <div>
                <h2 className="font-devanagari font-display text-xl font-semibold text-indigo-deep">
                  पहले सांस लो
                </h2>
                <p className="text-sm text-twilight mt-0.5">Breathe First — 4-7-8 technique</p>
              </div>

              <BreathingCircle pattern="4-7-8" size={220} autoStart />

              <div className="space-y-3">
                {breathDone ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-medium text-sage-green">
                      ✓ Feeling calmer? Let's document this urge.
                    </p>
                    <Button variant="primary" size="lg" onClick={handleBreathContinue} className="w-full">
                      Continue →
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-sandstone overflow-hidden">
                        <div
                          className="h-full bg-sky-blue rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${((60 - breathLeft) / 60) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-twilight tabular-nums w-8 text-right">
                        {breathLeft}s
                      </span>
                    </div>
                    <p className="text-xs text-twilight">Stay with the breath. Continue until the timer completes.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Log ────────────────────────────────────────────────────────── */}
        {screen === 'log' && (
          <motion.div key="log" {...fade} className="space-y-4">

            <div>
              <h2 className="font-devanagari font-display text-xl font-semibold text-indigo-deep">
                संकट लेखन
              </h2>
              <p className="text-sm text-twilight">Log this urge with honesty and compassion</p>
            </div>

            {/* Intensity */}
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5 space-y-3">
              <p className="text-sm font-medium text-indigo-deep">How intense was the urge?</p>
              <WaveSelector value={intensity} onChange={setIntensity} />
            </div>

            {/* Triggers */}
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5 space-y-3">
              <p className="text-sm font-medium text-indigo-deep">
                What triggered this?{' '}
                <span className="font-normal text-twilight">Select all that apply.</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_TAGS.map(({ key, label }) => {
                  const sel = triggerTags.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => toggleTrigger(key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                        ${sel
                          ? 'bg-indigo-deep text-dawn-white border-indigo-deep'
                          : 'border-sandstone text-twilight hover:border-indigo-deep/40'}`}
                    >
                      {sel && '✓ '}{label}
                    </button>
                  )
                })}
              </div>
              <Textarea
                label="Additional notes (optional)"
                value={triggerNotes}
                onChange={e => setTriggerNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action taken */}
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5 space-y-3">
              <p className="text-sm font-medium text-indigo-deep">What did you do instead?</p>
              <input
                type="text"
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
                placeholder="e.g. 20 pushups, went for a walk…"
                className="w-full border border-sandstone rounded-card px-4 py-2.5 text-sm text-indigo-deep bg-dawn-white placeholder:text-twilight/50 focus:outline-none focus:ring-2 focus:ring-sacred-saffron/50"
              />
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setActionTaken(s)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all
                      ${actionTaken === s
                        ? 'bg-sacred-saffron/15 border-sacred-saffron text-sacred-saffron'
                        : 'border-sandstone text-twilight hover:border-sacred-saffron/40'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Held strong */}
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5 space-y-3">
              <p className="text-sm font-medium text-indigo-deep">Did you hold strong?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHeldStrong(true)}
                  className={`py-4 rounded-card border-2 font-display font-semibold text-lg transition-all duration-200
                    ${heldStrong === true
                      ? 'border-sage-green bg-sage-green/10 text-sage-green shadow-[0_0_18px_rgba(122,158,122,0.22)]'
                      : 'border-sandstone text-twilight hover:border-sage-green/40'}`}
                >
                  ✓ YES
                </button>
                <button
                  onClick={() => setHeldStrong(false)}
                  className={`py-4 rounded-card border-2 font-display font-semibold text-lg transition-all duration-200
                    ${heldStrong === false
                      ? 'border-warm-clay bg-warm-clay/10 text-warm-clay'
                      : 'border-sandstone text-twilight hover:border-warm-clay/40'}`}
                >
                  ✗ NO
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={heldStrong === null}
              onClick={handleSubmit}
              className="w-full"
            >
              Save & See Result
            </Button>
          </motion.div>
        )}

        {/* ── Victory ────────────────────────────────────────────────────── */}
        {screen === 'victory' && (
          <motion.div key="victory" {...fade} className="space-y-5">
            <ConfettiParticles />

            <div className="rounded-card border border-sage-green/40 bg-sage-green/5 shadow-warm-sm p-7 text-center space-y-5">
              <div className="text-5xl leading-none">🔥</div>

              <div>
                <h2 className="font-devanagari font-display text-2xl font-semibold text-indigo-deep">
                  विजयी!
                </h2>
                <p className="text-lg font-display text-sage-green font-medium mt-1">
                  You conquered this urge.
                </p>
              </div>

              {victoryVerse && (
                <div className="bg-parchment rounded-card border border-sandstone p-5 text-left space-y-2">
                  <p className="font-devanagari text-sm text-indigo-deep leading-relaxed">
                    {victoryVerse.sanskrit.split('\n')[0]}
                  </p>
                  <p className="text-xs text-twilight italic leading-relaxed">
                    {victoryVerse.english_meaning}
                  </p>
                  <p className="text-xs text-twilight/60">
                    — Bhagavad Gita {victoryVerse.chapter}.{victoryVerse.verse}
                  </p>
                </div>
              )}

              <div className="rounded-card bg-indigo-deep/5 border border-indigo-deep/15 px-4 py-3">
                <p className="text-sm text-indigo-deep font-medium">
                  Your streak lives on.{streak > 0 ? ` Day ${streak} continues.` : ' Keep going.'}
                </p>
              </div>

              <Button
                variant="sacred"
                size="lg"
                onClick={handleReset}
                className="w-full shadow-gold-glow"
              >
                🛡️ Return to Shield
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Recovery ───────────────────────────────────────────────────── */}
        {screen === 'recovery' && (
          <motion.div key="recovery" {...fade} className="space-y-5">
            <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-7 text-center space-y-5">
              <div className="text-4xl leading-none">🌅</div>

              <div>
                <p className="font-devanagari text-xl text-indigo-deep font-semibold leading-relaxed">
                  गिरना मानवीय है, उठना दैवीय है।
                </p>
                <p className="text-base text-twilight mt-1.5 italic">
                  Falling is human, rising is divine.
                </p>
              </div>

              <div className="bg-dawn-white rounded-card border border-sandstone p-4 text-left space-y-2">
                <p className="text-sm text-twilight leading-relaxed">
                  This does not erase your progress. Every day of discipline you lived was real — it shaped you.
                </p>
                {streak > 0 && (
                  <p className="text-sm font-medium text-indigo-deep">
                    You gained {streak} day{streak !== 1 ? 's' : ''} of strength. That is yours forever.
                  </p>
                )}
              </div>

              <div className="text-left space-y-2">
                <p className="text-sm font-medium text-indigo-deep">
                  Take a moment. Write what you're feeling.
                </p>
                <Textarea
                  label="What's on your mind right now?"
                  value={recoveryJournal}
                  onChange={e => setRecoveryJournal(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleReset}
                  className="w-full"
                >
                  Begin Again 🌱
                </Button>
                <Link
                  href="/log"
                  className="block text-center text-xs text-twilight hover:text-sacred-saffron transition-colors"
                >
                  Update today's log to reflect this →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Urge History ─────────────────────────────────────────────────── */}
      <UrgeHistory
        logs={logs}
        stats={stats}
        open={historyOpen}
        setOpen={setHistoryOpen}
      />
    </div>
  )
}
