'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ShlokCard } from '@/components/sacred/ShlokCard'
import {
  findVerse, getShlokCardProps, SCRIPTURE_META, SCRIPTURE_KEYS,
  type ScriptureKey,
} from '@/lib/scriptures'
import type { Database } from '@/types/database'

type ProgressRow = Database['public']['Tables']['scripture_progress']['Row']

interface Resolved {
  verse:    NonNullable<ReturnType<typeof findVerse>>
  row:      ProgressRow
}

export default function BookmarksPage() {
  const [loading,   setLoading]   = useState(true)
  const [bookmarks, setBookmarks] = useState<ProgressRow[]>([])
  const [filter,    setFilter]    = useState<ScriptureKey | 'all'>('all')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('scripture_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('bookmarked', true)
        .order('scripture_name')
      setBookmarks(data ?? [])
      setLoading(false)
    })()
  }, [])

  const resolved = useMemo<Resolved[]>(() => {
    return bookmarks
      .map((row) => {
        const verse = findVerse(row.scripture_name as ScriptureKey, row.chapter, row.verse)
        return verse ? { verse, row } : null
      })
      .filter((x): x is Resolved => x !== null)
  }, [bookmarks])

  const scriptures = useMemo<ScriptureKey[]>(() => {
    const keys = resolved.map((r) => r.verse.scriptureKey)
    return SCRIPTURE_KEYS.filter((k) => keys.includes(k))
  }, [resolved])

  const filtered = useMemo<Resolved[]>(() => {
    if (filter === 'all') return resolved
    return resolved.filter((r) => r.verse.scriptureKey === filter)
  }, [resolved, filter])

  async function removeBookmark(row: ProgressRow) {
    await supabase.from('scripture_progress').update({ bookmarked: false }).eq('id', row.id)
    setBookmarks((prev) => prev.filter((r) => r.id !== row.id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/granthalaya" className="text-twilight hover:text-indigo-deep transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-devanagari text-indigo-deep">बुकमार्क्स</h1>
            <p className="text-xs text-twilight">
              {loading ? '…' : `${bookmarks.length} bookmarked verse${bookmarks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Scripture filter tabs */}
      {!loading && scriptures.length > 1 && (
        <div className="border-b border-sandstone/50">
          <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-none px-4 py-2 flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`shrink-0 px-3 py-1 rounded-card text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-indigo-deep text-dawn-white'
                  : 'bg-sandstone text-twilight hover:bg-sandstone/60'
              }`}
            >
              All ({resolved.length})
            </button>
            {scriptures.map((key) => {
              const count = resolved.filter((r) => r.verse.scriptureKey === key).length
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 px-3 py-1 rounded-card text-xs font-medium transition-all ${
                    filter === key
                      ? 'bg-indigo-deep text-dawn-white'
                      : 'bg-sandstone text-twilight hover:bg-sandstone/60'
                  }`}
                >
                  {SCRIPTURE_META[key].icon} {SCRIPTURE_META[key].title.split(' ')[0]} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-card bg-sandstone/40 h-44 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🔖</p>
            <p className="text-twilight font-display">No bookmarked verses yet</p>
            <p className="text-xs text-twilight/60">
              Open any scripture and tap the bookmark icon on a verse
            </p>
            <Link
              href="/granthalaya"
              className="inline-block mt-2 text-sm text-indigo-mid hover:text-sacred-saffron transition-colors"
            >
              Browse scriptures →
            </Link>
          </div>
        ) : (
          filtered.map(({ verse, row }) => (
            <ShlokCard
              key={row.id}
              {...getShlokCardProps(verse)}
              isBookmarked={true}
              onBookmark={() => removeBookmark(row)}
            />
          ))
        )}
      </div>
    </div>
  )
}
