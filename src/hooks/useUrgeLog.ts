'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UrgeLogRow    = Database['public']['Tables']['urge_logs']['Row']
type UrgeLogInsert = Database['public']['Tables']['urge_logs']['Insert']

export type { UrgeLogRow }

export interface UrgeStats {
  total:        number
  resisted:     number
  winRate:      number
  avgIntensity: number
  topTrigger:   string | null
  topAction:    string | null
}

export interface UseUrgeLogReturn {
  logs:      UrgeLogRow[]
  stats:     UrgeStats
  streak:    number
  loading:   boolean
  createLog: (entry: Omit<UrgeLogInsert, 'user_id'>) => Promise<UrgeLogRow | null>
}

function computeStats(logs: UrgeLogRow[]): UrgeStats {
  if (!logs.length) {
    return { total: 0, resisted: 0, winRate: 0, avgIntensity: 0, topTrigger: null, topAction: null }
  }

  const resisted     = logs.filter(l => l.held_strong).length
  const winRate      = Math.round((resisted / logs.length) * 100)
  const avgIntensity = parseFloat(
    (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1)
  )

  const triggerCounts: Record<string, number> = {}
  for (const log of logs) {
    for (const tag of (log.trigger_tags ?? [])) {
      triggerCounts[tag] = (triggerCounts[tag] ?? 0) + 1
    }
  }
  const topTrigger =
    Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  const actionCounts: Record<string, number> = {}
  for (const log of logs) {
    if (log.action_taken) {
      actionCounts[log.action_taken] = (actionCounts[log.action_taken] ?? 0) + 1
    }
  }
  const topAction =
    Object.entries(actionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  return { total: logs.length, resisted, winRate, avgIntensity, topTrigger, topAction }
}

export function useUrgeLog(): UseUrgeLogReturn {
  const [logs,    setLogs]    = useState<UrgeLogRow[]>([])
  const [streak,  setStreak]  = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [logsRes, streakRes] = await Promise.all([
        supabase
          .from('urge_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false }),
        supabase
          .from('v_current_streak')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      setLogs(logsRes.data ?? [])
      setStreak(streakRes.data?.current_streak ?? 0)
      setLoading(false)
    })()
  }, [])

  const createLog = useCallback(
    async (entry: Omit<UrgeLogInsert, 'user_id'>): Promise<UrgeLogRow | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('urge_logs')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single()
      if (data) setLogs(prev => [data, ...prev])
      return data
    },
    []
  )

  const stats = useMemo(() => computeStats(logs), [logs])
  return { logs, stats, streak, loading, createLog }
}
