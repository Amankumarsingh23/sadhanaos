'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

// ─── Verified shlokas per miss-reason ─────────────────────────────────────────
// All from Bhagavad Gita — Swami Chinmayananda translation

const REASON_SHLOKAS: Record<string, { sanskrit: string; meaning: string; source: string; response: string }> = {
  stress: {
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥',
    meaning:  'The contact of senses with objects gives rise to heat and cold, pleasure and pain. They come and go — impermanent. Endure them, O Arjuna.',
    source:   'Bhagavad Gita 2.14',
    response: 'Stress is weather. You are the sky. The storm passed — and here you still are.',
  },
  travel: {
    sanskrit: 'यो मां पश्यति सर्वत्र सर्वं च मयि पश्यति।\nतस्याहं न प्रणश्यामि स च मे न प्रणश्यति॥',
    meaning:  'One who sees Me in everything and everything in Me — I am never lost to them, nor are they lost to Me.',
    source:   'Bhagavad Gita 6.30',
    response: 'Sadhana follows you wherever you go. Even one minute of mindfulness while traveling is practice.',
  },
  illness: {
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    meaning:  'Abandon all varieties of duty and surrender unto Me alone. I shall deliver you from all sinful reactions — do not fear.',
    source:   'Bhagavad Gita 18.66',
    response: 'The body needs rest to serve the spirit. Caring for your temple IS sadhana. Rest fully — return stronger.',
  },
  lazy: {
    sanskrit: 'नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः।\nशरीरयात्रापि च ते न प्रसिद्ध्येदकर्मणः॥',
    meaning:  'Perform your prescribed duty — action is better than inaction. Even the maintenance of your body is not possible without action.',
    source:   'Bhagavad Gita 3.8',
    response: 'Laziness is rajas devolving into tamas. You know the antidote. One small action breaks the inertia.',
  },
  family: {
    sanskrit: 'सर्वभूतस्थितं यो मां भजत्येकत्वमास्थितः।\nसर्वथा वर्तमानोऽपि स योगी मयि वर्तते॥',
    meaning:  'The yogi who worships Me as the One dwelling in all beings — though engaged in all activities — lives in Me.',
    source:   'Bhagavad Gita 6.31',
    response: 'Serving your family is dharma. You honored a higher call. Return to yourself now — both matter.',
  },
  other: {
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    meaning:  'Let one lift oneself by oneself — let not one degrade oneself. The self alone is its own friend; the self alone is its own enemy.',
    source:   'Bhagavad Gita 6.5',
    response: 'Whatever happened — you are still here. That is not nothing. That is everything.',
  },
}

const REASONS = [
  { id: 'stress',  label: 'Stress / Anxiety',       emoji: '😰' },
  { id: 'travel',  label: 'Travel / Away',            emoji: '✈️' },
  { id: 'illness', label: 'Illness / Fatigue',        emoji: '🤒' },
  { id: 'lazy',    label: 'Lost focus / Laziness',    emoji: '😴' },
  { id: 'family',  label: 'Family / Responsibility',  emoji: '🏠' },
  { id: 'other',   label: 'Something else',           emoji: '💭' },
]

interface Props {
  userId:     string
  yesterday:  string  // YYYY-MM-DD
  currentStreak: number
  onResolved: () => void  // called when card should disappear
}

type Phase = 'asking' | 'reading' | 'committed' | 'declined'

// localStorage key so the card only shows once per missed day
const graceKey = (yesterday: string) => `sadhanaos_grace_${yesterday}`

export function GraceCard({ userId, yesterday, currentStreak, onResolved }: Props) {
  const { toast } = useToast()
  const [phase,  setPhase]  = useState<Phase>('asking')
  const [reason, setReason] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const shloka = reason ? REASON_SHLOKAS[reason] : null

  const handleReasonSelect = (id: string) => {
    setReason(id)
    setPhase('reading')
  }

  const handleCommit = async () => {
    setSaving(true)
    try {
      // Check if yesterday's log exists
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('id, streak_maintained')
        .eq('user_id', userId)
        .eq('log_date', yesterday)
        .maybeSingle()

      const graceNote = `[GRACE_RECOVERY: ${reason}] Missed yesterday — committed to making up today.`

      if (existing) {
        // Update existing log — mark streak maintained
        await supabase.from('daily_logs').update({
          streak_maintained: true,
          notes: graceNote,
        }).eq('id', existing.id)
      } else {
        // Insert a minimal log for yesterday
        await supabase.from('daily_logs').insert({
          user_id:           userId,
          log_date:          yesterday,
          streak_maintained: true,
          meditation_minutes: 0,
          pranayama_done:    false,
          prayers_completed: {},
          skincare_morning:  false,
          skincare_evening:  false,
          water_glasses:     0,
          exercise_done:     false,
          notes:             graceNote,
        })
      }

      localStorage.setItem(graceKey(yesterday), 'committed')
      setPhase('committed')
      toast('Streak protected 🔥 — make today count.', { type: 'success' })
      setTimeout(onResolved, 2200)
    } catch (err) {
      console.error('[grace]', err)
      toast('Could not save — please try again.', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDecline = () => {
    localStorage.setItem(graceKey(yesterday), 'declined')
    setPhase('declined')
    setTimeout(onResolved, 1800)
  }

  return (
    <AnimatePresence mode="wait">
      {phase === 'asking' && (
        <motion.div
          key="asking"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="rounded-card border-2 border-sacred-saffron/40 bg-gradient-to-br from-sacred-saffron/6 to-parchment shadow-warm-sm overflow-hidden"
        >
          {/* Top strip */}
          <div className="h-1 bg-gradient-to-r from-sacred-saffron/60 via-temple-gold to-sacred-saffron/60" />

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪔</span>
                <div>
                  <p className="font-semibold text-indigo-deep text-sm">कल की साधना छूट गई</p>
                  <p className="text-xs text-twilight italic">Yesterday was missed — your streak is at risk.</p>
                </div>
              </div>
              <button onClick={handleDecline} className="text-twilight/40 hover:text-twilight mt-0.5">
                <X size={16} />
              </button>
            </div>

            {/* Streak at risk */}
            {currentStreak > 1 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-red/6 border border-rose-red/20">
                <span className="text-base">🔥</span>
                <p className="text-xs text-rose-red font-medium">
                  Your <strong>{currentStreak}-day streak</strong> is at risk. You have a 24-hour grace window.
                </p>
              </div>
            )}

            {/* Why question */}
            <div>
              <p className="text-sm text-twilight mb-3 font-display italic">
                क्या हुआ कल? What happened yesterday?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleReasonSelect(r.id)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-sandstone bg-white/60 hover:border-sacred-saffron/50 hover:bg-sacred-saffron/4 active:scale-[0.97] transition-all text-left"
                  >
                    <span className="text-lg shrink-0">{r.emoji}</span>
                    <span className="text-xs text-twilight leading-snug">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accept break */}
            <button
              onClick={handleDecline}
              className="w-full text-xs text-twilight/50 hover:text-twilight transition-colors py-1 text-center"
            >
              Accept the break — I&apos;ll start fresh from today
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'reading' && shloka && (
        <motion.div
          key="reading"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="rounded-card border-2 border-temple-gold/40 bg-gradient-to-br from-temple-gold/6 to-parchment shadow-warm-sm overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-temple-gold/60 via-sacred-saffron to-temple-gold/60" />

          <div className="p-5 space-y-4">
            {/* Shloka */}
            <div className="text-center space-y-3">
              <p className="font-devanagari text-sacred-saffron text-base leading-relaxed whitespace-pre-line">
                {shloka.sanskrit}
              </p>
              <p className="text-xs text-twilight italic leading-relaxed px-4">
                &ldquo;{shloka.meaning}&rdquo;
              </p>
              <p className="text-[10px] text-twilight/50 tracking-wider">{shloka.source}</p>
            </div>

            {/* Rishi response */}
            <div className="rounded-xl bg-indigo-mid/8 border border-indigo-mid/20 px-4 py-3">
              <p className="text-xs font-semibold text-indigo-mid mb-1">ऋषि says:</p>
              <p className="text-sm text-indigo-deep leading-relaxed italic">{shloka.response}</p>
            </div>

            {/* Grace offer */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-twilight text-center">
                {currentStreak > 1
                  ? `Your ${currentStreak}-day streak can still be saved. Log fully today.`
                  : 'Log today fully to continue building momentum.'}
              </p>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCommit}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sacred-saffron to-temple-gold text-dawn-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity shadow-warm-sm"
              >
                {saving ? (
                  <span className="animate-pulse">Saving…</span>
                ) : (
                  <>
                    <span className="text-base">🔥</span>
                    मैं आज पूरी साधना करूँगा — Protect my streak
                  </>
                )}
              </motion.button>

              <button
                onClick={handleDecline}
                className="w-full text-xs text-twilight/40 hover:text-twilight transition-colors py-1 text-center"
              >
                Let the streak break — I&apos;ll start fresh
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'committed' && (
        <motion.div
          key="committed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-card border border-sage-green/40 bg-sage-green/6 p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-sage-green/20 border border-sage-green/40 flex items-center justify-center shrink-0">
            <Check size={20} className="text-sage-green" />
          </div>
          <div>
            <p className="font-semibold text-indigo-deep text-sm">🔥 Streak Protected</p>
            <p className="text-xs text-twilight italic">
              Your commitment has been recorded. Now make today count — Rishi is watching your streak.
            </p>
          </div>
        </motion.div>
      )}

      {phase === 'declined' && (
        <motion.div
          key="declined"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-card border border-sandstone bg-sandstone/20 p-4 flex items-center gap-3"
        >
          <Heart size={16} className="text-twilight shrink-0" />
          <p className="text-xs text-twilight italic">
            A fresh start is also courageous. The diya will light again. 🙏
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Hook: determine if grace card should show ────────────────────────────────

export function shouldShowGrace(yesterday: string): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(graceKey(yesterday))
  return !stored  // show if not already handled
}
