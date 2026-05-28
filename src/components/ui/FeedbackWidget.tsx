'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FeedbackType = 'bug' | 'feature' | 'love'

const TYPES: { value: FeedbackType; label: string; emoji: string; color: string }[] = [
  { value: 'bug',     label: 'Bug',     emoji: '🐛', color: 'border-rose-red/50 bg-rose-red/8 text-rose-red'         },
  { value: 'feature', label: 'Feature', emoji: '✨', color: 'border-sacred-saffron/50 bg-sacred-saffron/8 text-sacred-saffron' },
  { value: 'love',    label: 'Love',    emoji: '💛', color: 'border-temple-gold/50 bg-temple-gold/8 text-twilight'    },
]

interface Props {
  userId:  string | null
  streak:  number
  deity:   string | null
}

export function FeedbackWidget({ userId, streak, deity }: Props) {
  const pathname = usePathname()
  const [open,       setOpen]      = useState(false)
  const [type,       setType]      = useState<FeedbackType>('feature')
  const [message,    setMessage]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]      = useState(false)

  const submit = async () => {
    if (!message.trim() || submitting) return
    setSubmitting(true)
    // feedback table not in generated types yet — safe cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('feedback').insert({
      user_id: userId,
      type,
      message: message.trim(),
      page:    pathname,
      deity,
      streak,
    })
    setSubmitting(false)
    setDone(true)
    setTimeout(() => { setOpen(false); setDone(false); setMessage(''); setType('feature') }, 2000)
  }

  return (
    <>
      {/* ── Trigger button — left side, above tab bar on mobile ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="feedback-fab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            className="fixed z-40 left-4 bottom-20 md:bottom-6 w-10 h-10 rounded-full bg-parchment border border-sandstone shadow-warm-sm flex items-center justify-center text-twilight hover:text-sacred-saffron hover:border-sacred-saffron/60 transition-colors"
            aria-label="Send feedback"
          >
            <MessageSquare size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fb-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setOpen(false)}
            />

            {/* Sheet — bottom on mobile, centred card on desktop */}
            <motion.div
              key="fb-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="fixed bottom-0 inset-x-0 z-50 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-parchment rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {done ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center justify-center py-12 px-8 gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="w-14 h-14 rounded-full bg-sage-green/15 border border-sage-green/40 flex items-center justify-center"
                  >
                    <Check size={26} className="text-sage-green" />
                  </motion.div>
                  <p className="font-display text-lg text-indigo-deep font-semibold">Thank you 🙏</p>
                  <p className="text-sm text-twilight text-center">
                    Your {type === 'bug' ? 'report' : type === 'feature' ? 'idea' : 'kind words'} have been received.
                  </p>
                </div>
              ) : (
                /* ── Form ── */
                <>
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 rounded-full bg-sandstone" />
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 border-b border-sandstone/60">
                    <div>
                      <p className="text-base font-semibold text-indigo-deep">Share Feedback</p>
                      <p className="text-xs text-twilight">Help us build the best sadhana experience</p>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-sandstone/40 text-twilight"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    {/* Type selector */}
                    <div className="flex gap-2">
                      {TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setType(t.value)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            type === t.value
                              ? t.color
                              : 'border-sandstone bg-sandstone/20 text-twilight hover:bg-sandstone/40'
                          }`}
                        >
                          <span className="text-lg">{t.emoji}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-xs text-twilight mb-1.5 block">
                        {type === 'bug'     && 'Describe what went wrong'}
                        {type === 'feature' && 'What would make this app better for you?'}
                        {type === 'love'    && 'What are you loving about SadhanaOS?'}
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={
                          type === 'bug'     ? 'e.g. The log page crashes when I...' :
                          type === 'feature' ? 'e.g. I wish I could track...' :
                          'e.g. The breathing circle really helps me during...'
                        }
                        rows={4}
                        className="w-full text-sm bg-sandstone/20 rounded-xl px-3.5 py-3 border border-sandstone focus:outline-none focus:border-sacred-saffron resize-none text-indigo-deep placeholder:text-twilight/40"
                      />
                    </div>

                    {/* Context note */}
                    <p className="text-[11px] text-twilight/50 flex items-center gap-1">
                      <span>📍</span>
                      Page: {pathname} · Streak: {streak}d
                      {deity ? ` · Deity: ${deity}` : ''}
                    </p>

                    {/* Submit */}
                    <button
                      onClick={submit}
                      disabled={!message.trim() || submitting}
                      className="w-full py-3 rounded-xl bg-sacred-saffron text-dawn-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      <Send size={15} />
                      {submitting ? 'Sending…' : 'Send Feedback'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
