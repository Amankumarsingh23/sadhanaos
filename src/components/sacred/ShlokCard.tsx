'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShlokCardProps {
  id?: string
  sanskrit?: string
  transliteration?: string
  hindi_meaning?: string
  english_meaning?: string
  /* Legacy compat */
  hindi?: string
  english?: string
  context?: string
  practical_application?: string
  source: string
  chapter?: string | number
  verse?: string | number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  related_theme?: string[]
  isBookmarked?: boolean
  onBookmark?: (id: string) => void
  defaultLang?: 'en' | 'hi'
  className?: string
}

const difficultyColor = {
  beginner:     'text-sage-green',
  intermediate: 'text-warm-clay',
  advanced:     'text-lotus-pink',
}

export function ShlokCard({
  id = '',
  sanskrit,
  transliteration,
  hindi_meaning,
  english_meaning,
  hindi,
  english,
  context,
  practical_application,
  source,
  chapter,
  verse,
  difficulty,
  related_theme,
  isBookmarked = false,
  onBookmark,
  defaultLang = 'en',
  className,
}: ShlokCardProps) {
  const [lang, setLang] = useState<'en' | 'hi'>(defaultLang)
  const [expanded, setExpanded] = useState(false)
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  const meaning = lang === 'hi'
    ? (hindi_meaning ?? hindi ?? english_meaning ?? english ?? '')
    : (english_meaning ?? english ?? '')

  const hasMeaning = Boolean(meaning)
  const hasInsight = Boolean(context || practical_application)
  const sourceRef = chapter && verse
    ? `— ${source} ${chapter}.${verse}`
    : `— ${source}`

  function handleBookmark() {
    setBookmarked((b) => !b)
    onBookmark?.(id)
  }

  return (
    <div
      className={cn(
        'relative rounded-card border border-sandstone bg-parchment',
        'shadow-warm-sm overflow-hidden shlok-card-bg',
        className
      )}
    >
      {/* Top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-sacred-saffron/60 via-temple-gold/60 to-transparent" />

      <div className="px-5 pt-4 pb-5 space-y-3">

        {/* Sanskrit */}
        {sanskrit && (
          <p
            className="font-devanagari text-lg leading-loose text-indigo-deep text-center"
            lang="sa"
          >
            {sanskrit}
          </p>
        )}

        {/* Transliteration */}
        {transliteration && (
          <p className="text-xs text-indigo-mid italic text-center leading-relaxed font-body">
            {transliteration}
          </p>
        )}

        {/* Divider */}
        {(sanskrit || transliteration) && hasMeaning && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-sandstone" />
            {/* Language toggle */}
            {(hindi_meaning || hindi) && (english_meaning || english) && (
              <button
                onClick={() => setLang((l) => l === 'en' ? 'hi' : 'en')}
                className="text-xs text-twilight hover:text-sacred-saffron transition-colors px-2 py-0.5 rounded border border-sandstone hover:border-sacred-saffron/40 font-medium"
              >
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>
            )}
            <div className="flex-1 h-px bg-sandstone" />
          </div>
        )}

        {/* Meaning */}
        {hasMeaning && (
          <AnimatePresence mode="wait">
            <motion.p
              key={lang}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'text-sm leading-relaxed text-indigo-mid',
                lang === 'hi' && 'font-devanagari text-base'
              )}
              lang={lang === 'hi' ? 'hi' : 'en'}
            >
              {meaning}
            </motion.p>
          </AnimatePresence>
        )}

        {/* Source ref */}
        <p className="text-xs text-sacred-saffron font-medium font-display italic">
          {sourceRef}
        </p>

        {/* Tags row */}
        {(difficulty || related_theme?.length) && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {difficulty && (
              <span className={cn('text-xs font-medium capitalize', difficultyColor[difficulty])}>
                {difficulty}
              </span>
            )}
            {related_theme?.slice(0, 3).map((t) => (
              <span key={t} className="text-xs text-twilight bg-sandstone/60 px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Expandable insight */}
        {hasInsight && (
          <div className="border-t border-sandstone/60 pt-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-sacred-saffron hover:text-saffron-deep font-medium transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide insight' : 'Practical insight'}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{    height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    {context && (
                      <p className="text-xs text-twilight leading-relaxed italic">{context}</p>
                    )}
                    {practical_application && (
                      <p className="text-xs text-indigo-mid leading-relaxed">{practical_application}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        className={cn(
          'absolute top-3 right-3 transition-colors',
          bookmarked ? 'text-temple-gold' : 'text-sandstone hover:text-sacred-saffron'
        )}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
      >
        {bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </button>
    </div>
  )
}
