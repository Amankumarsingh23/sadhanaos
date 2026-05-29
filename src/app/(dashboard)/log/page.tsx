'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CalendarDays,
  Brain, Wind, Heart, Dumbbell, Sun, Moon, Droplets,
  Minus, Plus, ChevronDown, Save,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { QuickLogCard } from '@/components/sacred/QuickLogCard'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Toaster } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileRow  = Database['public']['Tables']['profiles']['Row']
type DailyLogRow = Database['public']['Tables']['daily_logs']['Row']

// ── Form shape ─────────────────────────────────────────────────────────────
interface LogForm {
  streak_maintained:  boolean
  fall_reflection:    string
  meditation_minutes: number
  pranayama_done:     boolean
  pranayama_type:     string
  prayers_completed:  string[]
  exercise_done:      boolean
  skincare_morning:   boolean
  skincare_evening:   boolean
  water_glasses:      number
  mood_score:         number | null
  energy_score:       number | null
  clarity_score:      number | null
  confidence_score:   number | null
  gratitude_1:        string
  gratitude_2:        string
  gratitude_3:        string
  journal_entry:      string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0] }

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDisplay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function logToForm(log: DailyLogRow | null): LogForm {
  const prayers = Array.isArray(log?.prayers_completed)
    ? (log.prayers_completed as string[])
    : log?.prayers_completed ? ['done'] : []
  return {
    streak_maintained:  log?.streak_maintained  ?? true,
    fall_reflection:    log?.notes              ?? '',
    meditation_minutes: log?.meditation_minutes ?? 0,
    pranayama_done:     log?.pranayama_done     ?? false,
    pranayama_type:     log?.pranayama_type     ?? '',
    prayers_completed:  prayers,
    exercise_done:      log?.exercise_done      ?? false,
    skincare_morning:   log?.skincare_morning   ?? false,
    skincare_evening:   log?.skincare_evening   ?? false,
    water_glasses:      log?.water_glasses      ?? 0,
    mood_score:         log?.mood_score         ?? null,
    energy_score:       log?.energy_score       ?? null,
    clarity_score:      log?.clarity_score      ?? null,
    confidence_score:   log?.confidence_score   ?? null,
    gratitude_1:        log?.gratitude_1        ?? '',
    gratitude_2:        log?.gratitude_2        ?? '',
    gratitude_3:        log?.gratitude_3        ?? '',
    journal_entry:      log?.journal_entry      ?? '',
  }
}

function extractPrayerTimes(profile: ProfileRow | null): string[] {
  const ps = profile?.prayer_schedule
  if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
    const pso = ps as Record<string, unknown>
    if (Array.isArray(pso.times)) return pso.times as string[]
  }
  return []
}

function extractMeditationTarget(profile: ProfileRow | null): number {
  const ps = profile?.prayer_schedule
  if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
    const pso = ps as Record<string, unknown>
    if (pso.practices && typeof pso.practices === 'object') {
      const p = pso.practices as Record<string, unknown>
      if (typeof p.meditation_minutes === 'number') return p.meditation_minutes
    }
  }
  return 15
}

// ── SectionLabel ───────────────────────────────────────────────────────────
function SectionLabel({ hi, en }: { hi: string; en: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="font-devanagari font-display text-lg font-semibold text-indigo-deep">{hi}</h2>
      <span className="text-xs text-twilight uppercase tracking-wide">{en}</span>
    </div>
  )
}

// ── DateSelector ───────────────────────────────────────────────────────────
function DateSelector({
  selected, onChange, loggedDates,
}: {
  selected: string
  onChange: (d: string) => void
  loggedDates: string[]
}) {
  const today   = todayISO()
  const isToday = selected === today

  // Last 10 days as dot strip
  const dots = Array.from({ length: 10 }, (_, i) => {
    const date = addDays(today, -(9 - i))
    return {
      date,
      day:      new Date(date + 'T00:00:00').getDate(),
      wday:     new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
      logged:   loggedDates.includes(date),
      isSel:    date === selected,
      isToday:  date === today,
    }
  })

  return (
    <div className="rounded-card border border-sandstone bg-parchment shadow-warm-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(addDays(selected, -1))}
          className="p-2 rounded-lg hover:bg-sandstone/50 transition-colors text-twilight hover:text-indigo-deep"
        >
          <ChevronLeft size={18} />
        </button>

        <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer">
          <CalendarDays size={14} className="text-sacred-saffron/70 shrink-0" />
          <span className="font-display text-base font-medium text-indigo-deep text-center leading-tight">
            {formatDisplay(selected)}
          </span>
          <input
            type="date"
            max={today}
            value={selected}
            onChange={e => e.target.value && onChange(e.target.value)}
            className="sr-only"
          />
        </label>

        <button
          onClick={() => onChange(addDays(selected, 1))}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-sandstone/50 transition-colors text-twilight hover:text-indigo-deep disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isToday && (
        <p className="text-center text-xs text-sacred-saffron font-medium -mt-1">आज • Today</p>
      )}

      {/* Day dot strip */}
      <div className="flex justify-center gap-1">
        {dots.map(({ date, day, wday, logged, isSel, isToday: dotToday }) => (
          <button key={date} onClick={() => onChange(date)} className="flex flex-col items-center gap-0.5">
            <span className={`text-[9px] ${isSel ? 'text-sacred-saffron font-semibold' : 'text-twilight/50'}`}>
              {wday}
            </span>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all
              ${isSel    ? 'bg-sacred-saffron text-dawn-white ring-2 ring-sacred-saffron/30' :
                logged   ? 'bg-temple-gold/30 text-indigo-deep' :
                dotToday ? 'border border-sacred-saffron/40 text-twilight' :
                           'bg-sandstone/40 text-twilight/60 hover:bg-sandstone'}
            `}>
              {day}
            </div>
            <div className={`w-1 h-1 rounded-full ${logged ? 'bg-temple-gold' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-sacred-saffron focus:ring-offset-2
        ${checked ? 'bg-sacred-saffron' : 'bg-sandstone'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

// ── ScoreSelector ──────────────────────────────────────────────────────────
function ScoreSelector({
  value, onChange, options,
}: {
  value:    number | null
  onChange: (v: number) => void
  options:  { icon: string; label: string }[]
}) {
  return (
    <div className="flex gap-1 sm:gap-2">
      {options.map(({ icon, label }, i) => {
        const score   = i + 1
        const isSel   = value === score
        return (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl border-2 transition-all duration-150
              ${isSel
                ? 'border-sacred-saffron bg-sacred-saffron/10 scale-105'
                : 'border-sandstone hover:border-sacred-saffron/40 hover:bg-sandstone/40'
              }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className={`text-[9px] font-medium leading-tight text-center
              ${isSel ? 'text-sacred-saffron' : 'text-twilight/60'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── WaterCounter ───────────────────────────────────────────────────────────
function WaterCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-full border border-sandstone flex items-center justify-center text-twilight hover:bg-sandstone/60 transition-colors shrink-0"
      >
        <Minus size={13} />
      </button>

      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            title={`${i + 1} glass${i > 0 ? 'es' : ''}`}
            className={`transition-all duration-100 ${i < value ? 'text-sky-blue scale-110' : 'text-sandstone hover:text-sky-blue/50'}`}
          >
            <Droplets size={17} />
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(Math.min(10, value + 1))}
        className="w-7 h-7 rounded-full border border-sandstone flex items-center justify-center text-twilight hover:bg-sandstone/60 transition-colors shrink-0"
      >
        <Plus size={13} />
      </button>

      <span className="text-sm font-semibold text-indigo-deep ml-1 tabular-nums">{value}<span className="font-normal text-twilight text-xs">/10</span></span>
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="border-t border-sandstone/50" />
}

// ── Row ────────────────────────────────────────────────────────────────────
function Row({ icon, hi, en, right }: { icon: React.ReactNode; hi: string; en: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="text-sacred-saffron/70 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-indigo-deep leading-tight">{hi}</p>
          <p className="text-xs text-twilight">{en}</p>
        </div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [profile,      setProfile]      = useState<ProfileRow | null>(null)
  const [userId,       setUserId]       = useState<string | null>(null)
  const [logId,        setLogId]        = useState<string | null>(null)
  const [form,         setForm]         = useState<LogForm>(() => logToForm(null))
  const [loggedDates,  setLoggedDates]  = useState<string[]>([])
  const [saving,       setSaving]       = useState(false)
  const [loadingLog,   setLoadingLog]   = useState(true)
  const [journalOpen,  setJournalOpen]  = useState(false)
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([])
  // Quick log state
  const [quickMode,    setQuickMode]    = useState(() => !localStorage.getItem('sadhanaos_quicklog_seen'))
  const [quickLogged,  setQuickLogged]  = useState(false)

  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])
  const addToast     = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToasts(p => [...p, { id: Math.random().toString(36).slice(2), message, type }])
  }, [])

  const patch = useCallback(<K extends keyof LogForm>(key: K, val: LogForm[K]) => {
    setForm(p => ({ ...p, [key]: val }))
  }, [])

  // Load profile + all logged dates once
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [profRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('daily_logs').select('log_date').eq('user_id', user.id),
      ])
      setProfile(profRes.data)
      setLoggedDates((logsRes.data ?? []).map(l => l.log_date))
    })()
  }, [])

  // Reload log when date changes
  useEffect(() => {
    setLoadingLog(true)
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingLog(false); return }
      const { data } = await supabase
        .from('daily_logs').select('*')
        .eq('user_id', user.id).eq('log_date', selectedDate)
        .maybeSingle()
      setLogId(data?.id ?? null)
      setForm(logToForm(data))
      setLoadingLog(false)
    })()
  }, [selectedDate])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('unauthenticated')

      const payload = {
        user_id:            user.id,
        log_date:           selectedDate,
        streak_maintained:  form.streak_maintained,
        notes:              form.fall_reflection || null,
        meditation_minutes: form.meditation_minutes,
        pranayama_done:     form.pranayama_done,
        pranayama_type:     form.pranayama_type || null,
        prayers_completed:  form.prayers_completed,
        exercise_done:      form.exercise_done,
        skincare_morning:   form.skincare_morning,
        skincare_evening:   form.skincare_evening,
        water_glasses:      form.water_glasses,
        mood_score:         form.mood_score,
        energy_score:       form.energy_score,
        clarity_score:      form.clarity_score,
        confidence_score:   form.confidence_score,
        gratitude_1:        form.gratitude_1 || null,
        gratitude_2:        form.gratitude_2 || null,
        gratitude_3:        form.gratitude_3 || null,
        journal_entry:      form.journal_entry || null,
      }

      if (logId) {
        await supabase.from('daily_logs').update(payload).eq('id', logId)
      } else {
        const { data: newLog } = await supabase.from('daily_logs').insert(payload).select().single()
        if (newLog) {
          setLogId(newLog.id)
          setLoggedDates(prev => prev.includes(selectedDate) ? prev : [...prev, selectedDate])
        }
      }
      addToast('🙏 आज का लेख सुरक्षित', 'success')
    } catch {
      addToast('कुछ गलत हो गया। पुनः प्रयास करें।', 'error')
    } finally {
      setSaving(false)
    }
  }, [selectedDate, logId, form, addToast])

  const prayerTimes     = extractPrayerTimes(profile)
  const meditationTarget = extractMeditationTarget(profile)

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">

      {/* Page heading */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-devanagari font-display text-2xl font-semibold text-indigo-deep">दैनिक लेख</h1>
          <p className="text-sm text-twilight mt-0.5">Daily Sacred Log</p>
        </div>
        {/* Toggle between quick and full mode */}
        {!quickLogged && (
          <button
            onClick={() => {
              const next = !quickMode
              setQuickMode(next)
              if (!next) localStorage.setItem('sadhanaos_quicklog_seen', '1')
            }}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-sandstone bg-parchment hover:border-sacred-saffron/50 transition-colors text-twilight"
          >
            {quickMode ? '📋 Full log' : '⚡ Quick log'}
          </button>
        )}
      </div>

      {/* Quick log card — shown when in quick mode and viewing today */}
      {quickMode && !quickLogged && userId && selectedDate === todayISO() && (
        <QuickLogCard
          userId={userId}
          today={selectedDate}
          onLogged={() => {
            setQuickLogged(true)
            localStorage.setItem('sadhanaos_quicklog_seen', '1')
            setLoggedDates(prev => prev.includes(selectedDate) ? prev : [...prev, selectedDate])
          }}
          onExpand={() => {
            setQuickMode(false)
            localStorage.setItem('sadhanaos_quicklog_seen', '1')
          }}
        />
      )}

      {/* Date selector */}
      <DateSelector
        selected={selectedDate}
        onChange={setSelectedDate}
        loggedDates={loggedDates}
      />

      {loadingLog ? (
        <div className="space-y-4">
          {[120, 280, 200, 160].map(h => (
            <div key={h} className="rounded-card border border-sandstone bg-parchment animate-warm-shimmer" style={{ height: h }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── 1. Brahmacharya ───────────────────────────────────────────── */}
          <Card accent>
            <CardHeader>
              <SectionLabel hi="ब्रह्मचर्य" en="Brahmacharya" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-twilight -mt-2">Did you maintain your vow today?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => patch('streak_maintained', true)}
                  className={`py-4 rounded-card border-2 font-display font-semibold text-lg transition-all duration-200
                    ${form.streak_maintained
                      ? 'border-sage-green bg-sage-green/10 text-sage-green shadow-[0_0_20px_rgba(122,158,122,0.25)]'
                      : 'border-sandstone text-twilight hover:border-sage-green/40'}`}
                >
                  ✓ हाँ (YES)
                </button>
                <button
                  onClick={() => patch('streak_maintained', false)}
                  className={`py-4 rounded-card border-2 font-display font-semibold text-lg transition-all duration-200
                    ${!form.streak_maintained
                      ? 'border-warm-clay bg-warm-clay/10 text-warm-clay'
                      : 'border-sandstone text-twilight hover:border-warm-clay/40'}`}
                >
                  ✗ नहीं (NO)
                </button>
              </div>

              <AnimatePresence mode="wait">
                {form.streak_maintained ? (
                  <motion.div
                    key="yes"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="p-4 rounded-card bg-sage-green/10 border border-sage-green/30 text-center"
                  >
                    <p className="font-devanagari text-lg font-semibold text-sage-green">सत्यं शिवं सुन्दरम् 🙏</p>
                    <p className="text-xs text-sage-green/80 mt-0.5">Truth, Goodness, Beauty — you embody all three today.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="space-y-3"
                  >
                    <div className="p-4 rounded-card bg-parchment border border-sandstone text-center">
                      <p className="font-devanagari text-base text-indigo-deep">हर गिरावट एक सबक है।</p>
                      <p className="text-sm text-twilight mt-0.5">Every fall is a lesson. Rise again with wisdom.</p>
                    </div>
                    <Textarea
                      label="What happened? What will you do differently?"
                      value={form.fall_reflection}
                      onChange={e => patch('fall_reflection', e.target.value)}
                      rows={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ── 2. Sadhana Practices ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <SectionLabel hi="साधना" en="Practices" />
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Meditation */}
              <div className="space-y-2">
                <Row
                  icon={<Brain size={18} />}
                  hi="ध्यान (Meditation)"
                  en={`Target: ${meditationTarget} min`}
                  right={
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => patch('meditation_minutes', Math.max(0, form.meditation_minutes - 5))}
                        className="w-7 h-7 rounded-full border border-sandstone flex items-center justify-center text-twilight hover:bg-sandstone/60 transition-colors text-base leading-none"
                      >–</button>
                      <input
                        type="number" min={0} max={120}
                        value={form.meditation_minutes}
                        onChange={e => patch('meditation_minutes', Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                        className="w-14 text-center border border-sandstone rounded-lg py-1 text-sm font-semibold text-indigo-deep bg-dawn-white focus:outline-none focus:ring-2 focus:ring-sacred-saffron/50"
                      />
                      <span className="text-xs text-twilight">min</span>
                      <button
                        onClick={() => patch('meditation_minutes', Math.min(120, form.meditation_minutes + 5))}
                        className="w-7 h-7 rounded-full border border-sandstone flex items-center justify-center text-twilight hover:bg-sandstone/60 transition-colors text-base leading-none"
                      >+</button>
                    </div>
                  }
                />
                {form.meditation_minutes > 0 && form.meditation_minutes >= meditationTarget && (
                  <p className="text-xs text-sage-green font-medium pl-8">✓ लक्ष्य प्राप्त! Goal reached!</p>
                )}
              </div>

              <Divider />

              {/* Pranayama */}
              <div className="space-y-3">
                <Row
                  icon={<Wind size={18} />}
                  hi="प्राणायाम (Pranayama)"
                  en="Breath work"
                  right={<Toggle checked={form.pranayama_done} onChange={v => patch('pranayama_done', v)} />}
                />
                <AnimatePresence>
                  {form.pranayama_done && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-8"
                    >
                      <select
                        value={form.pranayama_type}
                        onChange={e => patch('pranayama_type', e.target.value)}
                        className="w-full border border-sandstone rounded-card px-3 py-2 text-sm text-indigo-deep bg-dawn-white focus:outline-none focus:ring-2 focus:ring-sacred-saffron/50"
                      >
                        <option value="">— Select type —</option>
                        <option value="Anulom Vilom">Anulom Vilom (अनुलोम विलोम)</option>
                        <option value="Bhramari">Bhramari (भ्रामरी)</option>
                        <option value="Kapalbhati">Kapalbhati (कपालभाति)</option>
                        <option value="Box Breathing">Box Breathing</option>
                        <option value="4-7-8">4-7-8 Breathing</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Divider />

              {/* Prayers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Heart size={18} className="text-sacred-saffron/70 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-indigo-deep leading-tight">प्रार्थना (Prayers)</p>
                    <p className="text-xs text-twilight">Which prayers did you complete?</p>
                  </div>
                </div>
                {prayerTimes.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pl-8">
                    {prayerTimes.map(time => {
                      const sel = form.prayers_completed.includes(time)
                      return (
                        <button
                          key={time}
                          onClick={() => {
                            const next = sel
                              ? form.prayers_completed.filter(t => t !== time)
                              : [...form.prayers_completed, time]
                            patch('prayers_completed', next)
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                            ${sel
                              ? 'bg-sacred-saffron text-dawn-white border-sacred-saffron'
                              : 'border-sandstone text-twilight hover:border-sacred-saffron/50'}`}
                        >
                          {sel ? '✓ ' : ''}{time}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pl-8">
                    <span className="text-sm text-twilight">Did you pray today?</span>
                    <Toggle
                      checked={form.prayers_completed.length > 0}
                      onChange={v => patch('prayers_completed', v ? ['done'] : [])}
                    />
                  </div>
                )}
              </div>

              <Divider />

              {/* Exercise */}
              <Row
                icon={<Dumbbell size={18} />}
                hi="व्यायाम (Exercise)"
                en="Physical training"
                right={<Toggle checked={form.exercise_done} onChange={v => patch('exercise_done', v)} />}
              />

              <Divider />

              {/* Skincare */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Sun size={18} className="text-sacred-saffron/70 shrink-0" />
                  <p className="text-sm font-medium text-indigo-deep">त्वचा देखभाल (Skincare)</p>
                </div>
                <div className="flex gap-6 pl-8">
                  <div className="flex items-center gap-2">
                    <Toggle checked={form.skincare_morning} onChange={v => patch('skincare_morning', v)} />
                    <span className="text-sm text-twilight flex items-center gap-1">
                      <Sun size={12} className="text-sacred-saffron/60" /> Morning
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle checked={form.skincare_evening} onChange={v => patch('skincare_evening', v)} />
                    <span className="text-sm text-twilight flex items-center gap-1">
                      <Moon size={12} className="text-sky-blue/60" /> Evening
                    </span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Water */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Droplets size={18} className="text-sky-blue/70 shrink-0" />
                  <p className="text-sm font-medium text-indigo-deep">जल सेवन (Water Intake)</p>
                </div>
                <div className="pl-8">
                  <WaterCounter value={form.water_glasses} onChange={v => patch('water_glasses', v)} />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── 3. Inner Vision ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <SectionLabel hi="अंतर्दर्शन" en="Inner Vision" />
            </CardHeader>
            <CardContent className="space-y-5">

              <div>
                <p className="text-sm font-medium text-indigo-deep mb-1">
                  मनोदशा <span className="text-twilight font-normal">Mood</span>
                </p>
                <ScoreSelector
                  value={form.mood_score}
                  onChange={v => patch('mood_score', v)}
                  options={[
                    { icon: '😞', label: 'Low' },
                    { icon: '😕', label: 'Meh' },
                    { icon: '😐', label: 'Okay' },
                    { icon: '🙂', label: 'Good' },
                    { icon: '😊', label: 'Great' },
                  ]}
                />
              </div>

              <Divider />

              <div>
                <p className="text-sm font-medium text-indigo-deep mb-1">
                  ऊर्जा <span className="text-twilight font-normal">Energy</span>
                </p>
                <ScoreSelector
                  value={form.energy_score}
                  onChange={v => patch('energy_score', v)}
                  options={[
                    { icon: '🪫', label: 'Drained' },
                    { icon: '😴', label: 'Tired' },
                    { icon: '😑', label: 'Neutral' },
                    { icon: '💪', label: 'Active' },
                    { icon: '⚡', label: 'Charged' },
                  ]}
                />
              </div>

              <Divider />

              <div>
                <p className="text-sm font-medium text-indigo-deep mb-1">
                  मानसिक स्पष्टता <span className="text-twilight font-normal">Mental Clarity</span>
                </p>
                <ScoreSelector
                  value={form.clarity_score}
                  onChange={v => patch('clarity_score', v)}
                  options={[
                    { icon: '🌫️', label: 'Foggy' },
                    { icon: '💭', label: 'Hazy' },
                    { icon: '🧠', label: 'Clear' },
                    { icon: '💡', label: 'Sharp' },
                    { icon: '🔮', label: 'Crystal' },
                  ]}
                />
              </div>

              <Divider />

              <div>
                <p className="text-sm font-medium text-indigo-deep mb-1">
                  आत्मविश्वास <span className="text-twilight font-normal">Confidence</span>
                </p>
                <ScoreSelector
                  value={form.confidence_score}
                  onChange={v => patch('confidence_score', v)}
                  options={[
                    { icon: '🛡️', label: 'Shaken' },
                    { icon: '🗡️', label: 'Steadying' },
                    { icon: '⚔️', label: 'Solid' },
                    { icon: '🏆', label: 'Strong' },
                    { icon: '👑', label: 'Radiant' },
                  ]}
                />
              </div>

            </CardContent>
          </Card>

          {/* ── 4. Gratitude ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <SectionLabel hi="कृतज्ञता" en="Gratitude" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-twilight -mt-2 mb-1">Three things you are grateful for today:</p>
              {(
                [
                  { key: 'gratitude_1' as const, placeholder: 'my family' },
                  { key: 'gratitude_2' as const, placeholder: 'my health' },
                  { key: 'gratitude_3' as const, placeholder: 'another day of discipline' },
                ]
              ).map(({ key, placeholder }, i) => (
                <Input
                  key={key}
                  label={`${i + 1}. I am grateful for…`}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => patch(key, e.target.value)}
                />
              ))}
            </CardContent>
          </Card>

          {/* ── 5. Daily Reflection ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <button
                onClick={() => setJournalOpen(v => !v)}
                className="w-full flex items-center justify-between"
              >
                <SectionLabel hi="दैनिक चिंतन" en="Daily Reflection (optional)" />
                <ChevronDown
                  size={18}
                  className={`text-twilight transition-transform duration-200 ${journalOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </CardHeader>
            <AnimatePresence initial={false}>
              {journalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="-mt-2 pb-6">
                    <Textarea
                      label="How was your day? What did you learn about yourself?"
                      value={form.journal_entry}
                      onChange={e => patch('journal_entry', e.target.value)}
                      rows={5}
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </>
      )}

      {/* ── Sticky Save Bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 md:left-[260px] right-0 z-40 flex justify-center px-4 pb-6 pt-4 bg-gradient-to-t from-dawn-white via-dawn-white/90 to-transparent pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <Button
            variant="sacred"
            size="lg"
            loading={saving}
            onClick={handleSave}
            className="w-full text-base shadow-gold-glow"
          >
            <Save size={18} />
            संचित करें (Save Log)
          </Button>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
