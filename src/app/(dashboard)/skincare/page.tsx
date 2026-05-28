'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Sun, Moon,
  Sparkles, Droplets, BookOpen, Leaf,
} from 'lucide-react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { ProgressRing } from '@/components/ui/ProgressRing'
import type { Database } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'routine' | 'tracker' | 'journal' | 'tips'

interface RoutineStep {
  id: string
  name: string
  product: string
}

interface DailyChecks {
  morning: Record<string, boolean>
  evening: Record<string, boolean>
}

interface SkinEntry {
  id: string
  date: string          // ISO date
  weekStart: string     // ISO date of Monday
  quality: number       // 1–10
  notes: string
  photoUrl?: string
}

type WeeklyRow = Database['public']['Tables']['weekly_reflections']['Row']
type DailyRow  = Database['public']['Tables']['daily_logs']['Row']

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUTINE_KEY  = 'sadhanaos_skincare_routine'
const JOURNAL_KEY  = 'sadhanaos_skin_journal'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function checksKey(date: string) {
  return `sadhanaos_skincare_today_${date}`
}

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function weekNumber(dateStr: string): number {
  const d    = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
}

function faceIcon(q: number) {
  if (q >= 9) return '🌟'
  if (q >= 7) return '😊'
  if (q >= 5) return '😐'
  if (q >= 3) return '😕'
  return '😟'
}

const DEFAULT_MORNING: RoutineStep[] = [
  { id: 'm1', name: 'Face Wash',   product: '' },
  { id: 'm2', name: 'Toner',       product: '' },
  { id: 'm3', name: 'Moisturizer', product: '' },
  { id: 'm4', name: 'Sunscreen',   product: '' },
  { id: 'm5', name: 'Lip Balm',    product: '' },
]

const DEFAULT_EVENING: RoutineStep[] = [
  { id: 'e1', name: 'Oil Cleanse',  product: '' },
  { id: 'e2', name: 'Face Wash',    product: '' },
  { id: 'e3', name: 'Serum',        product: '' },
  { id: 'e4', name: 'Night Cream',  product: '' },
  { id: 'e5', name: 'Lip Balm',     product: '' },
]

interface TipCard {
  title: string
  body: string
  concern: string[]
  emoji: string
}

const AYURVEDA_TIPS: TipCard[] = [
  {
    emoji: '🌿',
    title: 'Turmeric & Curd Mask',
    body: 'Mix ½ tsp turmeric with 2 tbsp plain curd. Apply for 15 min, then rinse with cool water. Rich in curcumin — reduces redness, brightens skin. Use 2× weekly.',
    concern: ['acne', 'glow', 'dark circles'],
  },
  {
    emoji: '🍋',
    title: 'Warm Lemon Water (Morning)',
    body: 'Drink 1 glass warm water with ½ lemon on empty stomach. Flushes toxins, boosts vitamin C, improves complexion from within. Ayurvedic ushna jala practice.',
    concern: ['glow', 'acne'],
  },
  {
    emoji: '🪴',
    title: 'Aloe Vera Overnight Gel',
    body: 'Apply fresh aloe vera pulp as a thin night layer. Deeply hydrating, anti-inflammatory. Reduces pigmentation with regular use. Rinse in the morning.',
    concern: ['dryness', 'dark circles', 'glow'],
  },
  {
    emoji: '🌱',
    title: 'Neem Water Face Wash',
    body: 'Boil 10–12 neem leaves in 500ml water. Cool, strain, use as a face rinse after cleansing. Natural antibacterial — controls breakouts and excess sebum.',
    concern: ['acne'],
  },
  {
    emoji: '🥛',
    title: 'Raw Milk & Rose Water Toner',
    body: 'Mix equal parts raw cold milk and rose water. Apply with cotton, let absorb. Gently exfoliates dead skin (lactic acid), tones pores, reduces redness.',
    concern: ['dryness', 'glow'],
  },
  {
    emoji: '🫚',
    title: 'Sesame Oil Abhyanga (Face)',
    body: 'Warm 3–4 drops sesame oil, massage face in upward circles for 2 minutes before showering. Vata-pacifying, deeply nourishing. Balances dry, flaky skin.',
    concern: ['dryness'],
  },
  {
    emoji: '🍵',
    title: 'Green Tea Ice Cube',
    body: 'Freeze brewed green tea in ice cube trays. Rub a cube under eyes for 1–2 min each morning. Antioxidants reduce puffiness and dark circles rapidly.',
    concern: ['dark circles'],
  },
  {
    emoji: '🌺',
    title: 'Saffron & Honey Spot Treatment',
    body: 'Soak 2–3 saffron strands in 1 tsp raw honey overnight. Dab on dark spots before bed. Kesar (saffron) is a premier Ayurvedic brightener — use consistently.',
    concern: ['dark circles', 'glow'],
  },
]

const CONCERN_LABELS: Record<string, string> = {
  all:          'All',
  acne:         '🔴 Acne',
  dryness:      '💧 Dryness',
  glow:         '✨ Glow',
  'dark circles': '🌑 Dark Circles',
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function readRoutine(): { morning: RoutineStep[]; evening: RoutineStep[] } {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { morning: DEFAULT_MORNING, evening: DEFAULT_EVENING }
}

function writeRoutine(r: { morning: RoutineStep[]; evening: RoutineStep[] }) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(r))
}

function readChecks(): DailyChecks {
  try {
    const raw = localStorage.getItem(checksKey(todayISO()))
    if (raw) return JSON.parse(raw)
  } catch {}
  return { morning: {}, evening: {} }
}

function writeChecks(c: DailyChecks) {
  localStorage.setItem(checksKey(todayISO()), JSON.stringify(c))
}

function readJournal(): SkinEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function writeJournal(entries: SkinEntry[]) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({
  step, index, total, onChange, onDelete, onMove,
}: {
  step:     RoutineStep
  index:    number
  total:    number
  onChange: (id: string, field: 'name' | 'product', val: string) => void
  onDelete: (id: string) => void
  onMove:   (id: string, dir: -1 | 1) => void
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-sandstone/40 last:border-0">
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMove(step.id, -1)}
          disabled={index === 0}
          className="text-twilight/50 hover:text-indigo-deep disabled:opacity-20 transition-colors"
          aria-label="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMove(step.id, 1)}
          disabled={index === total - 1}
          className="text-twilight/50 hover:text-indigo-deep disabled:opacity-20 transition-colors"
          aria-label="Move down"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <input
          value={step.name}
          onChange={(e) => onChange(step.id, 'name', e.target.value)}
          placeholder="Step name"
          className="text-sm bg-sandstone/30 rounded-card px-2.5 py-1.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep"
        />
        <input
          value={step.product}
          onChange={(e) => onChange(step.id, 'product', e.target.value)}
          placeholder="Product (optional)"
          className="text-sm bg-sandstone/30 rounded-card px-2.5 py-1.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep"
        />
      </div>
      <button
        onClick={() => onDelete(step.id)}
        className="text-twilight/40 hover:text-rose-red transition-colors shrink-0"
        aria-label="Delete step"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SkincarePage() {
  const [tab, setTab] = useState<Tab>('tracker')

  // Routine
  const [routine, setRoutine] = useState<{ morning: RoutineStep[]; evening: RoutineStep[] }>({ morning: DEFAULT_MORNING, evening: DEFAULT_EVENING })
  const [routineSection, setRoutineSection] = useState<'morning' | 'evening'>('morning')
  const [routineSaved, setRoutineSaved] = useState(false)

  // Tracker
  const [checks, setChecks]   = useState<DailyChecks>({ morning: {}, evening: {} })
  const [userId, setUserId]   = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Journal
  const [journal, setJournal]   = useState<SkinEntry[]>([])
  const [newQuality, setQuality] = useState(7)
  const [newNotes, setNotes]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [compareWeeks, setCompare] = useState<[string, string] | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  // Correlation
  const [corrData, setCorrData] = useState<{ label: string; skin: number; water: number; sleep: number }[]>([])

  // Tips filter
  const [concern, setConcern] = useState<string>('all')

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setRoutine(readRoutine())
    setChecks(readChecks())
    setJournal(readJournal())
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Load weekly reflections for correlation (last 8 weeks)
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
      const { data: weeks } = await supabase
        .from('weekly_reflections')
        .select('week_start_date, skin_quality, week_number')
        .eq('user_id', user.id)
        .gte('week_start_date', eightWeeksAgo.toISOString().slice(0, 10))
        .order('week_start_date')

      // Load daily logs for water/sleep correlation
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('log_date, water_glasses, sleep_hours')
        .eq('user_id', user.id)
        .gte('log_date', eightWeeksAgo.toISOString().slice(0, 10))
        .order('log_date')

      if (weeks && logs) {
        // Aggregate daily logs by week
        const weekMap: Record<string, { water: number[]; sleep: number[] }> = {}
        for (const log of logs) {
          const wk = mondayOf(log.log_date)
          if (!weekMap[wk]) weekMap[wk] = { water: [], sleep: [] }
          if (log.water_glasses) weekMap[wk].water.push(log.water_glasses)
          if (log.sleep_hours)   weekMap[wk].sleep.push(log.sleep_hours)
        }

        const chart = weeks
          .filter((w) => w.skin_quality != null)
          .map((w) => {
            const agg = weekMap[w.week_start_date]
            const avgWater = agg?.water.length
              ? agg.water.reduce((a, b) => a + b, 0) / agg.water.length
              : 0
            const avgSleep = agg?.sleep.length
              ? agg.sleep.reduce((a, b) => a + b, 0) / agg.sleep.length
              : 0
            return {
              label:  `W${w.week_number}`,
              skin:   w.skin_quality!,
              water:  Math.round(avgWater * 10) / 10,
              sleep:  Math.round(avgSleep * 10) / 10,
            }
          })
        setCorrData(chart)
      }
    })()
  }, [])

  // ── Routine helpers ───────────────────────────────────────────────────────────
  const saveRoutine = useCallback(() => {
    writeRoutine(routine)
    setRoutineSaved(true)
    setTimeout(() => setRoutineSaved(false), 1800)
  }, [routine])

  const addStep = useCallback((section: 'morning' | 'evening') => {
    const id = `${section[0]}${Date.now()}`
    setRoutine((prev) => ({
      ...prev,
      [section]: [...prev[section], { id, name: '', product: '' }],
    }))
  }, [])

  const updateStep = useCallback((
    section: 'morning' | 'evening',
    id: string,
    field: 'name' | 'product',
    val: string
  ) => {
    setRoutine((prev) => ({
      ...prev,
      [section]: prev[section].map((s) => s.id === id ? { ...s, [field]: val } : s),
    }))
  }, [])

  const deleteStep = useCallback((section: 'morning' | 'evening', id: string) => {
    setRoutine((prev) => ({
      ...prev,
      [section]: prev[section].filter((s) => s.id !== id),
    }))
  }, [])

  const moveStep = useCallback((section: 'morning' | 'evening', id: string, dir: -1 | 1) => {
    setRoutine((prev) => {
      const arr  = [...prev[section]]
      const idx  = arr.findIndex((s) => s.id === id)
      const next = idx + dir
      if (next < 0 || next >= arr.length) return prev
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return { ...prev, [section]: arr }
    })
  }, [])

  // ── Tracker helpers ───────────────────────────────────────────────────────────
  const toggleCheck = useCallback(async (section: 'morning' | 'evening', stepId: string) => {
    const updated: DailyChecks = {
      ...checks,
      [section]: { ...checks[section], [stepId]: !checks[section][stepId] },
    }
    setChecks(updated)
    writeChecks(updated)

    const steps   = section === 'morning' ? routine.morning : routine.evening
    const allDone = steps.every((s) => updated[section][s.id])
    if (allDone && userId) {
      setSyncing(true)
      if (section === 'morning') {
        await supabase.from('daily_logs').upsert(
          { user_id: userId, log_date: todayISO(), skincare_morning: true },
          { onConflict: 'user_id,log_date' }
        )
      } else {
        await supabase.from('daily_logs').upsert(
          { user_id: userId, log_date: todayISO(), skincare_evening: true },
          { onConflict: 'user_id,log_date' }
        )
      }
      setSyncing(false)
    }
  }, [checks, routine, userId])

  const morningDone = useMemo(() => {
    const steps = routine.morning
    if (!steps.length) return 0
    return steps.filter((s) => checks.morning[s.id]).length
  }, [checks, routine])

  const eveningDone = useMemo(() => {
    const steps = routine.evening
    if (!steps.length) return 0
    return steps.filter((s) => checks.evening[s.id]).length
  }, [checks, routine])

  // ── Journal helpers ───────────────────────────────────────────────────────────
  const uploadPhoto = useCallback(async (file: File, entryId: string): Promise<string | undefined> => {
    if (!userId) return undefined
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `skin-journal/${userId}/${entryId}.${ext}`
    const { error } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: true })
    if (error) return undefined
    const { data } = supabase.storage.from('user-uploads').getPublicUrl(path)
    return data.publicUrl
  }, [userId])

  const saveJournalEntry = useCallback(async () => {
    if (!newNotes.trim() && newQuality === 0) return
    setUploading(true)
    const id       = `skin_${Date.now()}`
    const today    = todayISO()
    let   photoUrl: string | undefined

    if (photoFile && userId) {
      photoUrl = await uploadPhoto(photoFile, id)
    }

    const entry: SkinEntry = {
      id,
      date:      today,
      weekStart: mondayOf(today),
      quality:   newQuality,
      notes:     newNotes,
      photoUrl,
    }

    // Also upsert skin_quality into weekly_reflections
    if (userId) {
      const wkNum   = weekNumber(today)
      const wkStart = mondayOf(today)
      await supabase.from('weekly_reflections').upsert(
        { user_id: userId, week_number: wkNum, week_start_date: wkStart, skin_quality: newQuality },
        { onConflict: 'user_id,week_start_date' }
      )
    }

    const updated = [entry, ...journal]
    setJournal(updated)
    writeJournal(updated)
    setNotes('')
    setQuality(7)
    setPhotoFile(null)
    if (photoRef.current) photoRef.current.value = ''
    setUploading(false)
  }, [newQuality, newNotes, photoFile, journal, userId, uploadPhoto])

  // Group journal entries by week for compare
  const journalByWeek = useMemo(() => {
    const map: Record<string, SkinEntry[]> = {}
    for (const e of journal) {
      if (!map[e.weekStart]) map[e.weekStart] = []
      map[e.weekStart].push(e)
    }
    return map
  }, [journal])

  const weekKeys = useMemo(() =>
    Object.keys(journalByWeek).sort().reverse()
  , [journalByWeek])

  // Correlation insight
  const corrInsight = useMemo(() => {
    if (corrData.length < 3) return null
    const highWater = corrData.filter((d) => d.water >= 8)
    const lowWater  = corrData.filter((d) => d.water < 8)
    if (!highWater.length || !lowWater.length) return null
    const avgHigh = highWater.reduce((a, b) => a + b.skin, 0) / highWater.length
    const avgLow  = lowWater.reduce((a, b) => a + b.skin, 0) / lowWater.length
    if (avgHigh - avgLow >= 1) {
      return `Weeks with 8+ glasses of water → avg skin quality ${avgHigh.toFixed(1)} vs ${avgLow.toFixed(1)}`
    }
    return null
  }, [corrData])

  const filteredTips = useMemo(() =>
    concern === 'all' ? AYURVEDA_TIPS : AYURVEDA_TIPS.filter((t) => t.concern.includes(concern))
  , [concern])

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tracker', label: 'Tracker',  icon: <Sparkles size={14} /> },
    { key: 'routine', label: 'Routine',  icon: <Sun size={14} /> },
    { key: 'journal', label: 'Journal',  icon: <BookOpen size={14} /> },
    { key: 'tips',    label: 'Ayurveda', icon: <Leaf size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
          <h1 className="font-devanagari text-2xl text-indigo-deep">रूप साधना</h1>
          <p className="text-xs text-twilight italic font-display">
            Caring for the body is caring for the temple.
          </p>
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto flex gap-1 px-4 pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                tab === t.key
                  ? 'bg-sacred-saffron text-dawn-white'
                  : 'text-twilight hover:bg-sandstone'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >

            {/* ═══ TRACKER ═════════════════════════════════════════════════════ */}
            {tab === 'tracker' && (
              <div className="space-y-6">
                {/* Progress rings */}
                <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm">
                  <h2 className="text-sm font-semibold text-indigo-deep mb-4">Today&apos;s Progress</h2>
                  <div className="flex justify-around">
                    <ProgressRing
                      value={morningDone}
                      max={routine.morning.length || 1}
                      size={88}
                      strokeWidth={7}
                      color="#E8913A"
                      label="Morning"
                    >
                      <span className="text-sm font-semibold text-indigo-deep">
                        {morningDone}/{routine.morning.length}
                      </span>
                    </ProgressRing>
                    <ProgressRing
                      value={eveningDone}
                      max={routine.evening.length || 1}
                      size={88}
                      strokeWidth={7}
                      color="#7B5EA7"
                      label="Evening"
                    >
                      <span className="text-sm font-semibold text-indigo-deep">
                        {eveningDone}/{routine.evening.length}
                      </span>
                    </ProgressRing>
                  </div>
                  {morningDone === routine.morning.length && routine.morning.length > 0 && (
                    <p className="text-center text-xs text-sacred-saffron mt-3 font-medium">
                      Morning routine complete ✨
                    </p>
                  )}
                  {eveningDone === routine.evening.length && routine.evening.length > 0 && (
                    <p className="text-center text-xs text-indigo-mid mt-1 font-medium">
                      Evening routine complete 🌙
                    </p>
                  )}
                  {syncing && (
                    <p className="text-center text-xs text-twilight mt-2">Syncing…</p>
                  )}
                </div>

                {/* Morning checklist */}
                <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-sacred-saffron" />
                    <h2 className="text-sm font-semibold text-indigo-deep">Morning Routine</h2>
                  </div>
                  {routine.morning.map((step) => (
                    <label key={step.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!checks.morning[step.id]}
                        onChange={() => toggleCheck('morning', step.id)}
                        className="w-4 h-4 rounded accent-sacred-saffron"
                      />
                      <div className="flex-1">
                        <span className={`text-sm transition-colors ${checks.morning[step.id] ? 'line-through text-twilight/50' : 'text-indigo-deep'}`}>
                          {step.name || '—'}
                        </span>
                        {step.product && (
                          <span className="ml-2 text-xs text-twilight/60 italic">{step.product}</span>
                        )}
                      </div>
                    </label>
                  ))}
                  {routine.morning.length === 0 && (
                    <p className="text-xs text-twilight text-center py-2">No steps — add them in Routine tab.</p>
                  )}
                </div>

                {/* Evening checklist */}
                <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-indigo-mid" />
                    <h2 className="text-sm font-semibold text-indigo-deep">Evening Routine</h2>
                  </div>
                  {routine.evening.map((step) => (
                    <label key={step.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checks.evening[step.id]}
                        onChange={() => toggleCheck('evening', step.id)}
                        className="w-4 h-4 rounded accent-indigo-mid"
                      />
                      <div className="flex-1">
                        <span className={`text-sm transition-colors ${checks.evening[step.id] ? 'line-through text-twilight/50' : 'text-indigo-deep'}`}>
                          {step.name || '—'}
                        </span>
                        {step.product && (
                          <span className="ml-2 text-xs text-twilight/60 italic">{step.product}</span>
                        )}
                      </div>
                    </label>
                  ))}
                  {routine.evening.length === 0 && (
                    <p className="text-xs text-twilight text-center py-2">No steps — add them in Routine tab.</p>
                  )}
                </div>

                {/* Water & Sleep Correlation */}
                {corrData.length >= 2 && (
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Droplets size={16} className="text-indigo-mid" />
                      <h2 className="text-sm font-semibold text-indigo-deep">Skin · Water · Sleep</h2>
                    </div>
                    {corrInsight && (
                      <p className="text-xs text-sacred-saffron bg-sacred-saffron/10 rounded-card px-3 py-2">
                        💡 {corrInsight}
                      </p>
                    )}
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={corrData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8B7355' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} domain={[0, 10]} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
                        />
                        <Bar    dataKey="water" name="Water (glasses)" fill="#7B9FCC" opacity={0.6} radius={[3, 3, 0, 0]} />
                        <Line  dataKey="skin"  name="Skin quality"    stroke="#E8913A" strokeWidth={2} dot={{ r: 3, fill: '#E8913A' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-twilight/70 text-center">Weekly averages — skin quality (1–10) vs water intake</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ROUTINE BUILDER ═════════════════════════════════════════════ */}
            {tab === 'routine' && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  {(['morning', 'evening'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setRoutineSection(s)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-card text-sm font-medium transition-all ${
                        routineSection === s
                          ? s === 'morning'
                            ? 'bg-sacred-saffron text-dawn-white'
                            : 'bg-indigo-deep text-dawn-white'
                          : 'bg-sandstone text-twilight hover:bg-sandstone/60'
                      }`}
                    >
                      {s === 'morning' ? <Sun size={14} /> : <Moon size={14} />}
                      {s === 'morning' ? 'Morning' : 'Evening'}
                    </button>
                  ))}
                </div>

                <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-1">
                  <p className="text-xs text-twilight mb-3">
                    Drag to reorder · Edit step name and product · changes save manually
                  </p>
                  {routine[routineSection].map((step, i) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      index={i}
                      total={routine[routineSection].length}
                      onChange={(id, field, val) => updateStep(routineSection, id, field, val)}
                      onDelete={(id) => deleteStep(routineSection, id)}
                      onMove={(id, dir) => moveStep(routineSection, id, dir)}
                    />
                  ))}
                  <button
                    onClick={() => addStep(routineSection)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-indigo-mid hover:text-sacred-saffron transition-colors font-medium"
                  >
                    <Plus size={13} /> Add Step
                  </button>
                </div>

                <button
                  onClick={saveRoutine}
                  className="w-full py-2.5 rounded-card bg-sacred-saffron text-dawn-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {routineSaved ? 'Saved ✓' : 'Save Routine'}
                </button>
                <p className="text-xs text-twilight text-center">
                  Routine is saved locally on this device. Changes to steps take effect in Tracker immediately.
                </p>
              </div>
            )}

            {/* ═══ SKIN JOURNAL ════════════════════════════════════════════════ */}
            {tab === 'journal' && (
              <div className="space-y-6">

                {/* New Entry Form */}
                <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-4">
                  <h2 className="text-sm font-semibold text-indigo-deep">Today&apos;s Skin Log</h2>

                  {/* Quality slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-twilight">Skin Quality</label>
                      <span className="text-2xl">{faceIcon(newQuality)}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={newQuality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-sacred-saffron"
                    />
                    <div className="flex justify-between text-xs text-twilight/60">
                      <span>1 — Terrible</span>
                      <span className="font-semibold text-sacred-saffron text-sm">{newQuality}/10</span>
                      <span>10 — Glowing</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How does your skin feel today? Any breakouts, dryness, or glow?"
                    rows={3}
                    className="w-full text-sm bg-sandstone/30 rounded-card px-3 py-2.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep resize-none"
                  />

                  {/* Photo upload */}
                  <div>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="text-xs text-indigo-mid hover:text-sacred-saffron transition-colors"
                    >
                      {photoFile ? `📷 ${photoFile.name}` : '+ Add selfie (optional)'}
                    </button>
                  </div>

                  <button
                    onClick={saveJournalEntry}
                    disabled={uploading || (!newNotes.trim())}
                    className="w-full py-2.5 rounded-card bg-sacred-saffron text-dawn-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {uploading ? 'Saving…' : 'Log Entry'}
                  </button>
                </div>

                {/* Compare toggle */}
                {weekKeys.length >= 2 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-twilight uppercase tracking-widest">Compare Weeks</p>
                    <button
                      onClick={() =>
                        setCompare(
                          compareWeeks
                            ? null
                            : [weekKeys[weekKeys.length - 1], weekKeys[0]]
                        )
                      }
                      className="text-xs text-indigo-mid hover:text-sacred-saffron transition-colors"
                    >
                      {compareWeeks ? 'Hide compare' : 'Week 1 vs Latest →'}
                    </button>
                  </div>
                )}

                {/* Side-by-side compare */}
                {compareWeeks && (
                  <div className="grid grid-cols-2 gap-3">
                    {compareWeeks.map((wk) => {
                      const entries = journalByWeek[wk] ?? []
                      const avgQ    = entries.length
                        ? entries.reduce((a, e) => a + e.quality, 0) / entries.length
                        : 0
                      return (
                        <div key={wk} className="rounded-card bg-white/60 border border-sandstone p-3 space-y-2">
                          <p className="text-xs font-semibold text-indigo-deep">{wk}</p>
                          <p className="text-2xl">{faceIcon(Math.round(avgQ))}</p>
                          <p className="text-xs text-twilight">Avg: {avgQ.toFixed(1)}/10</p>
                          {entries[0]?.photoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entries[0].photoUrl}
                              alt="Skin selfie"
                              className="w-full h-24 object-cover rounded-card"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Timeline */}
                {journal.length === 0 ? (
                  <p className="text-center text-twilight text-sm py-8">No journal entries yet.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-twilight uppercase tracking-widest">Timeline</p>
                    {journal.slice(0, 20).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-card bg-white/60 border border-sandstone p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-twilight">{entry.date}</p>
                          <span className="text-lg">{faceIcon(entry.quality)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-sandstone rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sacred-saffron rounded-full"
                              style={{ width: `${entry.quality * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-sacred-saffron w-8 text-right">
                            {entry.quality}/10
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-twilight leading-relaxed">{entry.notes}</p>
                        )}
                        {entry.photoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.photoUrl}
                            alt="Skin selfie"
                            className="w-full h-32 object-cover rounded-card mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ AYURVEDA TIPS ═══════════════════════════════════════════════ */}
            {tab === 'tips' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-twilight uppercase tracking-widest mb-3">Filter by Concern</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CONCERN_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setConcern(key)}
                        className={`px-3 py-1 rounded-card text-xs font-medium transition-all ${
                          concern === key
                            ? 'bg-indigo-deep text-dawn-white'
                            : 'bg-sandstone text-twilight hover:bg-sandstone/60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTips.map((tip) => (
                    <div
                      key={tip.title}
                      className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none mt-0.5">{tip.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm text-indigo-deep">{tip.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tip.concern.map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 bg-sandstone text-twilight rounded text-xs"
                              >
                                {CONCERN_LABELS[c] ?? c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-twilight leading-relaxed">{tip.body}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-card bg-sage-green/10 border border-sage-green/30 p-4">
                  <p className="text-xs text-twilight leading-relaxed">
                    <span className="font-semibold text-sage-green">Brahmacharya & skin:</span>{' '}
                    Conservation of vital energy (ojas) is reflected in clear, radiant skin.
                    Consistent sadhana, adequate sleep, and hydration compound over weeks.
                    Track your streaks alongside skin quality to see the correlation.
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
