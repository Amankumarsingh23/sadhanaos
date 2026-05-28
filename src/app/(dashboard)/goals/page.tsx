'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Unlock, Flame, Trophy,
  BookOpen, Target, TrendingUp, Zap, ChevronDown, ChevronUp,
  Plus, Star, Timer,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import milestonesRaw from '@/data/milestones-default.json'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileRow   = Database['public']['Tables']['profiles']['Row']
type MilestoneRow = Database['public']['Tables']['milestones']['Row']
type DailyRow     = Database['public']['Tables']['daily_logs']['Row']
type UrgeRow      = Database['public']['Tables']['urge_logs']['Row']
type Json         = Database['public']['Tables']['daily_logs']['Row']['prayers_completed']

interface MilestoneJson {
  day:              number
  title:            string
  sanskrit:         string
  description:      string
  expected_changes: string
  shloka_ref:       string
  message:          string
}

interface Milestone {
  id:              string
  dayNumber:       number
  title:           string
  sanskrit:        string
  description:     string
  expectedChanges: string
  message:         string
  achieved:        boolean
  achievedAt:      string | null
  reflection:      string | null
  status:          'achieved' | 'current' | 'upcoming'
}

interface Stats {
  longestStreak:   number
  totalDays:       number
  meditationHours: number
  shlokasStudied:  number
  urgeWinRate:     number | null
  avgScore:        number | null
}

const EXTEND_OPTIONS = [
  { days: 90,  label: '90 Days',       sanskrit: 'नवति' },
  { days: 120, label: '120 Days',      sanskrit: 'विंशत्युत्तरशत' },
  { days: 365, label: '1 Year',        sanskrit: 'वर्ष' },
  { days: 0,   label: 'Lifetime Sadhak', sanskrit: 'आजीवन' },
]

const RESPONSE_LETTER_KEY = 'sadhanaos_response_letter'

const jsonMap = new Map<number, MilestoneJson>(
  (milestonesRaw as MilestoneJson[]).map((m) => [m.day, m])
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)) + 1
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function getSankalp(profile: ProfileRow): string | null {
  const ps = profile.prayer_schedule
  if (!ps || typeof ps !== 'object' || Array.isArray(ps)) return null
  const rec = ps as Record<string, Json>
  const s   = rec['sankalp']
  return typeof s === 'string' && s.trim() ? s.trim() : null
}

function computeLongestStreak(logs: DailyRow[]): number {
  const maintained = new Set(logs.filter((l) => l.streak_maintained).map((l) => l.log_date))
  const sorted = [...maintained].sort()
  let max = 0, cur = 0, prev = ''
  for (const d of sorted) {
    if (prev) {
      const diff = Math.round((new Date(d).getTime() - new Date(prev).getTime()) / 86400000)
      cur = diff === 1 ? cur + 1 : 1
    } else {
      cur = 1
    }
    if (cur > max) max = cur
    prev = d
  }
  return max
}

function computeWeekScore(logs: DailyRow[], urges: UrgeRow[], hasRefl: boolean): number {
  if (logs.length === 0) return 0
  const streakDays     = logs.filter((l) => l.streak_maintained).length
  const meditationDays = logs.filter((l) => l.meditation_minutes > 0).length
  const ritualAvg      = logs.reduce((s, l) => {
    const done = [l.pranayama_done, l.exercise_done, l.skincare_morning]
      .filter(Boolean).length
    return s + done / 3
  }, 0) / logs.length

  const urgesResisted  = urges.filter((u) => u.held_strong).length
  const urgeScore      = urges.length > 0 ? (urgesResisted / urges.length) * 100 : 100

  return Math.round(
    (streakDays / 7) * 25 +
    ritualAvg * 25 +
    (meditationDays / 7) * 15 +
    urgeScore * 0.15 +
    (hasRefl ? 10 : 0) +
    0 // shloka: 10 pts — not tracked here
  )
}

// ─── Confetti Component ────────────────────────────────────────────────────────

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    delay: Math.random() * 0.8,
    dur:   1.2 + Math.random() * 1,
    color: ['#D4A847', '#E8913A', '#C47420', '#F2B366', '#D4838A'][Math.floor(Math.random() * 5)],
    size:  4 + Math.random() * 6,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-10vh', opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: 720 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: 2, background: p.color }}
        />
      ))}
    </div>
  )
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r   = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct / 100, 1)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8D5BE" strokeWidth={8} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#E8913A" strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [profile,       setProfile]       = useState<ProfileRow | null>(null)
  const [milestones,    setMilestones]     = useState<Milestone[]>([])
  const [allLogs,       setAllLogs]        = useState<DailyRow[]>([])
  const [urges,         setUrges]          = useState<UrgeRow[]>([])
  const [totalDays,     setTotalDays]      = useState(0)
  const [currentStreak, setCurrentStreak]  = useState(0)
  const [stats,         setStats]          = useState<Stats | null>(null)

  const [expandedId,    setExpandedId]     = useState<string | null>(null)
  const [reflections,   setReflections]    = useState<Record<string, string>>({})
  const [editingId,     setEditingId]      = useState<string | null>(null)
  const [editText,      setEditText]       = useState('')

  const [sealBroken,    setSealBroken]     = useState(false)
  const [showConfetti,  setShowConfetti]   = useState(false)
  const [showExtend,    setShowExtend]     = useState(false)
  const [extending,     setExtending]      = useState(false)
  const [extendDone,    setExtendDone]     = useState(false)

  const [responseLetter, setResponseLetter] = useState('')
  const [editingResponse, setEditingResponse] = useState(false)
  const [savedResponse,   setSavedResponse]   = useState(false)

  const [loading, setLoading] = useState(true)
  const autoMarked = useRef(false)

  // ─── Load data ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      { data: profileData },
      { data: milestoneData },
      { data: logData },
      { data: urgeData },
      { data: streakData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('milestones').select('*').eq('user_id', user.id).order('day_number'),
      supabase.from('daily_logs').select('*').eq('user_id', user.id),
      supabase.from('urge_logs').select('*').eq('user_id', user.id),
      supabase.from('v_current_streak').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    const prof    = profileData ?? null
    const dbRows  = (milestoneData ?? []) as MilestoneRow[]
    const logs    = (logData ?? []) as DailyRow[]
    const urgeArr = (urgeData ?? []) as UrgeRow[]
    const streak  = streakData ?? { current_streak: 0, total_days_maintained: 0 }

    setProfile(prof)
    setAllLogs(logs)
    setUrges(urgeArr)
    setTotalDays(streak.total_days_maintained)
    setCurrentStreak(streak.current_streak)

    const currentDay = daysSince(prof?.sadhana_start_date ?? null)

    // Merge DB rows with JSON enrichment
    const merged: Milestone[] = dbRows.map((row) => {
      const j     = jsonMap.get(row.day_number)
      const achieved = row.achieved || currentDay >= row.day_number
      return {
        id:              row.id,
        dayNumber:       row.day_number,
        title:           row.title,
        sanskrit:        j?.sanskrit ?? '',
        description:     row.description,
        expectedChanges: j?.expected_changes ?? '',
        message:         j?.message ?? '',
        achieved,
        achievedAt:      row.achieved_at,
        reflection:      row.reflection,
        status:          'upcoming' as const,
      }
    })

    // Assign statuses
    let foundCurrent = false
    for (const m of merged) {
      if (m.achieved) {
        m.status = 'achieved'
      } else if (!foundCurrent) {
        m.status = 'current'
        foundCurrent = true
      } else {
        m.status = 'upcoming'
      }
    }

    setMilestones(merged)

    // Seed reflections from DB
    const refMap: Record<string, string> = {}
    for (const m of merged) {
      if (m.reflection) refMap[m.id] = m.reflection
    }
    setReflections(refMap)

    // Compute stats
    const longestStreak   = computeLongestStreak(logs)
    const meditationHours = logs.reduce((s, l) => s + l.meditation_minutes, 0) / 60
    const shlokasStudied  = logs.filter((l) => l.shloka_learned_id).length
    const totalUrges      = urgeArr.length
    const urgesResisted   = urgeArr.filter((u) => u.held_strong).length
    const urgeWinRate     = totalUrges > 0 ? Math.round((urgesResisted / totalUrges) * 100) : null

    setStats({
      longestStreak,
      totalDays:       streak.total_days_maintained,
      meditationHours: Math.round(meditationHours * 10) / 10,
      shlokasStudied,
      urgeWinRate,
      avgScore:        null, // computed below
    })

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Load response letter from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RESPONSE_LETTER_KEY)
    if (saved) setResponseLetter(saved)
  }, [])

  // Auto-mark milestones as achieved
  useEffect(() => {
    if (autoMarked.current || milestones.length === 0 || !profile) return
    autoMarked.current = true
    const currentDay = daysSince(profile.sadhana_start_date)
    const toMark = milestones.filter(
      (m) => !m.achieved && currentDay >= m.dayNumber
    )
    if (toMark.length === 0) return
    Promise.all(
      toMark.map((m) =>
        supabase.from('milestones').update({
          achieved: true,
          achieved_at: todayISO(),
        }).eq('id', m.id)
      )
    )
  }, [milestones, profile])

  // ─── Derived values ───────────────────────────────────────────────────────────

  const currentDay  = profile ? daysSince(profile.sadhana_start_date) : 0
  const targetDays  = profile?.target_days ?? 90
  const startDate   = profile?.sadhana_start_date ?? null
  const targetDate  = startDate ? addDays(startDate, targetDays - 1) : null
  const pct         = Math.min(100, Math.round((currentDay / targetDays) * 100))
  const daysLeft    = Math.max(0, targetDays - currentDay)
  const completed   = currentDay >= targetDays
  const sankalp     = profile ? getSankalp(profile) : null

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function saveReflection(id: string) {
    const text = (reflections[id] ?? '').trim()
    await supabase.from('milestones').update({ reflection: text || null }).eq('id', id)
    setEditingId(null)
  }

  async function extendJourney(newDays: number) {
    if (!profile || extending) return
    setExtending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const actualDays = newDays === 0 ? 365 * 10 : newDays  // "Lifetime" = 10 years
    await supabase.from('profiles').update({ target_days: actualDays }).eq('id', user.id)

    // Insert new milestones not yet in the user's list
    const existingDays = new Set(milestones.map((m) => m.dayNumber))
    const newMilestones = (milestonesRaw as MilestoneJson[])
      .filter((m) => m.day > targetDays && m.day <= actualDays && !existingDays.has(m.day))
    if (newMilestones.length > 0) {
      await supabase.from('milestones').insert(
        newMilestones.map((m) => ({
          user_id:     user.id,
          day_number:  m.day,
          title:       m.title,
          description: m.description,
          achieved:    false,
          achieved_at: null,
          reflection:  null,
        }))
      )
    }

    setExtending(false)
    setExtendDone(true)
    autoMarked.current = false
    await load()
    setTimeout(() => { setShowExtend(false); setExtendDone(false) }, 2000)
  }

  // ─── Seal reveal ─────────────────────────────────────────────────────────────

  function breakSeal() {
    setSealBroken(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3500)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment to-cream flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl"
        >🕉️</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream pb-20">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="px-4 pt-8 pb-2 text-center">
        <p className="font-devanagari text-sacred-saffron text-base tracking-wide">लक्ष्य</p>
        <h1 className="font-display text-3xl text-indigo-deep font-semibold mt-0.5">
          Your Sadhana Journey
        </h1>
        <p className="text-sm text-twilight mt-1">Track your progress. Honour your sankalp.</p>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">

        {/* ── 1. Hero Progress Card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-card border border-sandstone shadow-warm-sm bg-gradient-to-b from-white/80 to-parchment p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-twilight uppercase tracking-wider">
              Day {currentDay} of {targetDays}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              completed
                ? 'bg-sage-green/20 text-sage-green'
                : 'bg-sacred-saffron/15 text-sacred-saffron'
            }`}>
              {completed ? '🏆 Completed' : `${pct}% complete`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mt-4 mb-2">
            <div className="h-3 rounded-full bg-sandstone overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-sacred-saffron to-saffron-deep"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            {/* Diya marker */}
            <motion.div
              className="absolute -top-2.5 -translate-x-1/2"
              style={{ left: `${Math.max(2, Math.min(98, pct))}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-lg" title="You are here">🪔</span>
            </motion.div>
          </div>

          {/* Dates row */}
          <div className="flex justify-between text-xs text-twilight mt-3">
            <div>
              <p className="font-semibold text-indigo-deep">Start</p>
              <p>{startDate ? fmtDate(startDate) : '—'}</p>
            </div>
            <div className="text-center text-xs text-twilight/70">
              <p className="font-semibold text-sacred-saffron">{daysLeft} days remaining</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-indigo-deep">Target</p>
              <p>{targetDate ? fmtDate(targetDate) : '—'}</p>
            </div>
          </div>

          {/* Milestone pills */}
          {milestones.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  title={m.title}
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    m.status === 'achieved'
                      ? 'bg-sage-green/15 border-sage-green/40 text-sage-green'
                      : m.status === 'current'
                      ? 'bg-sacred-saffron/15 border-sacred-saffron text-sacred-saffron font-semibold'
                      : 'bg-sandstone/40 border-sandstone text-twilight/50'
                  }`}
                >
                  Day {m.dayNumber}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── 2. Stats Grid ──────────────────────────────────────────────────── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: <Flame size={16} className="text-sacred-saffron" />, label: 'Longest Streak', value: `${stats.longestStreak}d` },
              { icon: <Target size={16} className="text-indigo-deep" />,   label: 'Total Days',    value: `${stats.totalDays}d` },
              { icon: <Timer size={16} className="text-twilight" />,         label: 'Meditation',    value: `${stats.meditationHours}h` },
              { icon: <BookOpen size={16} className="text-templeGold" />,  label: 'Shlokas',       value: `${stats.shlokasStudied}` },
              { icon: <Zap size={16} className="text-sage-green" />,       label: 'Urge Win',      value: stats.urgeWinRate !== null ? `${stats.urgeWinRate}%` : '—' },
              { icon: <TrendingUp size={16} className="text-rose-red" />,  label: 'Streak Now',    value: `${currentStreak}d` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-card border border-sandstone bg-white/70 p-3 text-center shadow-warm-sm">
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-lg font-bold text-indigo-deep leading-none">{value}</p>
                <p className="text-[10px] text-twilight mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── 3. Milestone Journey ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="font-display text-xl text-indigo-deep font-semibold mb-3 flex items-center gap-2">
            <Star size={18} className="text-sacred-saffron" />
            Milestone Journey
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-sandstone" />

            <div className="space-y-3">
              {milestones.map((m, i) => {
                const isExpanded = expandedId === m.id
                const isEditing  = editingId === m.id

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className={`relative ml-12 rounded-card border p-4 transition-all ${
                      m.status === 'current'
                        ? 'border-sacred-saffron shadow-gold-glow bg-gradient-to-b from-white to-parchment'
                        : m.status === 'achieved'
                        ? 'border-sandstone bg-white/70'
                        : 'border-sandstone/50 bg-white/40 opacity-70'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-8 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      m.status === 'achieved'
                        ? 'bg-sage-green border-sage-green'
                        : m.status === 'current'
                        ? 'bg-sacred-saffron border-sacred-saffron animate-pulse'
                        : 'bg-sandstone border-sandstone'
                    }`}>
                      {m.status === 'achieved' && <span className="text-white text-[10px]">✓</span>}
                      {m.status === 'current'  && <Flame size={10} className="text-white" />}
                    </div>

                    {/* Header row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              m.status === 'achieved' ? 'bg-sage-green/15 text-sage-green' :
                              m.status === 'current'  ? 'bg-sacred-saffron/15 text-sacred-saffron' :
                              'bg-sandstone/60 text-twilight'
                            }`}>Day {m.dayNumber}</span>
                            {m.status === 'current'  && <span className="text-xs text-sacred-saffron font-semibold">🔥 Current</span>}
                            {m.status === 'achieved' && <span className="text-xs text-sage-green font-semibold">✅ Achieved</span>}
                            {m.status === 'upcoming' && <span className="text-xs text-twilight/60">⏳ Upcoming</span>}
                          </div>
                          <p className="font-display text-base text-indigo-deep font-semibold mt-0.5">
                            {m.title}
                          </p>
                          {m.sanskrit && (
                            <p className="font-devanagari text-xs text-sacred-saffron">{m.sanskrit}</p>
                          )}
                        </div>
                        {isExpanded
                          ? <ChevronUp size={16} className="text-twilight shrink-0 mt-1" />
                          : <ChevronDown size={16} className="text-twilight shrink-0 mt-1" />
                        }
                      </div>
                    </button>

                    {/* Achieved date */}
                    {m.status === 'achieved' && m.achievedAt && (
                      <p className="text-[10px] text-twilight/60 mt-0.5">
                        Achieved on {fmtDate(m.achievedAt)}
                      </p>
                    )}

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-3 border-t border-sandstone/40 pt-3">
                            <p className="text-sm text-indigo-deep leading-relaxed">{m.description}</p>

                            {m.expectedChanges && (
                              <div className="bg-sage-green/8 border border-sage-green/20 rounded-lg p-3">
                                <p className="text-xs font-semibold text-sage-green mb-1">Expected changes</p>
                                <p className="text-xs text-indigo-deep">{m.expectedChanges}</p>
                              </div>
                            )}

                            {m.message && (
                              <div className="bg-sacred-saffron/8 border border-sacred-saffron/20 rounded-lg p-3">
                                <p className="text-xs font-semibold text-sacred-saffron mb-1">ऋषि का वचन</p>
                                <p className="text-xs text-indigo-deep italic leading-relaxed">{m.message}</p>
                              </div>
                            )}

                            {/* Reflection — only for achieved */}
                            {m.status === 'achieved' && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-twilight">Your Reflection</p>
                                  {!isEditing && (
                                    <button
                                      onClick={() => { setEditingId(m.id); setEditText(reflections[m.id] ?? '') }}
                                      className="flex items-center gap-1 text-xs text-sacred-saffron hover:underline"
                                    >
                                      <Plus size={12} /> {reflections[m.id] ? 'Edit' : 'Add reflection'}
                                    </button>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      placeholder="How did you feel reaching this milestone? What changed?"
                                      rows={3}
                                      className="w-full text-xs rounded-lg border border-sandstone bg-white/80 px-3 py-2 text-indigo-deep placeholder-twilight/50 focus:outline-none focus:border-sacred-saffron"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setReflections((r) => ({ ...r, [m.id]: editText }))
                                          saveReflection(m.id)
                                        }}
                                        className="text-xs bg-sacred-saffron text-white px-3 py-1 rounded-lg font-semibold"
                                      >Save</button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="text-xs text-twilight px-3 py-1 rounded-lg border border-sandstone"
                                      >Cancel</button>
                                    </div>
                                  </div>
                                ) : reflections[m.id] ? (
                                  <p className="text-xs text-indigo-deep italic bg-cream/60 rounded-lg p-2 border border-sandstone/40">
                                    &ldquo;{reflections[m.id]}&rdquo;
                                  </p>
                                ) : (
                                  <p className="text-xs text-twilight/50 italic">No reflection yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              {milestones.length === 0 && (
                <div className="ml-12 rounded-card border border-sandstone bg-white/60 p-6 text-center">
                  <p className="text-sm text-twilight">No milestones yet. Complete onboarding to begin your journey.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── 4. Sealed Sankalp Letter ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="font-display text-xl text-indigo-deep font-semibold mb-3 flex items-center gap-2">
            {completed ? <Unlock size={18} className="text-sage-green" /> : <Lock size={18} className="text-indigo-deep" />}
            Sealed Sankalp Letter
          </h2>

          <AnimatePresence mode="wait">
            {!completed ? (
              /* Locked state */
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-card border-2 border-dashed border-sandstone bg-gradient-to-b from-parchment/60 to-cream p-6 text-center relative overflow-hidden"
              >
                {/* Wax seal aesthetic */}
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <ProgressRing pct={pct} size={80} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🔏</span>
                  </div>
                </div>
                <p className="font-display text-lg text-indigo-deep font-semibold">
                  Sealed until Day {targetDays}
                </p>
                <p className="text-xs text-twilight mt-1 mb-3">
                  {daysLeft > 0
                    ? `${daysLeft} more days until your sankalp letter is revealed.`
                    : 'Complete your journey to unseal this letter.'}
                </p>
                <div className="relative inline-block">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sacred-saffron/20 via-temple-gold/20 to-sacred-saffron/20 rounded-xl blur-sm" />
                  <div className="relative rounded-xl border border-sandstone bg-white/60 px-4 py-3 text-sm text-twilight italic max-w-xs mx-auto">
                    Your words from Day 1 are safely locked within.
                    <br />They await you at the finish line.
                  </div>
                </div>
                <div className="mt-3 text-xs text-twilight/50">
                  {Math.round(pct)}% of your journey complete
                </div>
              </motion.div>
            ) : !sealBroken ? (
              /* Ready to break seal */
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="rounded-card border-2 border-sacred-saffron shadow-gold-glow bg-gradient-to-b from-parchment to-cream p-6 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-4"
                >🔏</motion.div>
                <p className="font-display text-xl text-sacred-saffron font-bold">
                  You did it, Sadhak.
                </p>
                <p className="text-sm text-indigo-deep mt-1 mb-4">
                  {targetDays} days of brahmacharya sadhana. Your sankalp letter awaits.
                </p>
                <button
                  onClick={breakSeal}
                  className="group relative px-8 py-3 bg-gradient-to-r from-sacred-saffron to-saffron-deep text-white font-bold rounded-card shadow-gold-glow hover:shadow-saffron-glow transition-all duration-300 text-sm"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Unlock size={16} />
                    Break the Seal
                  </span>
                </button>
              </motion.div>
            ) : (
              /* Revealed */
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="rounded-card border-2 border-temple-gold shadow-gold-glow bg-gradient-to-b from-white to-parchment overflow-hidden"
              >
                {/* Letter header */}
                <div className="bg-gradient-to-r from-sacred-saffron/10 to-temple-gold/10 border-b border-sandstone px-5 py-4 text-center">
                  <p className="font-devanagari text-sacred-saffron text-base">संकल्प</p>
                  <p className="font-display text-2xl text-indigo-deep font-bold">Your Sankalp Letter</p>
                  <p className="text-xs text-twilight mt-0.5">Written on Day 1 · Sealed · Now revealed</p>
                </div>

                <div className="p-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-parchment/80 border border-sandstone rounded-xl p-5 font-display text-base text-indigo-deep leading-relaxed italic"
                    style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #E8D5BE44 27px, #E8D5BE44 28px)' }}
                  >
                    {sankalp
                      ? <>&ldquo;{sankalp}&rdquo;</>
                      : <span className="text-twilight/60">No sankalp text was recorded on Day 1.</span>
                    }
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm text-center text-indigo-deep font-semibold"
                  >
                    You made a promise. You kept it. 🙏
                  </motion.p>

                  {/* Response letter */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="border-t border-sandstone pt-4"
                  >
                    <p className="text-sm font-semibold text-indigo-deep mb-2">
                      Write a letter to your Day 1 self
                    </p>
                    {editingResponse ? (
                      <div className="space-y-2">
                        <textarea
                          value={responseLetter}
                          onChange={(e) => setResponseLetter(e.target.value)}
                          placeholder="Dear Day 1 me, I want you to know..."
                          rows={5}
                          className="w-full text-sm rounded-xl border border-sandstone bg-white/80 px-4 py-3 text-indigo-deep placeholder-twilight/50 focus:outline-none focus:border-sacred-saffron font-display leading-relaxed"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              localStorage.setItem(RESPONSE_LETTER_KEY, responseLetter)
                              setEditingResponse(false)
                              setSavedResponse(true)
                              setTimeout(() => setSavedResponse(false), 2000)
                            }}
                            className="text-sm bg-sacred-saffron text-white px-4 py-1.5 rounded-lg font-semibold"
                          >Save Letter</button>
                          <button
                            onClick={() => setEditingResponse(false)}
                            className="text-sm text-twilight px-4 py-1.5 rounded-lg border border-sandstone"
                          >Cancel</button>
                        </div>
                      </div>
                    ) : responseLetter ? (
                      <div>
                        <p className="text-sm text-indigo-deep italic bg-cream/60 border border-sandstone/40 rounded-xl p-4 font-display leading-relaxed">
                          &ldquo;{responseLetter}&rdquo;
                        </p>
                        <button
                          onClick={() => setEditingResponse(true)}
                          className="mt-2 text-xs text-sacred-saffron hover:underline"
                        >Edit</button>
                        {savedResponse && (
                          <span className="ml-3 text-xs text-sage-green">Saved ✓</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingResponse(true)}
                        className="flex items-center gap-2 text-sm text-sacred-saffron border border-sacred-saffron/40 rounded-xl px-4 py-2 hover:bg-sacred-saffron/8 transition-colors"
                      >
                        <Plus size={14} />
                        Write your response letter
                      </button>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── 5. Post-Completion: Extend Journey ─────────────────────────────── */}
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-card border border-sandstone shadow-warm-sm bg-white/80 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-deep flex items-center gap-2">
                  <Trophy size={16} className="text-sacred-saffron" />
                  Continue your Sadhana?
                </p>
                <p className="text-xs text-twilight mt-0.5">
                  You&apos;ve completed your {targetDays}-day journey. Will you go further?
                </p>
              </div>
              <button
                onClick={() => setShowExtend(!showExtend)}
                className="text-xs bg-sacred-saffron text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                {showExtend ? 'Close' : 'Extend'}
              </button>
            </div>

            <AnimatePresence>
              {showExtend && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {EXTEND_OPTIONS.map((opt) => {
                      const alreadySet = opt.days > 0 && opt.days <= targetDays
                      return (
                        <button
                          key={opt.days}
                          disabled={alreadySet || extending}
                          onClick={() => extendJourney(opt.days)}
                          className={`relative rounded-xl border p-3 text-center transition-all ${
                            alreadySet
                              ? 'border-sandstone bg-sandstone/20 opacity-50 cursor-not-allowed'
                              : 'border-sacred-saffron/40 bg-parchment hover:border-sacred-saffron hover:shadow-gold-glow cursor-pointer'
                          }`}
                        >
                          <p className="font-devanagari text-xs text-sacred-saffron">{opt.sanskrit}</p>
                          <p className="font-semibold text-sm text-indigo-deep mt-0.5">{opt.label}</p>
                          {alreadySet && (
                            <span className="absolute top-1 right-1 text-[10px] text-sage-green">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {extendDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-xs text-center text-sage-green font-semibold"
                    >
                      ✅ Journey extended. New milestones added.
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  )
}
