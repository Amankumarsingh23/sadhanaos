'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const MOODS = [
  { score: 1, label: 'Very low',  emoji: '😔' },
  { score: 2, label: 'Low',       emoji: '😕' },
  { score: 3, label: 'Okay',      emoji: '😐' },
  { score: 4, label: 'Good',      emoji: '🙂' },
  { score: 5, label: 'Excellent', emoji: '😄' },
]

interface Props {
  userId:   string
  today:    string       // YYYY-MM-DD
  onLogged: () => void   // called after save so parent can refresh
  onExpand: () => void   // switch to full log
}

export function QuickLogCard({ userId, today, onLogged, onExpand }: Props) {
  const [meditation, setMeditation] = useState(false)
  const [prayer,     setPrayer]     = useState(false)
  const [streak,     setStreak]     = useState(true)
  const [mood,       setMood]       = useState<number | null>(null)
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [done,       setDone]       = useState(false)

  const handleSave = async () => {
    if (mood === null) return  // mood is the one required field
    setSaving(true)
    try {
      await supabase.from('daily_logs').upsert({
        user_id:            userId,
        log_date:           today,
        streak_maintained:  streak,
        meditation_minutes: meditation ? 15 : 0,
        prayers_completed:  prayer ? { morning: true } : {},
        mood_score:         mood,
        notes:              note || null,
      }, { onConflict: 'user_id,log_date' })

      setDone(true)
      setTimeout(onLogged, 1600)
    } catch {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-card border border-sage-green/40 bg-sage-green/6 p-4 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-sage-green/20 flex items-center justify-center shrink-0">
          <Check size={16} className="text-sage-green" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-deep">🙏 Logged!</p>
          <button onClick={onExpand} className="text-xs text-twilight underline hover:text-sacred-saffron">
            Add more detail →
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="rounded-card border-2 border-sacred-saffron/30 bg-gradient-to-br from-sacred-saffron/4 to-parchment shadow-warm-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sacred-saffron/15">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-sacred-saffron" />
          <p className="text-sm font-semibold text-indigo-deep">⚡ Quick Log</p>
          <span className="text-[10px] text-twilight bg-sandstone/60 px-2 py-0.5 rounded-full">5 taps</span>
        </div>
        <button
          onClick={onExpand}
          className="flex items-center gap-1 text-xs text-twilight hover:text-sacred-saffron transition-colors"
        >
          Full form <ChevronDown size={12} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Streak + practices row */}
        <div className="flex gap-2 flex-wrap">
          {/* Streak */}
          <button
            onClick={() => setStreak(!streak)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
              streak
                ? 'bg-sage-green/12 border-sage-green/40 text-sage-green'
                : 'bg-rose-red/10 border-rose-red/30 text-rose-red'
            }`}
          >
            {streak ? '🔥' : '💔'} {streak ? 'Streak: Yes' : 'Streak: No'}
          </button>

          {/* Meditation */}
          <button
            onClick={() => setMeditation(!meditation)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
              meditation
                ? 'bg-indigo-mid/10 border-indigo-mid/40 text-indigo-mid'
                : 'bg-sandstone/40 border-sandstone text-twilight'
            }`}
          >
            🧘 Meditation
          </button>

          {/* Prayer */}
          <button
            onClick={() => setPrayer(!prayer)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
              prayer
                ? 'bg-sacred-saffron/12 border-sacred-saffron/40 text-sacred-saffron'
                : 'bg-sandstone/40 border-sandstone text-twilight'
            }`}
          >
            🙏 Prayer
          </button>
        </div>

        {/* Mood */}
        <div>
          <p className="text-xs text-twilight mb-2">How are you feeling? <span className="text-rose-red">*</span></p>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button
                key={m.score}
                onClick={() => setMood(m.score)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all active:scale-95 ${
                  mood === m.score
                    ? 'bg-sacred-saffron/12 border-sacred-saffron/50 scale-105'
                    : 'bg-sandstone/20 border-sandstone/60 hover:bg-sandstone/40'
                }`}
              >
                <span className="text-lg leading-none">{m.emoji}</span>
                <span className="text-[9px] text-twilight mt-1 leading-none">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional note */}
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="One thought for today (optional)"
          className="w-full text-sm bg-sandstone/20 rounded-xl px-3 py-2.5 border border-sandstone focus:outline-none focus:border-sacred-saffron text-indigo-deep placeholder:text-twilight/40"
        />

        {/* Save */}
        <AnimatePresence>
          {mood !== null && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-sacred-saffron text-dawn-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <Check size={16} />
              {saving ? 'Saving…' : 'Log Today 🙏'}
            </motion.button>
          )}
        </AnimatePresence>

        {mood === null && (
          <p className="text-xs text-twilight/50 text-center">Select your mood to save</p>
        )}
      </div>
    </div>
  )
}
