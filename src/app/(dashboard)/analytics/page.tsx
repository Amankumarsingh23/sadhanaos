'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  StreakTimelineChart,
  MoodTrendChart,
  UrgeFrequencyChart,
  UrgeHeatmapChart,
  RitualConsistencyChart,
  PranayamaProgressChart,
  GratitudeWordCloud,
  HolisticScoreChart,
  CorrelationInsightsCard,
} from '@/components/charts'
import type { CorrelationInsight } from '@/components/charts'
import type { Database } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = '7D' | '14D' | '30D' | 'All'

type DailyRow   = Database['public']['Tables']['daily_logs']['Row']
type UrgeRow    = Database['public']['Tables']['urge_logs']['Row']
type WeeklyRow  = Database['public']['Tables']['weekly_reflections']['Row']
type Json       = Database['public']['Tables']['daily_logs']['Row']['prayers_completed']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function cutoffDate(range: TimeRange): string {
  const days = range === '7D' ? 7 : range === '14D' ? 14 : range === '30D' ? 30 : 3650
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
}

function weekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return d.toISOString().slice(0, 10)
}

function weekLabel(dateStr: string): string {
  return dateStr.slice(5)  // MM-DD
}

function anyPrayerDone(pc: Json): boolean {
  if (!pc || typeof pc !== 'object' || Array.isArray(pc)) return false
  return Object.values(pc as Record<string, Json>).some((v) => v === true)
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should','may',
  'might','must','can','to','of','in','for','on','with','at','by','from',
  'this','that','these','those','i','me','my','we','our','you','your',
  'he','she','his','her','it','its','they','them','their','who','which',
  'what','how','when','where','why','not','no','so','if','then','than',
  'too','very','just','am','also','about','up','out','as','into','after',
  'new','over','since','all','more','so','been','its','s','t','re','ve',
])

function wordFrequencies(logs: DailyRow[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  for (const log of logs) {
    const texts = [log.gratitude_1, log.gratitude_2, log.gratitude_3]
    for (const t of texts) {
      if (!t) continue
      t.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
        .forEach((w) => { freq[w] = (freq[w] ?? 0) + 1 })
    }
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
}

function isoWeekKey(dateStr: string): string {
  return weekStart(dateStr)
}

interface WeekBucket {
  weekKey:   string
  logs:      DailyRow[]
  urges:     UrgeRow[]
  hasRefl:   boolean
}

function bucketByWeek(
  logs:        DailyRow[],
  urges:       UrgeRow[],
  reflections: WeeklyRow[],
): Map<string, WeekBucket> {
  const map = new Map<string, WeekBucket>()
  const reflSet = new Set(reflections.map((r) => r.week_start_date))

  for (const log of logs) {
    const k = isoWeekKey(log.log_date)
    if (!map.has(k)) map.set(k, { weekKey: k, logs: [], urges: [], hasRefl: reflSet.has(k) })
    map.get(k)!.logs.push(log)
  }
  for (const urge of urges) {
    const k = isoWeekKey(urge.logged_at.slice(0, 10))
    if (!map.has(k)) map.set(k, { weekKey: k, logs: [], urges: [], hasRefl: reflSet.has(k) })
    map.get(k)!.urges.push(urge)
  }
  return map
}

function computeWeekScore(bucket: WeekBucket): number {
  const { logs, urges, hasRefl } = bucket
  if (logs.length === 0) return 0

  // 1. Streak (25 pts)
  const streakPts = Math.round((logs.filter((l) => l.streak_maintained).length / 7) * 25)

  // 2. Rituals avg (25 pts)
  const ritualAvg = logs.reduce((sum, l) => {
    let done = 0
    if (l.meditation_minutes > 0)              done++
    if (l.pranayama_done)                      done++
    if (anyPrayerDone(l.prayers_completed))    done++
    if (l.skincare_morning || l.skincare_evening) done++
    if (l.exercise_done)                       done++
    return sum + done / 5
  }, 0) / logs.length
  const ritualPts = Math.round(ritualAvg * 25)

  // 3. Meditation (15 pts)
  const medPts = Math.round((logs.filter((l) => l.meditation_minutes > 0).length / Math.min(logs.length, 7)) * 15)

  // 4. Urges resisted (15 pts)
  const urgePts = urges.length === 0
    ? 15
    : Math.round((urges.filter((u) => u.held_strong).length / urges.length) * 15)

  // 5. Reflection done (10 pts)
  const reflPts = hasRefl ? 10 : 0

  // 6. Scripture (10 pts)
  const scrPts = logs.some((l) => l.shloka_learned_id !== null) ? 10 : 0

  return Math.min(streakPts + ritualPts + medPts + urgePts + reflPts + scrPts, 100)
}

// ─── Correlation computation ──────────────────────────────────────────────────

function computeCorrelations(
  allLogs:  DailyRow[],
  allUrges: UrgeRow[],
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = []

  // 1. Morning meditation → fewer urges
  const urgeDateSet = new Set(allUrges.map((u) => u.logged_at.slice(0, 10)))
  const medDays   = allLogs.filter((l) => l.meditation_minutes > 0)
  const noMedDays = allLogs.filter((l) => l.meditation_minutes === 0)
  if (medDays.length >= 5 && noMedDays.length >= 5) {
    const urgesOnMed   = medDays  .filter((l) => urgeDateSet.has(l.log_date)).length
    const urgesOnNoMed = noMedDays.filter((l) => urgeDateSet.has(l.log_date)).length
    const avgMed   = urgesOnMed   / medDays.length
    const avgNoMed = urgesOnNoMed / noMedDays.length
    if (avgNoMed > 0 && avgMed < avgNoMed) {
      const reduction = Math.round(((avgNoMed - avgMed) / avgNoMed) * 100)
      const strength  = Math.min((avgNoMed - avgMed) / avgNoMed, 1)
      insights.push({
        icon:     '🧘',
        title:    'Meditation reduces urges',
        text:     `Days with morning meditation → ${reduction}% fewer urge triggers (${avgMed.toFixed(2)} vs ${avgNoMed.toFixed(2)} per day)`,
        strength,
      })
    }
  }

  // 2. 7+ hours sleep → better mood
  const sleepLogs   = allLogs.filter((l) => l.sleep_hours !== null && l.mood_score !== null)
  const goodSleep   = sleepLogs.filter((l) => l.sleep_hours! >= 7)
  const poorSleep   = sleepLogs.filter((l) => l.sleep_hours! <  7)
  if (goodSleep.length >= 5 && poorSleep.length >= 5) {
    const avgGood = goodSleep.reduce((s, l) => s + l.mood_score!, 0) / goodSleep.length
    const avgPoor = poorSleep.reduce((s, l) => s + l.mood_score!, 0) / poorSleep.length
    if (avgGood > avgPoor) {
      const strength = Math.min((avgGood - avgPoor) / 5, 1)
      insights.push({
        icon:     '😴',
        title:    '7+ hours sleep → better mood',
        text:     `Nights with 7+ hrs sleep: mood avg ${avgGood.toFixed(1)}/5 vs ${avgPoor.toFixed(1)}/5 on shorter nights`,
        strength,
      })
    }
  }

  // 3. Exercise → clarity
  const exLogs   = allLogs.filter((l) => l.clarity_score !== null)
  const exDays   = exLogs.filter((l) => l.exercise_done)
  const noExDays = exLogs.filter((l) => !l.exercise_done)
  if (exDays.length >= 5 && noExDays.length >= 5) {
    const avgEx   = exDays  .reduce((s, l) => s + l.clarity_score!, 0) / exDays.length
    const avgNoEx = noExDays.reduce((s, l) => s + l.clarity_score!, 0) / noExDays.length
    if (avgEx > avgNoEx) {
      const strength = Math.min((avgEx - avgNoEx) / 5, 1)
      insights.push({
        icon:     '⚡',
        title:    'Exercise boosts mental clarity',
        text:     `Exercise days → clarity score ${avgEx.toFixed(1)}/5 vs ${avgNoEx.toFixed(1)}/5 on rest days`,
        strength,
      })
    }
  }

  // 4. Prayer consistency → energy
  const prayerLogs   = allLogs.filter((l) => l.energy_score !== null)
  const prayerDays   = prayerLogs.filter((l) => anyPrayerDone(l.prayers_completed))
  const noPrayerDays = prayerLogs.filter((l) => !anyPrayerDone(l.prayers_completed))
  if (prayerDays.length >= 5 && noPrayerDays.length >= 5) {
    const avgP   = prayerDays  .reduce((s, l) => s + l.energy_score!, 0) / prayerDays.length
    const avgNoP = noPrayerDays.reduce((s, l) => s + l.energy_score!, 0) / noPrayerDays.length
    if (avgP > avgNoP) {
      const strength = Math.min((avgP - avgNoP) / 5, 1)
      insights.push({
        icon:     '🙏',
        title:    'Prayer correlates with energy',
        text:     `Days with prayer → energy score ${avgP.toFixed(1)}/5 vs ${avgNoP.toFixed(1)}/5 on days without`,
        strength,
      })
    }
  }

  return insights
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
}

// ─── Chart Card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title, info, children, span2,
}: {
  title:    string
  info?:    string
  children: React.ReactNode
  span2?:   boolean
}) {
  return (
    <div className={`rounded-card bg-white/60 border border-sandstone p-4 shadow-warm-sm space-y-3 ${span2 ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-deep">{title}</h3>
        {info && (
          <span title={info} className="text-twilight/50 hover:text-twilight cursor-help">
            <Info size={14} />
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range,    setRange]    = useState<TimeRange>('30D')
  const [loading,  setLoading]  = useState(true)

  // Raw data from DB
  const [dailyLogs,   setDailyLogs]   = useState<DailyRow[]>([])
  const [urgeLogs,    setUrgeLogs]    = useState<UrgeRow[]>([])
  const [reflections, setReflections] = useState<WeeklyRow[]>([])
  const [startDate,   setStartDate]   = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [
        { data: profile },
        { data: logs },
        { data: urges },
        { data: refl },
      ] = await Promise.all([
        supabase.from('profiles').select('sadhana_start_date').eq('id', user.id).single(),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date'),
        supabase.from('urge_logs').select('*').eq('user_id', user.id).order('logged_at').limit(1000),
        supabase.from('weekly_reflections').select('*').eq('user_id', user.id).order('week_number'),
      ])

      setStartDate(profile?.sadhana_start_date ?? null)
      setDailyLogs(logs  ?? [])
      setUrgeLogs(urges   ?? [])
      setReflections(refl ?? [])
      setLoading(false)
    })()
  }, [])

  // ── Filtered data ─────────────────────────────────────────────────────────
  const cutoff = useMemo(() => cutoffDate(range), [range])

  const filteredLogs = useMemo(
    () => dailyLogs.filter((l) => l.log_date >= cutoff),
    [dailyLogs, cutoff]
  )
  const filteredUrges = useMemo(
    () => urgeLogs.filter((u) => u.logged_at.slice(0, 10) >= cutoff),
    [urgeLogs, cutoff]
  )

  // ── Chart data ────────────────────────────────────────────────────────────

  const streakDays = useMemo(
    () => filteredLogs.map((l) => ({ date: l.log_date, maintained: l.streak_maintained })),
    [filteredLogs]
  )

  const moodTrend = useMemo(
    () => filteredLogs.map((l) => ({
      date:       l.log_date,
      mood:       l.mood_score,
      meditation: l.meditation_minutes,
    })),
    [filteredLogs]
  )

  const urgeFreqWeeks = useMemo(() => {
    const buckets: Record<string, { count: number; intensities: number[]; held: number }> = {}
    for (const u of filteredUrges) {
      const k = weekStart(u.logged_at.slice(0, 10))
      if (!buckets[k]) buckets[k] = { count: 0, intensities: [], held: 0 }
      buckets[k].count++
      buckets[k].intensities.push(u.intensity)
      if (u.held_strong) buckets[k].held++
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, v]) => ({
        week:         weekLabel(wk),
        count:        v.count,
        avgIntensity: v.intensities.length ? v.intensities.reduce((a, b) => a + b, 0) / v.intensities.length : 0,
        winRate:      v.count > 0 ? v.held / v.count : 1,
      }))
  }, [filteredUrges])

  const urgeHeatCells = useMemo(() => {
    const map: Record<string, number> = {}
    for (const u of urgeLogs) {   // use ALL urge logs for pattern recognition
      const d   = new Date(u.logged_at)
      const key = `${d.getDay()}-${d.getHours()}`
      map[key] = (map[key] ?? 0) + 1
    }
    const cells = Object.entries(map).map(([k, count]) => {
      const [day, hour] = k.split('-').map(Number)
      return { day, hour, count }
    })
    return cells
  }, [urgeLogs])

  const urgeHeatMax = useMemo(
    () => urgeHeatCells.reduce((m, c) => Math.max(m, c.count), 0),
    [urgeHeatCells]
  )

  const ritualDays = useMemo(
    () => filteredLogs.slice(-60).map((l) => ({
      date:       l.log_date,
      meditation: l.meditation_minutes > 0 ? 1 : 0,
      pranayama:  l.pranayama_done ? 1 : 0,
      prayer:     anyPrayerDone(l.prayers_completed) ? 1 : 0,
      skincare:   (l.skincare_morning || l.skincare_evening) ? 1 : 0,
      exercise:   l.exercise_done ? 1 : 0,
      shloka:     l.shloka_learned_id !== null ? 1 : 0,
    })),
    [filteredLogs]
  )

  const pranayamaData = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {}
    for (const l of filteredLogs) {
      if (!l.pranayama_done) continue
      const k    = weekStart(l.log_date)
      const type = l.pranayama_type ?? 'Unspecified'
      if (!buckets[k]) buckets[k] = {}
      buckets[k][type] = (buckets[k][type] ?? 0) + 1
    }
    const allTypes = Array.from(
      new Set(Object.values(buckets).flatMap((v) => Object.keys(v)))
    ).sort()
    const weeks = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, types]) => ({ week: weekLabel(wk), ...types }))
    return { weeks, types: allTypes }
  }, [filteredLogs])

  const gratitudeWords = useMemo(() => wordFrequencies(filteredLogs), [filteredLogs])

  const holisticScores = useMemo(() => {
    const buckets = bucketByWeek(dailyLogs, urgeLogs, reflections)
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([wk, bucket]) => ({
        week:  `Wk ${weekLabel(wk)}`,
        score: computeWeekScore(bucket),
      }))
  }, [dailyLogs, urgeLogs, reflections])

  const correlationInsights = useMemo(
    () => computeCorrelations(dailyLogs, urgeLogs),
    [dailyLogs, urgeLogs]
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  const RANGE_OPTIONS: TimeRange[] = ['7D', '14D', '30D', 'All']

  const cardVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.35, delay: i * 0.07 },
    }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-2 space-y-3">
          <div>
            <h1 className="font-devanagari text-2xl text-indigo-deep">दर्पण</h1>
            <p className="text-xs text-twilight italic font-display">The Mirror of Your Sadhana</p>
          </div>
          <div className="flex gap-1.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                  range === r
                    ? 'bg-sacred-saffron text-dawn-white'
                    : 'bg-sandstone text-twilight hover:bg-sandstone/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-card bg-sandstone/40 h-56 animate-pulse" />
            ))}
          </div>
        ) : dailyLogs.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-4xl">🪞</p>
            <p className="font-display text-xl text-indigo-deep">Your mirror is forming. Keep practicing.</p>
            <p className="text-sm text-twilight/70">Every day you log builds the reflection. Start now — the mirror will show what you put into it.</p>
          </div>
        ) : dailyLogs.length < 7 ? (
          <div className="space-y-4">
            <div className="rounded-card border border-sandstone bg-parchment/60 p-6 text-center">
              <p className="text-2xl mb-2">🌱</p>
              <p className="font-display text-lg text-indigo-deep font-semibold">
                Your mirror is forming. Keep practicing.
              </p>
              <p className="text-sm text-twilight mt-1">
                {7 - dailyLogs.length} more days of logging will unlock full analytics.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1. Holistic Score */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants} className="md:col-span-2">
              <ChartCard
                title="साधना स्कोर — Holistic Sadhana Score"
                info="Composite score (0–100) from streak, rituals, meditation, urge resistance, reflection, and scripture study"
                span2
              >
                <HolisticScoreChart weeks={holisticScores} />
              </ChartCard>
            </motion.div>

            {/* 2. Streak Timeline */}
            <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Streak Timeline"
                info="Each cell = one day. Orange = current streak, green = past streak, tan = break"
              >
                <StreakTimelineChart days={streakDays} startDate={startDate} />
              </ChartCard>
            </motion.div>

            {/* 3. Mood Trend */}
            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Mood Trend"
                info="Indigo line = mood (1–5). Grey bars = meditation minutes. Green band = positive, rose band = low."
              >
                <MoodTrendChart data={moodTrend} />
              </ChartCard>
            </motion.div>

            {/* 4. Urge Frequency */}
            <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Urge Frequency"
                info="Bars = urges per week colored by avg intensity. Green line = % held strong (win rate)."
              >
                <UrgeFrequencyChart weeks={urgeFreqWeeks} />
              </ChartCard>
            </motion.div>

            {/* 5. Urge Heatmap */}
            <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Urge Heatmap"
                info="When do urges hit most? Darker = more frequent. Shows patterns across day-of-week and hour."
              >
                <UrgeHeatmapChart cells={urgeHeatCells} maxCount={urgeHeatMax} />
              </ChartCard>
            </motion.div>

            {/* 6. Ritual Consistency */}
            <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Ritual Consistency"
                info="Each bar = one day. Stacked segments show which practices were completed. Taller = more consistent."
              >
                <RitualConsistencyChart days={ritualDays} />
              </ChartCard>
            </motion.div>

            {/* 7. Pranayama Progress */}
            <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Pranayama Progress"
                info="Weekly pranayama sessions stacked by technique. Are you diversifying your practice?"
              >
                <PranayamaProgressChart
                  weeks={pranayamaData.weeks}
                  types={pranayamaData.types}
                />
              </ChartCard>
            </motion.div>

            {/* 8. Gratitude Word Cloud */}
            <motion.div custom={7} initial="hidden" animate="visible" variants={cardVariants}>
              <ChartCard
                title="Gratitude Patterns"
                info="Most frequently mentioned words across your gratitude journal entries. Larger = more frequent."
              >
                <GratitudeWordCloud words={gratitudeWords} />
              </ChartCard>
            </motion.div>

            {/* 9. Correlation Insights — full width */}
            <motion.div custom={8} initial="hidden" animate="visible" variants={cardVariants} className="md:col-span-2">
              <ChartCard
                title="🔍 Correlation Insights"
                info="Auto-detected patterns linking your habits to outcomes. Based on all your logged data."
                span2
              >
                <CorrelationInsightsCard insights={correlationInsights} />
              </ChartCard>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  )
}
