'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

// ── Exported types ─────────────────────────────────────────────────────────
export type ProfileRow     = Database['public']['Tables']['profiles']['Row']
export type DailyLogRow    = Database['public']['Tables']['daily_logs']['Row']
export type AffirmationRow = Database['public']['Tables']['affirmations']['Row']

export interface PracticesConfig {
  brahma_muhurta?: boolean
  meditation?: boolean
  meditation_minutes?: number
  pranayama?: boolean
  prayer?: boolean
  prayer_times?: string[]
  shloka_study?: boolean
  gratitude?: boolean
  skincare?: boolean
  exercise?: boolean
  water_intake?: boolean
}

export interface WeeklyStats {
  meditationMinutes: number
  urgesResisted: number
  shlokasStudied: number
  prayerRate: number
}

export interface DashboardData {
  loading: boolean
  profile: ProfileRow | null
  todayLog: DailyLogRow | null
  weekLogs: DailyLogRow[]
  affirmations: AffirmationRow[]
  streak: number
  dayNumber: number
  practicesConfig: PracticesConfig
  weeklyStats: WeeklyStats
  updateTodayLog: (patch: Database['public']['Tables']['daily_logs']['Update']) => Promise<void>
}

// ── Helper ─────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0] }

function daysAgoISO(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

function extractPracticesConfig(profile: ProfileRow | null): PracticesConfig {
  const ps = profile?.prayer_schedule
  if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
    const pso = ps as Record<string, unknown>
    if ('practices' in pso && typeof pso.practices === 'object' && pso.practices !== null) {
      return pso.practices as PracticesConfig
    }
  }
  // Default: all on
  return {
    meditation: true, meditation_minutes: 15, pranayama: true, prayer: true,
    shloka_study: true, gratitude: true, skincare: true, exercise: true, water_intake: true,
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useDashboardData(): DashboardData {
  const [loading, setLoading]           = useState(true)
  const [profile, setProfile]           = useState<ProfileRow | null>(null)
  const [todayLog, setTodayLog]         = useState<DailyLogRow | null>(null)
  const [weekLogs, setWeekLogs]         = useState<DailyLogRow[]>([])
  const [affirmations, setAffirmations] = useState<AffirmationRow[]>([])
  const [streak, setStreak]             = useState(0)
  const [weeklyStats, setWeeklyStats]   = useState<WeeklyStats>({
    meditationMinutes: 0, urgesResisted: 0, shlokasStudied: 0, prayerRate: 0,
  })

  const today   = todayISO()
  const weekAgo = daysAgoISO(7)

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Parallel fetches
    const [profileRes, weekLogsRes, affRes, streakRes, urgeRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', weekAgo).order('log_date'),
      supabase.from('affirmations').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('v_current_streak').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('urge_logs').select('id, held_strong').eq('user_id', user.id)
        .gte('logged_at', weekAgo + 'T00:00:00'),
    ])

    const profileData = profileRes.data
    const logs        = weekLogsRes.data ?? []
    const affs        = affRes.data ?? []
    const streakData  = streakRes.data

    setProfile(profileData)
    setAffirmations(affs)
    setStreak(streakData?.current_streak ?? 0)
    setWeekLogs(logs)

    // Today's log — create if missing
    let todayLogData = logs.find(l => l.log_date === today) ?? null
    if (!todayLogData && profileData) {
      const { data: newLog } = await supabase.from('daily_logs').insert({
        user_id: user.id,
        log_date: today,
        streak_maintained: false,
        meditation_minutes: 0,
        pranayama_done: false,
        prayers_completed: [],
        skincare_morning: false,
        skincare_evening: false,
        water_glasses: 0,
        exercise_done: false,
      }).select().single()
      todayLogData = newLog
    }
    setTodayLog(todayLogData)

    // Weekly stats
    const urges              = urgeRes.data ?? []
    const weekMedMinutes     = logs.reduce((s, l) => s + (l.meditation_minutes ?? 0), 0)
    const urgesResisted      = urges.filter(u => u.held_strong).length
    const shlokasStudied     = logs.filter(l => Boolean(l.shloka_learned_id)).length
    const prayerDays         = logs.filter(l => {
      const p = l.prayers_completed
      return Array.isArray(p) ? p.length > 0 : Boolean(p)
    }).length
    const prayerRate = logs.length > 0 ? Math.round((prayerDays / logs.length) * 100) : 0

    setWeeklyStats({ meditationMinutes: weekMedMinutes, urgesResisted, shlokasStudied, prayerRate })
    setLoading(false)
  }, [today, weekAgo])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateTodayLog = useCallback(async (
    patch: Database['public']['Tables']['daily_logs']['Update']
  ) => {
    if (!todayLog) return
    setTodayLog(prev => prev ? { ...prev, ...patch } : prev)
    await supabase.from('daily_logs').update(patch).eq('id', todayLog.id)
  }, [todayLog])

  // Day number: calendar days since start (not streak)
  const dayNumber = profile?.sadhana_start_date
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.sadhana_start_date).getTime()) / 86400000) + 1)
    : Math.max(streak, 1)

  const practicesConfig = extractPracticesConfig(profile)

  return { loading, profile, todayLog, weekLogs, affirmations, streak, dayNumber, practicesConfig, weeklyStats, updateTodayLog }
}
