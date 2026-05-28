'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Plus, Flame, Trophy, TrendingUp } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab       = 'weekly' | 'journey'
type WeeklyRow = Database['public']['Tables']['weekly_reflections']['Row']
type DailyRow  = Database['public']['Tables']['daily_logs']['Row']

const DIMENSIONS = [
  { key: 'mental_clarity',       hi: 'मानसिक स्पष्टता',      en: 'Mental Clarity',       short: 'Mental'    },
  { key: 'emotional_stability',  hi: 'भावनात्मक स्थिरता',    en: 'Emotional Stability',  short: 'Emotional'  },
  { key: 'spiritual_connection', hi: 'आध्यात्मिक संबंध',     en: 'Spiritual Connection', short: 'Spiritual'  },
  { key: 'physical_energy',      hi: 'शारीरिक ऊर्जा',        en: 'Physical Energy',      short: 'Physical'   },
  { key: 'skin_quality',         hi: 'त्वचा गुणवत्ता',       en: 'Skin Quality',         short: 'Skin'       },
  { key: 'sleep_quality',        hi: 'नींद गुणवत्ता',         en: 'Sleep Quality',        short: 'Sleep'      },
  { key: 'social_confidence',    hi: 'सामाजिक आत्मविश्वास',  en: 'Social Confidence',    short: 'Social'     },
  { key: 'eye_contact',          hi: 'आँखों का संपर्क',       en: 'Eye Contact',          short: 'Eye'        },
] as const

type DimKey = typeof DIMENSIONS[number]['key']

interface TimelineEntry {
  id:     string
  day:    number
  text:   string
  isAuto: boolean
}

const CUSTOM_ENTRIES_KEY = 'sadhanaos_timeline_entries'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function mondayOf(dateStr: string): string {
  const d   = new Date(dateStr)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

function sadhanaWeekNumber(startDate: string | null): number {
  if (!startDate) {
    const d    = new Date()
    const jan1 = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  }
  return Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / (7 * 86400000)) + 1)
}

function computeStreak(logs: DailyRow[]): number {
  const logSet = new Set(logs.filter((l) => l.streak_maintained).map((l) => l.log_date))
  let streak   = 0
  const d      = new Date(todayISO())
  while (logSet.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function dimVal(row: WeeklyRow, key: DimKey): number {
  return (row as unknown as Record<DimKey, number | null>)[key] ?? 0
}

function generateAutoEvents(
  startDate: string,
  dailyLogs: DailyRow[],
  urgeDates: string[],
  reflections: WeeklyRow[],
): TimelineEntry[] {
  const startMs = new Date(startDate).getTime()
  const dayOf   = (ds: string) =>
    Math.max(1, Math.floor((new Date(ds).getTime() - startMs) / 86400000) + 1)

  const sorted = [...dailyLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  const events: TimelineEntry[] = []

  // Meditation began
  const firstMed = sorted.find((l) => l.meditation_minutes > 0)
  if (firstMed) {
    events.push({ id: 'auto_med', day: dayOf(firstMed.log_date), text: 'Meditation practice began', isAuto: true })
  }

  // Mood improvement week 1 → week 2
  const w1Moods = sorted.filter((l) => dayOf(l.log_date) <= 7  && l.mood_score !== null)
  const w2Moods = sorted.filter((l) => { const d = dayOf(l.log_date); return d > 7 && d <= 14 }).filter((l) => l.mood_score !== null)
  if (w1Moods.length >= 3 && w2Moods.length >= 3) {
    const a1 = w1Moods.reduce((s, l) => s + l.mood_score!, 0) / w1Moods.length
    const a2 = w2Moods.reduce((s, l) => s + l.mood_score!, 0) / w2Moods.length
    if (a2 - a1 >= 0.5) {
      events.push({
        id:     'auto_mood',
        day:    14,
        text:   `Mood average improved from ${a1.toFixed(1)} → ${a2.toFixed(1)}`,
        isAuto: true,
      })
    }
  }

  // First zero-urge week
  for (let w = 1; w <= 12; w++) {
    const ws = (w - 1) * 7 + 1
    const we = w * 7
    const hasLogs       = sorted.some((l) => { const d = dayOf(l.log_date); return d >= ws && d <= we })
    const urgesThisWeek = urgeDates.filter((d) => { const day = dayOf(d); return day >= ws && day <= we })
    if (hasLogs && urgesThisWeek.length === 0) {
      events.push({ id: `auto_zero_w${w}`, day: we, text: `Week ${w}: Zero urges recorded — willpower strengthening`, isAuto: true })
      break
    }
  }

  // All 8 dimensions ≥ 7
  const allAbove = reflections.find((r) =>
    DIMENSIONS.every((d) => dimVal(r, d.key) >= 7)
  )
  if (allAbove) {
    events.push({
      id:     'auto_all7',
      day:    dayOf(allAbove.week_start_date) + 6,
      text:   'All 8 reflection dimensions above 7/10 — remarkable holistic growth',
      isAuto: true,
    })
  }

  return events.sort((a, b) => a.day - b.day)
}

const DEFAULT_RATINGS: Record<DimKey, number> = {
  mental_clarity: 5, emotional_stability: 5, spiritual_connection: 5, physical_energy: 5,
  skin_quality: 5, sleep_quality: 5, social_confidence: 5, eye_contact: 5,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingSlider({
  hi, en, value, onChange,
}: {
  hi: string; en: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs text-indigo-deep">
          <span className="font-devanagari">{hi}</span>
          <span className="text-twilight ml-1">({en})</span>
        </label>
        <span className="text-xs font-bold text-sacred-saffron w-5 text-right">{value}</span>
      </div>
      <div className="relative h-2 bg-sandstone rounded-full overflow-visible">
        <div
          className="absolute left-0 top-0 h-full bg-sacred-saffron rounded-full transition-all duration-150 pointer-events-none"
          style={{ width: `${(value / 10) * 100}%` }}
        />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

function ReflectionCard({
  row, isExpanded, onToggle,
}: {
  row: WeeklyRow; isExpanded: boolean; onToggle: () => void
}) {
  const avg = useMemo(() => {
    const vals = DIMENSIONS.map((d) => dimVal(row, d.key)).filter((v) => v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [row])

  return (
    <div className="rounded-card border border-sandstone bg-white/60 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <p className="font-semibold text-sm text-indigo-deep">
            <span className="font-devanagari">सप्ताह {row.week_number}</span>
            <span className="text-twilight ml-2 font-normal">{row.week_start_date}</span>
          </p>
          {avg !== null && (
            <p className="text-xs text-twilight mt-0.5">Avg: {avg.toFixed(1)}/10</p>
          )}
        </div>
        {isExpanded
          ? <ChevronUp  size={16} className="text-twilight shrink-0" />
          : <ChevronDown size={16} className="text-twilight shrink-0" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-sandstone/40 pt-3">
              {/* Mini rating bars */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {DIMENSIONS.map((d) => {
                  const v = dimVal(row, d.key)
                  return (
                    <div key={d.key}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-twilight">{d.en}</span>
                        <span className="text-sacred-saffron font-medium">{v || '—'}</span>
                      </div>
                      <div className="h-1.5 bg-sandstone rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sacred-saffron rounded-full"
                          style={{ width: `${v * 10}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {row.biggest_challenge && (
                <div>
                  <p className="text-xs font-semibold text-twilight mb-0.5">Biggest challenge</p>
                  <p className="text-sm text-indigo-deep">{row.biggest_challenge}</p>
                </div>
              )}
              {row.biggest_win && (
                <div>
                  <p className="text-xs font-semibold text-twilight mb-0.5">Biggest win</p>
                  <p className="text-sm text-indigo-deep">{row.biggest_win}</p>
                </div>
              )}
              {row.what_i_learned && (
                <div>
                  <p className="text-xs font-semibold text-twilight mb-0.5">What I learned</p>
                  <p className="text-sm text-indigo-deep">{row.what_i_learned}</p>
                </div>
              )}
              {row.free_reflection && (
                <div>
                  <p className="text-xs font-semibold text-twilight mb-0.5">Free reflection</p>
                  <p className="text-sm text-indigo-deep italic">{row.free_reflection}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChintanPage() {
  const [tab,     setTab]     = useState<Tab>('weekly')
  const [loading, setLoading] = useState(true)

  // Auth + remote data
  const [userId,         setUserId]         = useState<string | null>(null)
  const [startDate,      setStartDate]      = useState<string | null>(null)
  const [reflections,    setReflections]    = useState<WeeklyRow[]>([])
  const [dailyLogs,      setDailyLogs]      = useState<DailyRow[]>([])
  const [urgeDates,      setUrgeDates]      = useState<string[]>([])
  const [scriptureCount, setScriptureCount] = useState(0)

  // Weekly form
  const [ratings,   setRatings]   = useState<Record<DimKey, number>>({ ...DEFAULT_RATINGS })
  const [challenge, setChallenge] = useState('')
  const [win,       setWin]       = useState('')
  const [learned,   setLearned]   = useState('')
  const [freeText,  setFreeText]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [savedOk,   setSavedOk]   = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Journey
  const [selectedDim,   setSelectedDim]   = useState<DimKey>('mental_clarity')
  const [customEntries, setCustomEntries] = useState<TimelineEntry[]>([])
  const [newCustomText, setNewCustomText] = useState('')
  const [newCustomDay,  setNewCustomDay]  = useState<number | ''>('')
  const [showAddEntry,  setShowAddEntry]  = useState(false)

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_ENTRIES_KEY)
      if (raw) setCustomEntries(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const [
        { data: profile },
        { data: reflData },
        { data: logsData },
        { data: urgeData },
        { data: scriptureData },
      ] = await Promise.all([
        supabase.from('profiles').select('sadhana_start_date').eq('id', user.id).single(),
        supabase.from('weekly_reflections').select('*').eq('user_id', user.id).order('week_number'),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date'),
        supabase.from('urge_logs').select('logged_at').eq('user_id', user.id).order('logged_at').limit(500),
        supabase.from('scripture_progress').select('id').eq('user_id', user.id).eq('completed', true),
      ])

      const sd = profile?.sadhana_start_date ?? null
      setStartDate(sd)
      setReflections(reflData ?? [])
      setDailyLogs(logsData ?? [])
      setUrgeDates((urgeData ?? []).map((u) => u.logged_at.slice(0, 10)))
      setScriptureCount(scriptureData?.length ?? 0)

      // Pre-fill form if this week has a saved reflection
      const thisWeek = mondayOf(todayISO())
      const existing = reflData?.find((r) => r.week_start_date === thisWeek)
      if (existing) {
        setRatings({
          mental_clarity:       existing.mental_clarity       ?? 5,
          emotional_stability:  existing.emotional_stability  ?? 5,
          spiritual_connection: existing.spiritual_connection ?? 5,
          physical_energy:      existing.physical_energy      ?? 5,
          skin_quality:         existing.skin_quality         ?? 5,
          sleep_quality:        existing.sleep_quality        ?? 5,
          social_confidence:    existing.social_confidence    ?? 5,
          eye_contact:          existing.eye_contact          ?? 5,
        })
        setChallenge(existing.biggest_challenge ?? '')
        setWin(existing.biggest_win ?? '')
        setLearned(existing.what_i_learned ?? '')
        setFreeText(existing.free_reflection ?? '')
      }

      setLoading(false)
    })()
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveReflection = useCallback(async () => {
    if (!userId) return
    setSaving(true)
    const weekStart = mondayOf(todayISO())
    const weekNum   = sadhanaWeekNumber(startDate)

    const { data } = await supabase
      .from('weekly_reflections')
      .upsert(
        {
          user_id:          userId,
          week_number:      weekNum,
          week_start_date:  weekStart,
          ...ratings,
          biggest_challenge: challenge,
          biggest_win:       win,
          what_i_learned:    learned,
          free_reflection:   freeText || null,
        },
        { onConflict: 'user_id,week_start_date' }
      )
      .select()
      .single()

    if (data) {
      setReflections((prev) => {
        const idx = prev.findIndex((r) => r.week_start_date === weekStart)
        if (idx >= 0) {
          const u = [...prev]; u[idx] = data; return u
        }
        return [...prev, data].sort((a, b) => a.week_number - b.week_number)
      })
    }
    setSaving(false)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 2000)
  }, [userId, ratings, challenge, win, learned, freeText, startDate])

  // ── Derived data for Journey ───────────────────────────────────────────────
  const sorted = useMemo(
    () => [...reflections].sort((a, b) => a.week_number - b.week_number),
    [reflections]
  )

  const radarData = useMemo(() => {
    if (sorted.length < 2) return null
    const first  = sorted[0]
    const latest = sorted[sorted.length - 1]
    return DIMENSIONS.map((d) => ({
      axis:   d.short,
      week1:  dimVal(first, d.key),
      latest: dimVal(latest, d.key),
    }))
  }, [sorted])

  const trendData = useMemo(() =>
    sorted.map((r) => ({ label: `W${r.week_number}`, value: dimVal(r, selectedDim) }))
  , [sorted, selectedDim])

  const autoEvents = useMemo(() =>
    startDate ? generateAutoEvents(startDate, dailyLogs, urgeDates, sorted) : []
  , [startDate, dailyLogs, urgeDates, sorted])

  const allEvents = useMemo(() =>
    [...autoEvents, ...customEntries].sort((a, b) => a.day - b.day)
  , [autoEvents, customEntries])

  const compStats = useMemo(() => {
    const logs = [...dailyLogs].sort((a, b) => a.log_date.localeCompare(b.log_date))

    const moodW1  = logs.slice(0, 7) .filter((l) => l.mood_score !== null)
    const moodNow = logs.slice(-7)   .filter((l) => l.mood_score !== null)
    const startMood   = moodW1 .length ? moodW1 .reduce((s, l) => s + l.mood_score!, 0) / moodW1.length  : null
    const currentMood = moodNow.length ? moodNow.reduce((s, l) => s + l.mood_score!, 0) / moodNow.length : null

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const startUrge    = startDate
      ? urgeDates.filter((d) => d <= new Date(new Date(startDate).getTime() + 7 * 86400000).toISOString().slice(0, 10)).length
      : urgeDates.slice(0, 7).length
    const currentUrge  = urgeDates.filter((d) => d >= sevenDaysAgo).length

    const totalMedMins = dailyLogs.reduce((s, l) => s + (l.meditation_minutes ?? 0), 0)
    const streak       = computeStreak(dailyLogs)

    const isRemarkable = (
      (startMood !== null && currentMood !== null && currentMood - startMood >= 1) ||
      (startUrge >= 3 && currentUrge < startUrge * 0.5) ||
      totalMedMins / 60 > 10
    )

    return { startMood, currentMood, startUrge, currentUrge, totalMedMins, streak, isRemarkable }
  }, [dailyLogs, urgeDates, startDate])

  // ── Custom timeline entry ─────────────────────────────────────────────────
  const addCustomEntry = useCallback(() => {
    if (!newCustomText.trim() || !newCustomDay) return
    const entry: TimelineEntry = {
      id:     `custom_${Date.now()}`,
      day:    Number(newCustomDay),
      text:   newCustomText.trim(),
      isAuto: false,
    }
    const updated = [...customEntries, entry].sort((a, b) => a.day - b.day)
    setCustomEntries(updated)
    localStorage.setItem(CUSTOM_ENTRIES_KEY, JSON.stringify(updated))
    setNewCustomText('')
    setNewCustomDay('')
    setShowAddEntry(false)
  }, [customEntries, newCustomText, newCustomDay])

  const removeCustomEntry = useCallback((id: string) => {
    const updated = customEntries.filter((e) => e.id !== id)
    setCustomEntries(updated)
    localStorage.setItem(CUSTOM_ENTRIES_KEY, JSON.stringify(updated))
  }, [customEntries])

  const weekNum = sadhanaWeekNumber(startDate)
  const pastReflections = useMemo(
    () => [...reflections].sort((a, b) => b.week_number - a.week_number),
    [reflections]
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
          <h1 className="font-devanagari text-2xl text-indigo-deep">चिंतन</h1>
          <p className="text-xs text-twilight italic font-display">Reflection &amp; Transformation</p>
        </div>
        <div className="max-w-2xl mx-auto flex gap-1 px-4 pb-2">
          {(['weekly', 'journey'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-card text-xs font-medium transition-all font-devanagari ${
                tab === t ? 'bg-sacred-saffron text-dawn-white' : 'text-twilight hover:bg-sandstone'
              }`}
            >
              {t === 'weekly' ? 'साप्ताहिक चिंतन' : 'परिवर्तन यात्रा'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* ═══════════════════════════════════════════════════════════════
                WEEKLY REFLECTION
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'weekly' && (
              <>
                <div className="rounded-card border border-sandstone bg-white/60 p-5 shadow-warm-sm space-y-5">

                  <div>
                    <h2 className="font-devanagari text-lg text-indigo-deep leading-snug">
                      सप्ताह {weekNum} — चिंतन
                    </h2>
                    <p className="text-xs text-twilight">Week {weekNum} · {mondayOf(todayISO())}</p>
                  </div>

                  {/* ── Sliders ── */}
                  <div className="space-y-4">
                    {DIMENSIONS.map((d) => (
                      <RatingSlider
                        key={d.key}
                        hi={d.hi}
                        en={d.en}
                        value={ratings[d.key]}
                        onChange={(v) => setRatings((prev) => ({ ...prev, [d.key]: v }))}
                      />
                    ))}
                  </div>

                  {/* ── Text areas ── */}
                  {[
                    {
                      id: 'challenge',
                      label: 'इस सप्ताह की सबसे बड़ी चुनौती (Biggest challenge this week)',
                      value: challenge, set: setChallenge, rows: 2, required: true,
                    },
                    {
                      id: 'win',
                      label: 'इस सप्ताह की सबसे बड़ी जीत (Biggest win)',
                      value: win, set: setWin, rows: 2, required: true,
                    },
                    {
                      id: 'learned',
                      label: 'मैंने क्या सीखा (What I learned)',
                      value: learned, set: setLearned, rows: 2, required: true,
                    },
                    {
                      id: 'free',
                      label: 'स्वतंत्र चिंतन (Free reflection)',
                      value: freeText, set: setFreeText, rows: 4, required: false,
                    },
                  ].map(({ id, label, value, set, rows, required }) => (
                    <div key={id} className="space-y-1.5">
                      <label className="text-xs font-medium text-twilight font-devanagari">
                        {label}
                        {!required && <span className="ml-1 text-twilight/60 font-sans">— optional</span>}
                      </label>
                      <textarea
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        rows={rows}
                        className="w-full text-sm bg-sandstone/30 rounded-card px-3 py-2.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep resize-none"
                      />
                    </div>
                  ))}

                  <button
                    onClick={saveReflection}
                    disabled={saving}
                    className="w-full py-3 rounded-card bg-sacred-saffron text-dawn-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity font-devanagari"
                  >
                    {saving ? 'सहेज रहे हैं…' : savedOk ? 'सहेजा गया ✓' : 'सहेजें — Save Reflection'}
                  </button>
                </div>

                {/* Past reflections */}
                {!loading && pastReflections.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-twilight uppercase tracking-widest">Past Reflections</p>
                    {pastReflections.map((row) => (
                      <ReflectionCard
                        key={row.id}
                        row={row}
                        isExpanded={expandedId === row.id}
                        onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TRANSFORMATION JOURNEY
            ═══════════════════════════════════════════════════════════════ */}
            {tab === 'journey' && (
              <>
                {loading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-card bg-sandstone/40 h-48 animate-pulse" />
                  ))
                )}

                {/* ── 1. Radar Chart ── */}
                {!loading && (
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-sacred-saffron" />
                      <h2 className="text-sm font-semibold text-indigo-deep">
                        {sorted.length >= 2
                          ? `Week 1 vs Week ${sorted[sorted.length - 1].week_number} — Growth Radar`
                          : 'Growth Radar'}
                      </h2>
                    </div>

                    {radarData ? (
                      <>
                        <p className="text-xs text-twilight">
                          Expansion of the radar = measurable growth across all dimensions
                        </p>
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={radarData} margin={{ top: 12, right: 32, bottom: 12, left: 32 }}>
                            <PolarGrid stroke="#E8D5BE" />
                            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#5C4A32' }} />
                            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8, fill: '#8B7355' }} />
                            <Radar
                              name="Week 1"
                              dataKey="week1"
                              stroke="#C4A882"
                              fill="#C4A882"
                              fillOpacity={0.25}
                              strokeWidth={1.5}
                              strokeDasharray="4 2"
                            />
                            <Radar
                              name={`Week ${sorted[sorted.length - 1].week_number} (latest)`}
                              dataKey="latest"
                              stroke="#E8913A"
                              fill="#E8913A"
                              fillOpacity={0.38}
                              strokeWidth={2.5}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            <Tooltip
                              contentStyle={{
                                fontSize: 11,
                                background: '#FDF8F0',
                                border: '1px solid #E8D5BE',
                                borderRadius: 8,
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </>
                    ) : (
                      <div className="text-center py-10 space-y-2">
                        <p className="text-3xl">📊</p>
                        <p className="text-sm text-twilight">Complete 2 weekly reflections to see your growth radar.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 2. Dimension Trend ── */}
                {!loading && (
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={15} className="text-indigo-mid" />
                        <h2 className="text-sm font-semibold text-indigo-deep">Dimension Trend</h2>
                      </div>
                      <select
                        value={selectedDim}
                        onChange={(e) => setSelectedDim(e.target.value as DimKey)}
                        className="text-xs bg-sandstone/50 border border-sandstone rounded-card px-2 py-1.5 text-indigo-deep focus:outline-none focus:border-sacred-saffron"
                      >
                        {DIMENSIONS.map((d) => (
                          <option key={d.key} value={d.key}>{d.en}</option>
                        ))}
                      </select>
                    </div>

                    {trendData.length === 0 ? (
                      <p className="text-xs text-center text-twilight py-6">
                        Save weekly reflections to see trends over time.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8B7355' }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#8B7355' }} />
                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              background: '#FDF8F0',
                              border: '1px solid #E8D5BE',
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#E8913A"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#E8913A', strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                            name={DIMENSIONS.find((d) => d.key === selectedDim)?.en}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* ── 3. Compounding Effects Timeline ── */}
                {!loading && (
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-indigo-deep">Compounding Effects</h2>
                      <button
                        onClick={() => setShowAddEntry((v) => !v)}
                        className="flex items-center gap-1 text-xs text-indigo-mid hover:text-sacred-saffron transition-colors"
                      >
                        <Plus size={12} /> Add entry
                      </button>
                    </div>

                    <AnimatePresence>
                      {showAddEntry && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 items-end p-3 bg-sandstone/30 rounded-card">
                            <div className="w-16">
                              <label className="text-xs text-twilight block mb-1">Day</label>
                              <input
                                type="number"
                                min={1}
                                value={newCustomDay}
                                onChange={(e) => setNewCustomDay(e.target.value ? Number(e.target.value) : '')}
                                className="w-full text-sm bg-white border border-sandstone rounded-card px-2 py-1.5 focus:outline-none focus:border-sacred-saffron text-indigo-deep"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-twilight block mb-1">Entry</label>
                              <input
                                value={newCustomText}
                                onChange={(e) => setNewCustomText(e.target.value)}
                                placeholder="e.g. Day 25: Someone complimented my skin today"
                                className="w-full text-sm bg-white border border-sandstone rounded-card px-2 py-1.5 focus:outline-none focus:border-sacred-saffron text-indigo-deep"
                              />
                            </div>
                            <button
                              onClick={addCustomEntry}
                              className="px-3 py-1.5 bg-sacred-saffron text-dawn-white text-xs font-medium rounded-card hover:opacity-90 shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {allEvents.length === 0 ? (
                      <p className="text-xs text-twilight text-center py-6">
                        Timeline events appear automatically as you build your sadhana history.
                        <br />
                        <span className="text-twilight/60">You can also add your own milestone entries above.</span>
                      </p>
                    ) : (
                      <div className="relative pl-7 space-y-6">
                        {/* Vertical saffron line */}
                        <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-sacred-saffron via-sacred-saffron/50 to-sacred-saffron/20 rounded-full" />

                        {allEvents.map((entry, i) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="relative flex gap-3 items-start group"
                          >
                            {/* Dot on timeline */}
                            <div className={`absolute -left-4 mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                              entry.isAuto
                                ? 'bg-sacred-saffron border-sacred-saffron shadow-sm'
                                : 'bg-parchment border-indigo-mid'
                            }`}>
                              {entry.isAuto && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-sacred-saffron">Day {entry.day}</span>
                              <p className="text-sm text-indigo-deep leading-snug mt-0.5">{entry.text}</p>
                            </div>

                            {!entry.isAuto && (
                              <button
                                onClick={() => removeCustomEntry(entry.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-twilight/40 hover:text-rose-red text-base leading-none mt-0.5 shrink-0"
                                aria-label="Remove"
                              >
                                ×
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4. Day 1 vs Today ── */}
                {!loading && (
                  <div className={`rounded-card border p-5 space-y-4 ${
                    compStats.isRemarkable
                      ? 'bg-amber-50/80 border-temple-gold shadow-gold-glow'
                      : 'bg-white/60 border-sandstone shadow-warm-sm'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Trophy
                        size={16}
                        className={compStats.isRemarkable ? 'text-temple-gold' : 'text-twilight'}
                      />
                      <h2 className="text-sm font-semibold text-indigo-deep">Day 1 You vs Today You</h2>
                      {compStats.isRemarkable && (
                        <span className="ml-auto text-xs font-bold text-temple-gold">🔥 Remarkable Growth</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        {
                          label:  'Mood Average',
                          before: compStats.startMood   !== null ? `${compStats.startMood.toFixed(1)}/5`   : '—',
                          after:  compStats.currentMood !== null ? `${compStats.currentMood.toFixed(1)}/5` : '—',
                          up:     compStats.currentMood !== null && compStats.startMood !== null && compStats.currentMood > compStats.startMood,
                        },
                        {
                          label:  'Urges / Week',
                          before: String(compStats.startUrge),
                          after:  String(compStats.currentUrge),
                          up:     compStats.currentUrge < compStats.startUrge,
                        },
                        {
                          label:  'Meditation',
                          before: '0 h',
                          after:  `${Math.floor(compStats.totalMedMins / 60)}h ${compStats.totalMedMins % 60}m`,
                          up:     compStats.totalMedMins > 0,
                        },
                        {
                          label:  'Shlokas Studied',
                          before: '0',
                          after:  String(scriptureCount),
                          up:     scriptureCount > 0,
                        },
                        {
                          label:  'Current Streak',
                          before: '0 days',
                          after:  `${compStats.streak} days`,
                          up:     compStats.streak > 0,
                        },
                        {
                          label:  'Reflections',
                          before: '0',
                          after:  String(reflections.length),
                          up:     reflections.length > 0,
                        },
                      ].map(({ label, before, after, up }) => (
                        <div
                          key={label}
                          className="rounded-card bg-parchment/80 border border-sandstone/60 p-3 space-y-1.5"
                        >
                          <p className="text-xs text-twilight">{label}</p>
                          <div className="space-y-0.5">
                            <p className="text-xs text-twilight/50 line-through">{before}</p>
                            <p className={`text-sm font-bold ${up ? 'text-sacred-saffron' : 'text-indigo-deep'}`}>
                              {after}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {dailyLogs.length === 0 && reflections.length === 0 && (
                      <p className="text-xs text-twilight/60 text-center mt-2">
                        Start logging daily and saving weekly reflections to see your transformation here.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
