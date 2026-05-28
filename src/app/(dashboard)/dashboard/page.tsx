'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Brain, Wind, Heart, BookOpen, Sparkles, Dumbbell, Droplets,
  Activity, Check, ChevronRight, Quote, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { DiyaFlame } from '@/components/sacred/DiyaFlame'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ShlokCard } from '@/components/sacred/ShlokCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useDashboardData } from '@/hooks/useDashboardData'
import type { DailyLogRow, PracticesConfig } from '@/hooks/useDashboardData'
import gitaData from '@/data/bhagavad-gita.json'
import affirmationsDefault from '@/data/affirmations-default.json'

// ── Shloka data ────────────────────────────────────────────────────────────
type GitaVerse = {
  id: string; chapter: number; verse: number; sanskrit: string
  transliteration: string; hindi_meaning: string; english_meaning: string
  context?: string; practical_application?: string
  related_theme?: string[]; difficulty?: 'beginner' | 'intermediate' | 'advanced'
}
const GITA_VERSES: GitaVerse[] = (gitaData as { verses: GitaVerse[] }).verses

function getDailyVerse(dateStr: string, offset = 0): GitaVerse {
  const hash = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GITA_VERSES[(hash + offset) % GITA_VERSES.length]
}

// ── Milestone phase label ──────────────────────────────────────────────────
function getMilestonePhase(day: number): { label: string; sanskrit: string } {
  if (day >= 90) return { label: 'Trimaas Tapasya — Ancient Tapas',       sanskrit: 'त्रिमास तपस्या' }
  if (day >= 60) return { label: 'Shashthi Siddhi — The Great Threshold', sanskrit: 'षष्ठी सिद्धि' }
  if (day >= 45) return { label: 'Ardha-Shatak — Self-Sustaining Phase',  sanskrit: 'अर्ध-शतक' }
  if (day >= 40) return { label: 'Mandala — Sacred 40-Day Cycle',         sanskrit: 'मण्डल' }
  if (day >= 30) return { label: 'Maas Purna — One Complete Month',       sanskrit: 'मास पूर्ण' }
  if (day >= 21) return { label: 'Triveni — Habit Formation',             sanskrit: 'त्रिवेणी' }
  if (day >= 14) return { label: 'Paksha — The Fortnight',               sanskrit: 'पक्ष' }
  if (day >= 7)  return { label: 'Saptah Siddhi — One Week',             sanskrit: 'सप्ताह सिद्धि' }
  if (day >= 3)  return { label: 'Tritiya — The Third Day',              sanskrit: 'तृतीय' }
  return                 { label: 'Pratham Charan — First Steps',        sanskrit: 'प्रथम चरण' }
}

// ── Ritual configuration ───────────────────────────────────────────────────
type RitualKey = 'meditation' | 'pranayama' | 'prayer' | 'shloka_study' | 'gratitude' | 'skincare' | 'exercise' | 'water_intake'

const RITUALS: { key: RitualKey; labelHi: string; labelEn: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'meditation',   labelHi: 'ध्यान',          labelEn: 'Meditation',      Icon: Brain    },
  { key: 'pranayama',    labelHi: 'प्राणायाम',       labelEn: 'Pranayama',       Icon: Wind     },
  { key: 'prayer',       labelHi: 'प्रार्थना',       labelEn: 'Prayer',          Icon: Heart    },
  { key: 'shloka_study', labelHi: 'श्लोक अध्ययन',   labelEn: 'Shloka Study',    Icon: BookOpen },
  { key: 'gratitude',    labelHi: 'कृतज्ञता',        labelEn: 'Gratitude',       Icon: Sparkles },
  { key: 'skincare',     labelHi: 'त्वचा देखभाल',   labelEn: 'Skincare',        Icon: Sun      },
  { key: 'exercise',     labelHi: 'व्यायाम',         labelEn: 'Exercise',        Icon: Dumbbell },
  { key: 'water_intake', labelHi: 'जल सेवन',         labelEn: 'Water Intake',    Icon: Droplets },
]

function isRitualDone(key: RitualKey, log: DailyLogRow): boolean {
  switch (key) {
    case 'meditation':   return (log.meditation_minutes ?? 0) > 0
    case 'pranayama':    return log.pranayama_done
    case 'prayer':       return Array.isArray(log.prayers_completed) ? log.prayers_completed.length > 0 : Boolean(log.prayers_completed)
    case 'shloka_study': return Boolean(log.shloka_learned_id)
    case 'gratitude':    return Boolean(log.gratitude_1)
    case 'skincare':     return log.skincare_morning || log.skincare_evening
    case 'exercise':     return log.exercise_done
    case 'water_intake': return (log.water_glasses ?? 0) >= 6
  }
}

function getRitualPatch(key: RitualKey, nowDone: boolean, config: PracticesConfig): Record<string, unknown> {
  switch (key) {
    case 'meditation':   return { meditation_minutes: nowDone ? (config.meditation_minutes ?? 15) : 0 }
    case 'pranayama':    return { pranayama_done: nowDone }
    case 'prayer':       return { prayers_completed: nowDone ? ['morning'] : [] }
    case 'shloka_study': return { shloka_learned_id: nowDone ? 'studied' : null }
    case 'gratitude':    return { gratitude_1: nowDone ? '✓' : null }
    case 'skincare':     return { skincare_morning: nowDone }
    case 'exercise':     return { exercise_done: nowDone }
    case 'water_intake': return { water_glasses: nowDone ? 6 : 0 }
  }
}

function getEnabledRituals(config: PracticesConfig): RitualKey[] {
  return RITUALS.filter(({ key }) => config[key] !== false).map(r => r.key)
}

// ── Completions helpers ────────────────────────────────────────────────────
function getCompletionRate(log: DailyLogRow | undefined | null, keys: RitualKey[]): number {
  if (!log || keys.length === 0) return 0
  const done = keys.filter(k => isRitualDone(k, log)).length
  return done / keys.length
}

function getMoodEmoji(score: number | null): string {
  if (score === null) return '—'
  if (score >= 7) return '😊'
  if (score >= 4) return '😐'
  return '😔'
}

// ── SVG Mood Sparkline ────────────────────────────────────────────────────
function MoodSparkline({ values }: { values: (number | null)[] }) {
  const filled = values.map(v => v ?? 5)
  const w = 240, h = 56, pad = 8
  const min = 1, max = 10
  const pts = filled.map((v, i) => ({
    x: pad + (i / Math.max(filled.length - 1, 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / (max - min)) * (h - pad * 2),
  }))

  let d = ''
  if (pts.length >= 2) {
    d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2
      d += ` C ${mx} ${pts[i - 1].y} ${mx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {/* Grid lines */}
      {[1, 5, 10].map(v => {
        const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
        return <line key={v} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(107,109,158,0.1)" strokeWidth={1} />
      })}
      {/* Gradient fill below the line */}
      <defs>
        <linearGradient id="mood-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2B2D5B" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#2B2D5B" stopOpacity={0} />
        </linearGradient>
      </defs>
      {d && (
        <path
          d={d + ` L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`}
          fill="url(#mood-fill)"
        />
      )}
      {/* Line */}
      {d && <path d={d} fill="none" stroke="#2B2D5B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2B2D5B" fillOpacity={0.6} />
      ))}
    </svg>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ hi, en }: { hi: string; en: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <h2 className="font-devanagari font-display text-lg font-semibold text-indigo-deep">{hi}</h2>
      <span className="text-xs text-twilight">{en}</span>
    </div>
  )
}

// ── 1. Streak Hero Card ───────────────────────────────────────────────────
function StreakHeroCard({ streak, dayNumber, targetDays }: { streak: number; dayNumber: number; targetDays: number }) {
  const phase = getMilestonePhase(dayNumber)
  const pct = Math.min(100, Math.round((dayNumber / targetDays) * 100))

  return (
    <div
      className="rounded-card border border-sandstone shadow-warm-sm overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F5EDE0 0%, #F2E4CE 60%, #EDD8B8 100%)' }}
    >
      <div className="p-6 flex items-center gap-6">
        {/* Diya */}
        <div className="shrink-0">
          <DiyaFlame streak={streak} isActive size="lg" />
        </div>

        {/* Center: Day count + phase */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sacred-saffron uppercase tracking-widest mb-0.5">
            Brahmacharya Sadhana
          </p>
          <div className="font-display">
            <span className="text-4xl sm:text-5xl font-semibold text-indigo-deep leading-none">
              Day {dayNumber}
            </span>
            <span className="text-xl text-twilight font-medium ml-2">of {targetDays}</span>
          </div>
          <p className="font-devanagari text-sm text-twilight mt-1 leading-tight">{phase.sanskrit}</p>
          <p className="text-xs text-twilight mt-0.5 leading-tight">{phase.label}</p>
        </div>

        {/* Progress ring */}
        <div className="shrink-0">
          <ProgressRing value={pct} max={100} size={76} strokeWidth={6} color="#E8913A" trackColor="#E8D5BE">
            <span className="text-sm font-bold text-indigo-deep">{pct}%</span>
          </ProgressRing>
          <p className="text-center text-xs text-twilight mt-1">complete</p>
        </div>
      </div>
    </div>
  )
}

// ── 2. Daily Intention Card ───────────────────────────────────────────────
function IntentionCard({
  intention,
  onSave,
}: {
  intention: string | null
  onSave: (text: string) => void
}) {
  const [editing, setEditing] = useState(!intention)
  const [value, setValue] = useState(intention ?? '')

  const handleSave = () => {
    if (value.trim()) { onSave(value.trim()); setEditing(false) }
  }

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5">
      <p className="text-xs font-semibold text-twilight uppercase tracking-wider mb-3">
        आज का संकल्प — Today&apos;s Intention
      </p>

      {editing ? (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="आज मैं..."
            className="w-full rounded-card border border-sandstone bg-dawn-white px-3 py-2 text-sm text-indigo-deep font-devanagari placeholder:text-sandstone/80 focus:outline-none focus:ring-2 focus:ring-sacred-saffron"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={!value.trim()}>
              Set Intention
            </Button>
            {intention && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </div>
      ) : (
        <button className="w-full text-left group" onClick={() => setEditing(true)}>
          <div className="flex gap-2 items-start">
            <Quote className="w-4 h-4 text-sacred-saffron/60 shrink-0 mt-0.5" />
            <p className="font-devanagari text-sm italic text-indigo-deep leading-relaxed flex-1">{value}</p>
            <Quote className="w-4 h-4 text-sacred-saffron/60 shrink-0 mt-0.5 rotate-180" />
          </div>
          <p className="text-xs text-twilight/60 mt-2 group-hover:text-twilight transition-colors">
            Click to edit
          </p>
        </button>
      )}
    </div>
  )
}

// ── 3. Rituals Checklist ──────────────────────────────────────────────────
function RitualsCard({
  todayLog,
  practicesConfig,
  onToggle,
}: {
  todayLog: DailyLogRow
  practicesConfig: PracticesConfig
  onToggle: (key: RitualKey) => void
}) {
  const enabled = getEnabledRituals(practicesConfig)
  const doneCount = enabled.filter(k => isRitualDone(k, todayLog)).length
  const allDone = doneCount === enabled.length
  const pct = enabled.length > 0 ? Math.round((doneCount / enabled.length) * 100) : 0

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-twilight uppercase tracking-wider">
          आज की दिनचर्या — Today&apos;s Rituals
        </p>
        {allDone && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1 rounded-full bg-temple-gold/15 border border-temple-gold/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-deep"
          >
            ✨ <span className="font-devanagari">शुद्ध दिन</span>
          </motion.span>
        )}
      </div>

      <div className="space-y-2">
        {RITUALS.filter(r => enabled.includes(r.key)).map(({ key, labelHi, labelEn, Icon }) => {
          const done = isRitualDone(key, todayLog)
          return (
            <motion.button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`w-full flex items-center gap-3 rounded-card p-3 text-left transition-all duration-200 ${
                done
                  ? 'bg-sacred-saffron/8 border border-sacred-saffron/30'
                  : 'bg-dawn-white/70 border border-sandstone hover:border-sacred-saffron/40'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                done ? 'bg-sacred-saffron' : 'bg-sandstone/60'
              }`}>
                {done
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <Icon className="w-3.5 h-3.5 text-twilight" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <span className={`font-devanagari text-sm font-medium ${done ? 'text-indigo-deep' : 'text-twilight'}`}>
                  {labelHi}
                </span>
                <span className={`text-xs ml-2 ${done ? 'text-sacred-saffron' : 'text-twilight/60'}`}>
                  {labelEn}
                </span>
              </div>
              {done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-sacred-saffron"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-twilight">
          <span>{doneCount} of {enabled.length} complete</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-sandstone overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: allDone ? 'linear-gradient(90deg,#D4A847,#E8913A)' : '#E8913A' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ── 4. Today's Shloka Card ────────────────────────────────────────────────
function ShlokDailyCard({ today }: { today: string }) {
  const [offset, setOffset] = useState(0)
  const verse = getDailyVerse(today, offset)

  return (
    <div className="space-y-3">
      <ShlokCard
        id={verse.id}
        sanskrit={verse.sanskrit}
        transliteration={verse.transliteration}
        hindi_meaning={verse.hindi_meaning}
        english_meaning={verse.english_meaning}
        context={verse.context}
        practical_application={verse.practical_application}
        source="Bhagavad Gita"
        chapter={verse.chapter}
        verse={verse.verse}
        difficulty={verse.difficulty}
        related_theme={verse.related_theme}
      />
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setOffset(o => o + 1)}
          className="flex items-center gap-1 text-xs text-sacred-saffron hover:text-saffron-deep font-medium transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Next shloka
        </button>
        <Link
          href="/dashboard/granthalaya"
          className="flex items-center gap-1 text-xs text-twilight hover:text-indigo-deep font-medium transition-colors"
        >
          Study in library <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

// ── 5. 7-Day Consistency Grid ─────────────────────────────────────────────
function WeekGridCard({
  weekLogs,
  practicesConfig,
  today,
}: {
  weekLogs: DailyLogRow[]
  practicesConfig: PracticesConfig
  today: string
}) {
  const enabled = getEnabledRituals(practicesConfig)

  // Build last 7 days array
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5">
      <p className="text-xs font-semibold text-twilight uppercase tracking-wider mb-4">
        सप्ताह की झलक — Week View
      </p>
      <div className="flex justify-between gap-2">
        {days.map((dateStr) => {
          const log = weekLogs.find(l => l.log_date === dateStr)
          const rate = getCompletionRate(log, enabled)
          const isToday = dateStr === today
          const dayIdx = new Date(dateStr + 'T12:00:00').getDay()

          let fillColor = 'bg-sandstone/40'
          if (rate >= 0.7)      fillColor = 'bg-sacred-saffron'
          else if (rate >= 0.3) fillColor = 'bg-saffron-light/60'

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-xs text-twilight font-medium">{DAY_SHORT[dayIdx]}</span>
              <div className={`relative w-8 h-8 rounded-full ${fillColor} flex items-center justify-center ${
                isToday ? 'ring-2 ring-sacred-saffron ring-offset-1 ring-offset-parchment' : ''
              }`}>
                {rate >= 0.7 && <Check className="w-3.5 h-3.5 text-white" />}
                {rate >= 0.3 && rate < 0.7 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sacred-saffron" />
                )}
              </div>
              <span className="text-xs leading-none" title={`Mood: ${log?.mood_score ?? '—'}`}>
                {getMoodEmoji(log?.mood_score ?? null)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sandstone/60">
        {[
          { color: 'bg-sacred-saffron', label: '≥70%' },
          { color: 'bg-saffron-light/60', label: '30–69%' },
          { color: 'bg-sandstone/40', label: '<30%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-twilight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 6. Mood Wave Card ─────────────────────────────────────────────────────
function MoodWaveCard({ weekLogs }: { weekLogs: DailyLogRow[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const values = days.map(d => weekLogs.find(l => l.log_date === d)?.mood_score ?? null)
  const hasData = values.some(v => v !== null)

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-5">
      <p className="text-xs font-semibold text-twilight uppercase tracking-wider mb-3">
        मनोदशा — Mood Wave
      </p>
      {hasData ? (
        <div className="flex items-end">
          <MoodSparkline values={values} />
        </div>
      ) : (
        <div className="h-14 flex items-center justify-center">
          <p className="text-xs text-twilight/60 italic">Log your mood daily to see the wave</p>
        </div>
      )}
      <div className="flex justify-between mt-2 text-xs text-twilight/60">
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

// ── 7. Affirmation Carousel ───────────────────────────────────────────────
type AffItem = { text_hindi?: string | null; text_english: string; source?: string | null }

function AffirmationCard({ affirmations }: { affirmations: AffItem[] }) {
  const items: AffItem[] = affirmations.length > 0
    ? affirmations
    : (affirmationsDefault as AffItem[]).slice(0, 5)

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => setIdx(i => (i + 1) % items.length), 8000)
    return () => clearInterval(timer)
  }, [items.length])

  const current = items[idx]

  return (
    <div className="rounded-card border border-temple-gold/30 bg-gradient-to-br from-parchment to-sandstone/20 shadow-warm-sm p-6 overflow-hidden relative">
      <div
        aria-hidden
        className="absolute top-2 right-4 font-devanagari text-6xl text-temple-gold/8 select-none pointer-events-none leading-none"
      >
        ॐ
      </div>
      <p className="text-xs font-semibold text-temple-gold uppercase tracking-wider mb-4">
        आज का विचार — Affirmation
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          {current.text_hindi && (
            <p className="font-devanagari text-base font-medium text-indigo-deep leading-relaxed">
              {current.text_hindi}
            </p>
          )}
          <p className="text-sm text-twilight leading-relaxed italic">{current.text_english}</p>
          {current.source && (
            <p className="text-xs text-twilight/60 mt-1">— {current.source}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === idx ? 'bg-temple-gold w-3' : 'bg-sandstone'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ── 8. Quick Stats Row ────────────────────────────────────────────────────
function QuickStatsRow({ stats }: { stats: { meditationMinutes: number; urgesResisted: number; shlokasStudied: number; prayerRate: number } }) {
  const items = [
    { label: 'Meditation', labelHi: 'ध्यान', value: `${stats.meditationMinutes}m`, Icon: Brain },
    { label: 'Urges Held', labelHi: 'जीत', value: String(stats.urgesResisted), Icon: Activity },
    { label: 'Shlokas',    labelHi: 'श्लोक', value: String(stats.shlokasStudied), Icon: BookOpen },
    { label: 'Prayer',     labelHi: 'प्रार्थना', value: `${stats.prayerRate}%`, Icon: Heart },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, labelHi, value, Icon }) => (
        <div key={label} className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-4 flex flex-col items-center text-center gap-1">
          <Icon className="w-4 h-4 text-sacred-saffron/80 mb-1" />
          <span className="text-xl font-bold font-display text-indigo-deep leading-none">{value}</span>
          <span className="font-devanagari text-xs text-twilight">{labelHi}</span>
          <span className="text-xs text-twilight/60">{label} this week</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    loading, profile, todayLog, weekLogs,
    affirmations, streak, dayNumber, practicesConfig,
    weeklyStats, updateTodayLog,
  } = useDashboardData()

  const today = new Date().toISOString().split('T')[0]

  const handleRitualToggle = useCallback((key: RitualKey) => {
    if (!todayLog) return
    const currentDone = isRitualDone(key, todayLog)
    const patch = getRitualPatch(key, !currentDone, practicesConfig)
    updateTodayLog(patch as Parameters<typeof updateTodayLog>[0])
  }, [todayLog, practicesConfig, updateTodayLog])

  const handleIntentionSave = useCallback((text: string) => {
    updateTodayLog({ daily_intention: text })
  }, [updateTodayLog])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-40" />
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon="🪔"
        title="Every great journey begins with a single step."
        description="Complete your onboarding to light the diya and begin your sadhana."
        ctaLabel="Begin Sadhana 🙏"
        ctaHref="/onboarding"
      />
    )
  }

  // No logs yet — first day
  if (weekLogs.length === 0 && !todayLog) {
    return (
      <EmptyState
        icon="🌅"
        title="Your first day of sadhana awaits."
        description="Log your morning practice to begin tracking your transformation. Every master was once a beginner."
        ctaLabel="Log Today's Practice"
        ctaHref="/log"
      />
    )
  }

  const targetDays = profile.target_days ?? 60

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── TOP: आज का दिन ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel hi="आज का दिन" en="Today" />

        <StreakHeroCard streak={streak} dayNumber={dayNumber} targetDays={targetDays} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntentionCard
            intention={todayLog?.daily_intention ?? null}
            onSave={handleIntentionSave}
          />
          <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-4 flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold font-display text-sacred-saffron">{streak}</span>
              <span className="text-xs text-twilight">day streak</span>
            </div>
            <div className="flex-1 h-px bg-sandstone" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold font-display text-sage-green">
                {todayLog ? getCompletionRate(todayLog, getEnabledRituals(practicesConfig)) >= 1
                  ? '🔥' : `${Math.round(getCompletionRate(todayLog, getEnabledRituals(practicesConfig)) * 100)}%` : '—'}
              </span>
              <span className="text-xs text-twilight">today done</span>
            </div>
          </div>
        </div>

        {todayLog && (
          <RitualsCard
            todayLog={todayLog}
            practicesConfig={practicesConfig}
            onToggle={handleRitualToggle}
          />
        )}

        <div>
          <p className="text-xs font-semibold text-twilight uppercase tracking-wider mb-3">
            आज का श्लोक — Today&apos;s Shloka
          </p>
          <ShlokDailyCard today={today} />
        </div>
      </section>

      {/* ── MIDDLE: सप्ताह दृष्टि ────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel hi="सप्ताह दृष्टि" en="Week View" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WeekGridCard weekLogs={weekLogs} practicesConfig={practicesConfig} today={today} />
          <MoodWaveCard weekLogs={weekLogs} />
        </div>
      </section>

      {/* ── BOTTOM ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <AffirmationCard affirmations={affirmations} />
        <div>
          <p className="text-xs font-semibold text-twilight uppercase tracking-wider mb-3">
            साप्ताहिक सारांश — This Week
          </p>
          <QuickStatsRow stats={weeklyStats} />
        </div>
      </section>

    </div>
  )
}
