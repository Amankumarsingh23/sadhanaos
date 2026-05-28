'use client'

import { use, useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShlokCard } from '@/components/sacred/ShlokCard'
import {
  isValidScriptureKey, getScriptureMeta, getGroupVerses, getShlokCardProps,
  type ScriptureKey, type UniversalVerse,
} from '@/lib/scriptures'
import type { Database } from '@/types/database'

type ProgressRow    = Database['public']['Tables']['scripture_progress']['Row']
type ProgressInsert = Database['public']['Tables']['scripture_progress']['Insert']

export default function ScriptureDetailPage({ params }: { params: Promise<{ scripture: string }> }) {
  const { scripture } = use(params)

  if (!isValidScriptureKey(scripture)) notFound()

  const scriptureKey = scripture as ScriptureKey
  const meta         = useMemo(() => getScriptureMeta(scriptureKey), [scriptureKey])

  const [userId,        setUserId]  = useState<string | null>(null)
  const [progress,      setProgress] = useState<ProgressRow[]>([])
  const [loading,       setLoading]  = useState(true)
  const [selectedGroup, setGroup]    = useState(meta.groups[0]?.key ?? '')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('scripture_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('scripture_name', scriptureKey)
      setProgress(data ?? [])
      setLoading(false)
    })()
  }, [scriptureKey])

  const progressMap = useMemo(() => {
    const map = new Map<string, ProgressRow>()
    for (const row of progress) map.set(`${row.chapter}:${row.verse}`, row)
    return map
  }, [progress])

  const studiedCount = useMemo(() => progress.filter((r) => r.completed).length, [progress])
  const verses       = useMemo(() => getGroupVerses(scriptureKey, selectedGroup), [scriptureKey, selectedGroup])

  const toggleVerse = useCallback(async (verse: UniversalVerse, field: 'completed' | 'bookmarked') => {
    if (!userId) return
    const key      = `${verse.chapter}:${verse.verse}`
    const existing = progressMap.get(key)
    const newVal   = !(existing?.[field] ?? false)

    if (existing) {
      const upd = field === 'completed'
        ? { completed: newVal, completed_at: newVal ? new Date().toISOString() : null }
        : { bookmarked: newVal }
      const { data } = await supabase
        .from('scripture_progress')
        .update(upd)
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setProgress((prev) => prev.map((r) => r.id === data.id ? data : r))
    } else {
      const ins: ProgressInsert = {
        user_id:       userId,
        scripture_name: scriptureKey,
        chapter:        verse.chapter,
        verse:          verse.verse,
        ...(field === 'completed'
          ? { completed: newVal, completed_at: newVal ? new Date().toISOString() : null }
          : { bookmarked: newVal }),
      }
      const { data } = await supabase
        .from('scripture_progress')
        .insert(ins)
        .select()
        .single()
      if (data) setProgress((prev) => [...prev, data])
    }
  }, [userId, progressMap, scriptureKey])

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/granthalaya" className="text-twilight hover:text-indigo-deep transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-devanagari text-indigo-deep leading-tight truncate">{meta.titleHi}</h1>
            <p className="text-xs text-twilight">
              {loading ? '…' : `${studiedCount} / ${meta.totalVerses} studied`}
            </p>
          </div>
          <span className="text-2xl">{meta.icon}</span>
        </div>

        {/* Group tabs */}
        <div className="overflow-x-auto scrollbar-none border-t border-sandstone/50">
          <div className="flex gap-1 px-4 py-2">
            {meta.groups.map((g) => (
              <button
                key={g.key}
                onClick={() => setGroup(g.key)}
                className={`shrink-0 px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                  selectedGroup === g.key
                    ? 'bg-sacred-saffron text-dawn-white'
                    : 'bg-sandstone text-twilight hover:bg-sandstone/60'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verse list */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-card bg-sandstone/40 h-52 animate-pulse" />
          ))
        ) : verses.length === 0 ? (
          <p className="text-center text-twilight text-sm py-12">No verses in this section.</p>
        ) : (
          verses.map((verse) => {
            const pRow       = progressMap.get(`${verse.chapter}:${verse.verse}`)
            const isStudied  = pRow?.completed   ?? false
            const isBookmarked = pRow?.bookmarked ?? false
            return (
              <div key={verse.id} className="space-y-2">
                <ShlokCard
                  {...getShlokCardProps(verse)}
                  isBookmarked={isBookmarked}
                  onBookmark={() => toggleVerse(verse, 'bookmarked')}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => toggleVerse(verse, 'completed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                      isStudied
                        ? 'bg-sage-green/15 text-sage-green border border-sage-green/30'
                        : 'bg-sandstone text-twilight hover:bg-sage-green/10 hover:text-sage-green border border-transparent'
                    }`}
                  >
                    <Check size={11} />
                    {isStudied ? 'Studied ✓' : 'Mark as Studied'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
