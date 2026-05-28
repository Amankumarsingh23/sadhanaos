'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Send, AlertTriangle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { ProfileCtx, WeekCtx } from '@/lib/groq'
import type { Database } from '@/types/database'

const PDFDownloadButton = dynamic(
  () => import('@/components/pdf/PDFDownloadButton'),
  { ssr: false, loading: () => null }
)

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab      = 'weekly' | 'ask' | 'emergency'
type AiReport = Database['public']['Tables']['ai_reports']['Row']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sevenDaysAgoISO() {
  return new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)) + 1
}

function minutesAgo(isoTimestamp: string): number {
  return Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 60000)
}

function anyPrayerDone(pc: Database['public']['Tables']['daily_logs']['Row']['prayers_completed']): boolean {
  if (!pc || typeof pc !== 'object' || Array.isArray(pc)) return false
  return Object.values(pc as Record<string, unknown>).some((v) => v === true)
}

// ─── Rishi response renderer ──────────────────────────────────────────────────

function RishiText({ text }: { text: string }) {
  const segments = text.split('\n')
  return (
    <div className="space-y-2">
      {segments.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-1.5" />
        if (trimmed.startsWith('---') || trimmed === '—') {
          return <hr key={i} className="border-sandstone/60 my-1" />
        }
        const hasDevanagari = /[ऀ-ॿ]/.test(trimmed)
        const looksLikeShloka = hasDevanagari && trimmed.length < 120 && !trimmed.endsWith('.')
        if (looksLikeShloka) {
          return (
            <p key={i} className="font-devanagari text-sacred-saffron italic text-center py-0.5 leading-relaxed">
              {trimmed}
            </p>
          )
        }
        // Bold-ish lines (ALL CAPS or ending with : )
        if (trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length < 60)) {
          return (
            <p key={i} className="text-sm font-semibold text-indigo-deep mt-2">
              {trimmed}
            </p>
          )
        }
        return (
          <p key={i} className="text-sm text-indigo-deep leading-relaxed">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

function ResponseCard({
  text, streaming, title,
}: {
  text: string; streaming: boolean; title?: string
}) {
  return (
    <div className={`rounded-card border p-5 space-y-4 transition-all duration-300 ${
      streaming ? 'border-sacred-saffron shadow-gold-glow' : 'border-sandstone shadow-warm-sm'
    } bg-gradient-to-b from-parchment to-cream`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🕉️</span>
        <p className="font-devanagari text-sm text-sacred-saffron font-semibold">
          {title ?? 'ऋषि का उत्तर'}
        </p>
        {streaming && (
          <span className="ml-auto text-xs text-twilight/60 animate-pulse">Speaking…</span>
        )}
      </div>
      <div className="border-t border-sandstone/40 pt-3">
        <RishiText text={text} />
        {streaming && (
          <span className="inline-block w-0.5 h-4 bg-sacred-saffron animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  )
}

function PastReportCard({ report }: { report: AiReport }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(report.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const preview = report.content.slice(0, 120).replace(/\n/g, ' ') + '…'

  return (
    <div className="rounded-card border border-sandstone bg-white/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-xs font-semibold text-indigo-deep">
            {report.report_type === 'weekly' ? '📋 Weekly Guidance' : '💬 Guidance'} — {date}
          </p>
          {!expanded && (
            <p className="text-xs text-twilight mt-0.5 line-clamp-1">{preview}</p>
          )}
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-twilight shrink-0 ml-2" />
          : <ChevronDown size={14} className="text-twilight shrink-0 ml-2" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-sandstone/40 pt-3">
              <RishiText text={report.content} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RishiPage() {
  const searchParams = useSearchParams()
  const initialMode  = searchParams.get('mode') as Tab | null
  const [tab, setTab] = useState<Tab>(
    initialMode && ['weekly','ask','emergency'].includes(initialMode) ? initialMode : 'weekly'
  )

  // Data
  const [userId,   setUserId]   = useState<string | null>(null)
  const [profile,  setProfile]  = useState<ProfileCtx | null>(null)
  const [weekCtx,  setWeekCtx]  = useState<WeekCtx | null>(null)
  const [sankalp,  setSankalp]  = useState<string | null>(null)
  const [lastUrgeData, setLastUrgeData] = useState<{ intensity: number; minutesAgo: number } | null>(null)
  const [pastReports, setPastReports]   = useState<AiReport[]>([])
  const [loading,  setLoading]  = useState(true)

  // Streaming state
  const [streaming,  setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const [activeTitle, setActiveTitle] = useState('')
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Ask Rishi
  const [question, setQuestion] = useState('')

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const ago7 = sevenDaysAgoISO()

      const [
        { data: prof },
        { data: logs },
        { data: urges },
        { data: latestRefl },
        { data: affirmData },
        { data: streakView },
        { data: reports },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', ago7).order('log_date'),
        supabase.from('urge_logs').select('*').eq('user_id', user.id)
          .gte('logged_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('logged_at', { ascending: false }),
        supabase.from('weekly_reflections').select('biggest_challenge,biggest_win')
          .eq('user_id', user.id).order('week_number', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('affirmations').select('text_english').eq('user_id', user.id)
          .eq('active', true).limit(1).maybeSingle(),
        supabase.from('v_current_streak').select('current_streak').eq('user_id', user.id).maybeSingle(),
        supabase.from('ai_reports').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(20),
      ])

      // Profile context
      const currentStreak = streakView?.current_streak ?? 0
      const currentDay    = daysSince(prof?.sadhana_start_date ?? null)

      setProfile({
        name:         prof?.full_name ?? null,
        deity:        prof?.ist_deity ?? null,
        sadhanaStart: prof?.sadhana_start_date ?? null,
        targetDays:   prof?.target_days ?? 90,
        currentDay,
        currentStreak,
      })

      // Week context from last 7 days
      const logList = logs ?? []
      const urgList = urges ?? []
      const moodVals = logList.map((l) => l.mood_score).filter((v): v is number => v !== null)
      const waterVals = logList.map((l) => l.water_glasses).filter((v) => v > 0)
      const sleepVals = logList.map((l) => l.sleep_hours).filter((v): v is number => v !== null)

      setWeekCtx({
        streakDays:    logList.filter((l) => l.streak_maintained).length,
        avgMood:       moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : null,
        meditationDays: logList.filter((l) => l.meditation_minutes > 0).length,
        pranayamaDays:  logList.filter((l) => l.pranayama_done).length,
        prayerDays:    logList.filter((l) => anyPrayerDone(l.prayers_completed)).length,
        urgeCount:     urgList.length,
        urgesResisted: urgList.filter((u) => u.held_strong).length,
        exerciseDays:  logList.filter((l) => l.exercise_done).length,
        waterAvg:      waterVals.length ? waterVals.reduce((a, b) => a + b, 0) / waterVals.length : 0,
        sleepAvg:      sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : null,
        latestChallenge: latestRefl?.biggest_challenge ?? null,
        latestWin:     latestRefl?.biggest_win ?? null,
      })

      setSankalp(affirmData?.text_english ?? null)

      // Last urge
      if (urgList.length > 0) {
        const last = urgList[0]
        setLastUrgeData({ intensity: last.intensity, minutesAgo: minutesAgo(last.logged_at) })
      }

      setPastReports(reports ?? [])
      setLoading(false)
    })()
  }, [])

  // ── Stream helper ─────────────────────────────────────────────────────────
  const callRishi = useCallback(async (
    type:    Tab,
    title:   string,
    extra:   Record<string, unknown> = {},
  ) => {
    if (!profile || !weekCtx) return
    setStreaming(true)
    setStreamText('')
    setActiveTitle(title)
    setError(null)
    setSaved(false)

    let fullText = ''

    try {
      const res = await fetch('/api/rishi', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, profile, week: weekCtx, ...extra }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(err.error ?? 'Rishi could not respond. Please try again.')
        setStreaming(false)
        return
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setStreamText(fullText)
      }
    } catch {
      setError('Connection error. Please check your internet and try again.')
      setStreaming(false)
      return
    }

    setStreaming(false)

    // Save to ai_reports
    if (userId && fullText.trim()) {
      const reportType = type === 'weekly' ? 'weekly' : 'guidance'
      await supabase.from('ai_reports').insert({
        user_id:       userId,
        report_type:   reportType,
        content:       fullText,
        data_snapshot: { type, timestamp: new Date().toISOString() } as unknown as Database['public']['Tables']['ai_reports']['Insert']['data_snapshot'],
      })
      // Refresh reports list
      const { data } = await supabase.from('ai_reports').select('*')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      if (data) setPastReports(data)
      setSaved(true)
    }
  }, [profile, weekCtx, userId])

  const handleWeekly    = () => callRishi('weekly', 'साप्ताहिक मार्गदर्शन')
  const handleAsk       = () => {
    if (!question.trim()) return
    callRishi('ask', 'ऋषि का उत्तर', { question })
  }
  const handleEmergency = () => {
    const recentMoodVal = weekCtx?.avgMood ?? null
    callRishi('emergency', 'आपातकालीन सहायता', {
      recentMood: recentMoodVal,
      lastUrge:   lastUrgeData,
      sankalp,
    })
  }

  // PDF helpers — computed once profile is loaded
  const weekNumber = profile ? Math.ceil(Math.max(1, profile.currentDay) / 7) : 1
  const dateRange  = useMemo(() => {
    const end   = new Date()
    const start = new Date(end.getTime() - 6 * 86400000)
    const fmt   = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [])

  const EXAMPLE_QUESTIONS = [
    'Why do I feel more urges on weekends?',
    'Which pranayama is best for my current state?',
    "I'm feeling low today. Help me.",
    'What does my urge pattern tell you?',
    'Explain Gita 6.5 in the context of my journey.',
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
          <h1 className="font-devanagari text-2xl text-indigo-deep">ऋषि मार्गदर्शन</h1>
          <p className="text-xs text-twilight italic font-display">Guidance from the Digital Sage</p>
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
          {([
            { key: 'weekly',    label: 'साप्ताहिक मार्गदर्शन' },
            { key: 'ask',       label: 'ऋषि से पूछें'          },
            { key: 'emergency', label: 'आपातकालीन सहायता'      },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStreamText(''); setError(null) }}
              className={`shrink-0 px-3 py-1.5 rounded-card text-xs font-medium font-devanagari transition-all ${
                tab === t.key
                  ? t.key === 'emergency'
                    ? 'bg-rose-red text-dawn-white'
                    : 'bg-sacred-saffron text-dawn-white'
                  : 'text-twilight hover:bg-sandstone'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-card bg-sandstone/40 h-24 animate-pulse" />
            ))}
          </div>
        ) : !profile ? (
          <p className="text-center text-twilight text-sm py-16">
            Please complete your profile to receive personalised guidance.
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >

              {/* ══════════════════════════════════════════════════
                  WEEKLY GUIDANCE
              ══════════════════════════════════════════════════ */}
              {tab === 'weekly' && (
                <>
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm text-indigo-deep">
                        Receive a personalised spiritual report based on your last 7 days of data.
                      </p>
                      <p className="text-xs text-twilight">
                        Streak: {profile.currentStreak} days · Day {profile.currentDay} ·
                        {weekCtx ? ` Mood avg: ${weekCtx.avgMood?.toFixed(1) ?? '—'}/5 · Urges: ${weekCtx.urgeCount}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={handleWeekly}
                      disabled={streaming}
                      className="w-full py-3 rounded-card bg-sacred-saffron text-dawn-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Sparkles size={16} />
                      {streaming && activeTitle === 'साप्ताहिक मार्गदर्शन'
                        ? 'Receiving guidance…'
                        : 'Get This Week\'s Guidance'}
                    </button>
                  </div>

                  {/* Error */}
                  {error && tab === 'weekly' && (
                    <p className="text-xs text-rose-red text-center">{error}</p>
                  )}

                  {/* Streaming / completed response */}
                  {(streamText || (streaming && activeTitle === 'साप्ताहिक मार्गदर्शन')) && (
                    <ResponseCard
                      text={streamText}
                      streaming={streaming && activeTitle === 'साप्ताहिक मार्गदर्शन'}
                      title="साप्ताहिक मार्गदर्शन"
                    />
                  )}
                  {saved && !streaming && activeTitle === 'साप्ताहिक मार्गदर्शन' && (
                    <div className="space-y-3">
                      <p className="text-xs text-sage-green text-center">Saved to your report history ✓</p>
                      {weekCtx && streamText && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-xs text-twilight/60 font-display italic">
                            Your sacred letter is ready — download it as a royal PDF
                          </p>
                          <PDFDownloadButton
                            profile={profile}
                            week={weekCtx}
                            reportText={streamText}
                            weekNumber={weekNumber}
                            dateRange={dateRange}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Past reports */}
                  {pastReports.filter((r) => r.report_type === 'weekly').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-twilight uppercase tracking-widest">
                        Past Reports
                      </p>
                      {pastReports
                        .filter((r) => r.report_type === 'weekly')
                        .map((r) => <PastReportCard key={r.id} report={r} />)}
                    </div>
                  )}
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  ASK RISHI
              ══════════════════════════════════════════════════ */}
              {tab === 'ask' && (
                <>
                  <div className="rounded-card bg-white/60 border border-sandstone p-5 shadow-warm-sm space-y-3">
                    <p className="text-xs text-twilight">
                      Ask anything about your sadhana, scriptures, or spiritual practice.
                      Rishi has your full context.
                    </p>

                    <div className="flex gap-2">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                        placeholder="Ask Rishi…"
                        className="flex-1 text-sm bg-sandstone/30 rounded-card px-3 py-2.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep"
                        disabled={streaming}
                      />
                      <button
                        onClick={handleAsk}
                        disabled={streaming || !question.trim()}
                        className="px-4 py-2.5 bg-sacred-saffron text-dawn-white rounded-card hover:opacity-90 disabled:opacity-40 transition-opacity"
                        aria-label="Send"
                      >
                        <Send size={15} />
                      </button>
                    </div>

                    {/* Example questions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {EXAMPLE_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuestion(q)}
                          className="text-xs bg-sandstone/50 text-twilight rounded-card px-2.5 py-1 hover:bg-sandstone transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && tab === 'ask' && (
                    <p className="text-xs text-rose-red text-center">{error}</p>
                  )}

                  {(streamText || (streaming && activeTitle === 'ऋषि का उत्तर')) && (
                    <ResponseCard
                      text={streamText}
                      streaming={streaming && activeTitle === 'ऋषि का उत्तर'}
                      title="ऋषि का उत्तर"
                    />
                  )}
                  {saved && !streaming && activeTitle === 'ऋषि का उत्तर' && (
                    <p className="text-xs text-sage-green text-center">Saved ✓</p>
                  )}

                  {/* Past guidance Q&As */}
                  {pastReports.filter((r) => r.report_type === 'guidance').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-twilight uppercase tracking-widest">
                        Past Guidance
                      </p>
                      {pastReports
                        .filter((r) => r.report_type === 'guidance')
                        .slice(0, 5)
                        .map((r) => <PastReportCard key={r.id} report={r} />)}
                    </div>
                  )}
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  EMERGENCY SUPPORT
              ══════════════════════════════════════════════════ */}
              {tab === 'emergency' && (
                <>
                  {!(streamText || streaming) && (
                    <div className="space-y-4">
                      {/* Streak reminder card */}
                      <div className="rounded-card bg-amber-50/80 border border-temple-gold p-5 shadow-warm-sm text-center space-y-2">
                        <p className="text-3xl">🔥</p>
                        <p className="font-devanagari text-lg text-indigo-deep">
                          {profile.currentStreak} दिन की धारा
                        </p>
                        <p className="text-xs text-twilight">
                          You are on Day {profile.currentDay} of your {profile.targetDays}-day sankalp.
                          {profile.currentStreak > 0 && ` ${profile.currentStreak} consecutive days maintained.`}
                        </p>
                        {sankalp && (
                          <p className="text-xs italic text-indigo-mid border-t border-sandstone/40 pt-2 mt-2">
                            &ldquo;{sankalp}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Big emergency button */}
                      <motion.button
                        onClick={handleEmergency}
                        disabled={streaming}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-5 rounded-card bg-rose-red text-dawn-white font-bold text-base hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-3 shadow-lg"
                      >
                        <AlertTriangle size={20} />
                        I&apos;m struggling right now — Help me
                      </motion.button>

                      <p className="text-xs text-twilight text-center">
                        Rishi will give you an immediate calming practice and specific action.
                      </p>

                      {/* Quick links */}
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href="/pranayama"
                          className="rounded-card border border-sandstone bg-white/60 p-3 text-center hover:shadow-warm-sm transition-shadow"
                        >
                          <p className="text-lg">🌬️</p>
                          <p className="text-xs font-medium text-indigo-deep mt-1">Breathing Exercise</p>
                          <p className="text-xs text-twilight">Pranayama now</p>
                        </Link>
                        <Link
                          href="/kavach"
                          className="rounded-card border border-sandstone bg-white/60 p-3 text-center hover:shadow-warm-sm transition-shadow"
                        >
                          <p className="text-lg">🛡️</p>
                          <p className="text-xs font-medium text-indigo-deep mt-1">Urge Shield</p>
                          <p className="text-xs text-twilight">Activate kavach</p>
                        </Link>
                      </div>
                    </div>
                  )}

                  {error && tab === 'emergency' && (
                    <p className="text-xs text-rose-red text-center">{error}</p>
                  )}

                  {(streamText || (streaming && activeTitle === 'आपातकालीन सहायता')) && (
                    <div className="space-y-4">
                      <ResponseCard
                        text={streamText}
                        streaming={streaming && activeTitle === 'आपातकालीन सहायता'}
                        title="आपातकालीन सहायता — Emergency Support"
                      />

                      {!streaming && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <Link
                              href="/pranayama"
                              className="rounded-card border border-indigo-mid bg-indigo-mid/10 p-3 text-center hover:bg-indigo-mid/20 transition-colors"
                            >
                              <p className="text-lg">🌬️</p>
                              <p className="text-xs font-semibold text-indigo-deep mt-1">Start Pranayama</p>
                            </Link>
                            <Link
                              href="/kavach"
                              className="rounded-card border border-sage-green bg-sage-green/10 p-3 text-center hover:bg-sage-green/20 transition-colors"
                            >
                              <p className="text-lg">🛡️</p>
                              <p className="text-xs font-semibold text-indigo-deep mt-1">Urge Shield</p>
                            </Link>
                          </div>

                          <button
                            onClick={() => { setStreamText(''); setError(null); setSaved(false) }}
                            className="w-full text-xs text-twilight hover:text-indigo-deep transition-colors py-1"
                          >
                            ← Back
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
