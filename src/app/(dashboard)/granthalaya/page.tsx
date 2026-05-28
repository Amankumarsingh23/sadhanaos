'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { BookMarked } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { ShlokCard } from '@/components/sacred/ShlokCard'
import {
  SCRIPTURE_KEYS, getAllVerses, getScriptureMeta,
  getShlokCardProps, getDailyShlokas,
  type ScriptureKey,
} from '@/lib/scriptures'

export default function GranthalayaPage() {
  const [loading, setLoading]     = useState(true)
  const [studiedMap, setStudied]  = useState<Record<string, number>>({})

  const dailyShloka = useMemo(() => getDailyShlokas()[0], [])
  const totalVerses = useMemo(() => getAllVerses().length, [])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('scripture_progress')
        .select('scripture_name')
        .eq('user_id', user.id)
        .eq('completed', true)

      const map: Record<string, number> = {}
      for (const row of data ?? []) {
        map[row.scripture_name] = (map[row.scripture_name] ?? 0) + 1
      }
      setStudied(map)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream px-4 py-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-devanagari text-4xl text-indigo-deep">ग्रंथालय</h1>
          <p className="text-sm text-twilight font-display italic">
            Sacred Library · {totalVerses} curated verses across 6 texts
          </p>
        </div>

        {/* Today's verse */}
        {dailyShloka && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
              आज का श्लोक · Today&apos;s Verse
            </h2>
            <ShlokCard
              {...getShlokCardProps(dailyShloka)}
              className="shadow-gold-glow"
            />
          </section>
        )}

        {/* Bookmarks shortcut */}
        <Link
          href="/granthalaya/bookmarks"
          className="flex items-center gap-2 text-sm text-indigo-mid hover:text-sacred-saffron transition-colors w-fit"
        >
          <BookMarked size={15} />
          View all bookmarks
        </Link>

        {/* Empty state — first-time visitor */}
        {!loading && Object.keys(studiedMap).length === 0 && (
          <EmptyState
            icon="📖"
            title="Open a verse, begin your study. The Gita awaits."
            description="Choose any scripture below to start your journey through the sacred texts."
          />
        )}

        {/* Scripture grid */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
            Scriptures
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SCRIPTURE_KEYS.map((key: ScriptureKey) => {
              const meta    = getScriptureMeta(key)
              const studied = studiedMap[key] ?? 0
              const pct     = meta.totalVerses > 0 ? (studied / meta.totalVerses) * 100 : 0
              return (
                <Link key={key} href={`/granthalaya/${key}`}>
                  <div className={`rounded-card border bg-parchment p-5 shadow-warm-sm hover:shadow-gold-glow transition-all space-y-3 cursor-pointer h-full ${meta.accentClass}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl leading-none mt-0.5">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-devanagari text-lg text-indigo-deep leading-tight">{meta.titleHi}</p>
                        <p className="text-xs text-twilight">{meta.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-twilight leading-relaxed line-clamp-2">{meta.description}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-twilight">
                        <span>{loading ? '—' : `${studied} / ${meta.totalVerses} studied`}</span>
                        {!loading && pct > 0 && <span>{Math.round(pct)}%</span>}
                      </div>
                      <div className="h-1 bg-sandstone rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sacred-saffron rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-xs text-twilight/60 italic truncate pr-2">{meta.translator}</p>
                      <span className="text-xs text-indigo-mid font-medium shrink-0">Study →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
