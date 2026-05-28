'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Deity-specific kavach config ────────────────────────────────────────────

interface KavachTheme {
  dark:       string
  primary:    string
  gold:       string
  deityHi:    string
  shloka:     string
  meaning:    string
  source:     string
  invocation: string
}

const KAVACH_THEMES: Record<string, KavachTheme> = {
  krishna: {
    dark:       '#0D1440',
    primary:    '#1B2A6B',
    gold:       '#D4AF37',
    deityHi:    'श्री कृष्ण',
    shloka:     'नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः।',
    meaning:    'Weapons cannot cut the Self, fire cannot burn it — what you truly are is indestructible.',
    source:     'Bhagavad Gita 2.23',
    invocation: 'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे',
  },
  ram: {
    dark:       '#3A0A0A',
    primary:    '#7B1A1A',
    gold:       '#D4AF37',
    deityHi:    'श्री राम',
    shloka:     'मंगल भवन अमंगल हारी। द्रवउ सो दसरथ अजिर बिहारी।।',
    meaning:    'He who brings auspiciousness and removes all inauspiciousness — may Sri Ram bless this moment.',
    source:     'Ramcharitmanas — Tulsidas',
    invocation: 'जय श्री राम जय श्री राम जय श्री राम',
  },
  shiva: {
    dark:       '#080818',
    primary:    '#1A1A40',
    gold:       '#B8A880',
    deityHi:    'श्री शिव',
    shloka:     'त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।',
    meaning:    'We worship the three-eyed Shiva who nourishes all beings and liberates us from death like a ripe fruit.',
    source:     'Maha Mrityunjaya Mantra — Rigveda 7.59.12',
    invocation: 'ॐ नमः शिवाय ॐ नमः शिवाय ॐ नमः शिवाय',
  },
  hanuman: {
    dark:       '#3A1200',
    primary:    '#B5451B',
    gold:       '#D4AF37',
    deityHi:    'श्री हनुमान',
    shloka:     'मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्।',
    meaning:    'Swift as mind, mighty as wind, with senses conquered — Hanuman, greatest of the wise, protect me now.',
    source:     'Hanuman Vandana — Valmiki Ramayana',
    invocation: 'जय हनुमान ज्ञान गुण सागर',
  },
  durga: {
    dark:       '#3A0000',
    primary:    '#8B0000',
    gold:       '#D4AF37',
    deityHi:    'श्री दुर्गा',
    shloka:     'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता।',
    meaning:    'The Goddess who dwells in all beings as Shakti — I bow to Her, protect me with divine energy.',
    source:     'Devi Mahatmya — Markandeya Purana',
    invocation: 'जय माता दी जय माता दी जय माता दी',
  },
  ganesh: {
    dark:       '#2A0A00',
    primary:    '#8B3500',
    gold:       '#D4AF37',
    deityHi:    'श्री गणेश',
    shloka:     'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा।।',
    meaning:    'O Ganesh with curved trunk, of great form, radiant as a million suns — make all my endeavors obstacle-free.',
    source:     'Ganesh Vandana — traditional',
    invocation: 'ॐ गं गणपतये नमः',
  },
  saraswati: {
    dark:       '#0A1A40',
    primary:    '#1A3A7B',
    gold:       '#D4AF37',
    deityHi:    'श्री सरस्वती',
    shloka:     'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता।',
    meaning:    'She who is pure as jasmine, white as the moon — Saraswati who grants purity of mind and clarity.',
    source:     'Saraswati Vandana — traditional',
    invocation: 'ॐ ऐं सरस्वत्यै नमः',
  },
  vishnu: {
    dark:       '#0A0020',
    primary:    '#2A0A5A',
    gold:       '#D4AF37',
    deityHi:    'श्री विष्णु',
    shloka:     'शान्ताकारं भुजगशयनं पद्मनाभं सुरेशम्।',
    meaning:    'Of peaceful form, resting on the serpent — Vishnu, lord of creation, protect this moment of practice.',
    source:     'Vishnu Stuti — traditional',
    invocation: 'ॐ नमो नारायणाय',
  },
  default: {
    dark:       '#1A0F3A',
    primary:    '#3D2C8D',
    gold:       '#D4AF37',
    deityHi:    'परमात्मन्',
    shloka:     'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।',
    meaning:    'Let one lift oneself by oneself — do not let the self be degraded. The Self alone is its own friend.',
    source:     'Bhagavad Gita 6.5',
    invocation: 'ॐ तत् सत् ॐ तत् सत् ॐ तत् सत्',
  },
}

function getKavachTheme(deity: string | null): KavachTheme {
  if (!deity) return KAVACH_THEMES.default
  return KAVACH_THEMES[deity.toLowerCase()] ?? KAVACH_THEMES.default
}

// ─── Breathing phases ─────────────────────────────────────────────────────────

const PHASES = [
  { label: 'श्वास लें',   labelEn: 'INHALE',  duration: 4, scale: 1.45 },
  { label: 'रोकें',       labelEn: 'HOLD',    duration: 7, scale: 1.45 },
  { label: 'छोड़ें',      labelEn: 'EXHALE',  duration: 8, scale: 0.65 },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KavachPage() {
  const router = useRouter()

  const [deity,       setDeity]      = useState<string | null>(null)
  const [userId,      setUserId]     = useState<string | null>(null)
  const [loading,     setLoading]    = useState(true)

  // Breathing state
  const [phaseIdx,    setPhaseIdx]   = useState(0)
  const [countdown,   setCountdown]  = useState(PHASES[0].duration)
  const [rounds,      setRounds]     = useState(0)
  const [breathActive, setBreathActive] = useState(true)

  // Elapsed time
  const [elapsed,     setElapsed]    = useState(0)
  const startedAt   = useRef(Date.now())

  // Outcome
  const [outcome,     setOutcome]    = useState<'held' | 'relapsed' | null>(null)
  const [logging,     setLogging]    = useState(false)

  // ── Load deity ──────────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('ist_deity').eq('id', user.id).single()
      setDeity(data?.ist_deity ?? null)
      setLoading(false)
    })()
  }, [router])

  // ── Elapsed timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (outcome) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [outcome])

  // ── Breathing engine ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!breathActive || outcome) return
    if (countdown > 1) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    // Phase complete — advance
    const next = (phaseIdx + 1) % PHASES.length
    setPhaseIdx(next)
    setCountdown(PHASES[next].duration)
    if (next === 0) setRounds(r => r + 1)
  }, [breathActive, countdown, phaseIdx, outcome])

  // ── Log and exit ────────────────────────────────────────────────────────────
  const logAndExit = useCallback(async (held: boolean) => {
    setLogging(true)
    setOutcome(held ? 'held' : 'relapsed')
    if (userId) {
      await supabase.from('urge_logs').insert({
        user_id:       userId,
        intensity:     7,
        trigger_tags:  [],
        action_taken:  `Used Kavach — ${rounds} breathing rounds, ${elapsed}s`,
        held_strong:   held,
        breathing_done: true,
      })
    }
    setTimeout(() => router.back(), held ? 2000 : 1200)
  }, [userId, rounds, elapsed, router])

  const theme = getKavachTheme(deity)
  const phase = PHASES[phaseIdx]

  const elapsedMin = Math.floor(elapsed / 60)
  const elapsedSec = elapsed % 60
  const elapsedStr = `${elapsedMin}:${elapsedSec.toString().padStart(2, '0')}`

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#1A0F3A' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="text-5xl"
      >🕉️</motion.div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${theme.dark} 0%, ${theme.primary} 100%)` }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-safe pt-5 pb-3 shrink-0">
        <div>
          <p style={{ color: theme.gold }} className="font-devanagari text-base font-semibold">
            {theme.deityHi} कवच
          </p>
          <p className="text-xs opacity-50 text-white">{elapsedStr} · {rounds} rounds</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white/90"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Protective shloka ── */}
      <div className="px-6 py-4 shrink-0">
        <div
          className="rounded-xl p-4 border"
          style={{ borderColor: `${theme.gold}30`, backgroundColor: `${theme.gold}08` }}
        >
          <p
            className="font-devanagari text-sm leading-relaxed text-center"
            style={{ color: theme.gold }}
          >
            {theme.shloka}
          </p>
          <p className="text-xs text-white/50 text-center mt-1 italic leading-relaxed">
            {theme.meaning}
          </p>
          <p className="text-[10px] text-white/30 text-center mt-1">{theme.source}</p>
        </div>
      </div>

      {/* ── Breathing circle ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative">

        {/* Outer glow ring */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-64 h-64 rounded-full"
          style={{ backgroundColor: theme.gold, filter: 'blur(40px)' }}
        />

        {/* Breathing circle */}
        <motion.div
          animate={{ scale: phase.scale }}
          transition={{
            duration: phase.duration,
            ease: phaseIdx === 1 ? 'linear' : phaseIdx === 0 ? 'easeOut' : 'easeIn',
          }}
          className="relative w-48 h-48 rounded-full flex flex-col items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${theme.gold}25 0%, ${theme.gold}08 70%)`,
            border: `2px solid ${theme.gold}60`,
          }}
        >
          {/* Countdown number */}
          <AnimatePresence mode="wait">
            <motion.p
              key={countdown}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.2 }}
              className="font-devanagari text-5xl font-bold"
              style={{ color: theme.gold }}
            >
              {countdown}
            </motion.p>
          </AnimatePresence>

          {/* Phase labels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center mt-1"
            >
              <p className="font-devanagari text-base" style={{ color: theme.gold }}>
                {phase.label}
              </p>
              <p className="text-[11px] text-white/50 tracking-widest">{phase.labelEn}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Invocation mantra */}
        <motion.p
          className="font-devanagari text-sm mt-8 text-center px-8 leading-relaxed"
          style={{ color: `${theme.gold}70` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {theme.invocation}
        </motion.p>
      </div>

      {/* ── Outcome buttons ── */}
      <AnimatePresence>
        {!outcome ? (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-5 pb-safe pb-8 pt-4 space-y-3 shrink-0"
          >
            {/* Held strong */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => logAndExit(true)}
              disabled={logging}
              className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all"
              style={{
                background: `linear-gradient(135deg, ${theme.gold}22, ${theme.gold}40)`,
                border: `1.5px solid ${theme.gold}60`,
                color: theme.gold,
              }}
            >
              <Check size={20} />
              <span>मैं अडिग रहा — I Held Strong</span>
              <span className="text-lg">🙏</span>
            </motion.button>

            {/* Relapsed — smaller, less prominent */}
            <button
              onClick={() => logAndExit(false)}
              disabled={logging}
              className="w-full py-2.5 rounded-xl text-sm text-white/30 hover:text-white/50 transition-colors border border-white/10"
            >
              Log Relapse
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 pb-safe pb-10 pt-4 text-center shrink-0"
          >
            {outcome === 'held' ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-5xl mb-3"
                >🔥</motion.div>
                <p className="font-devanagari text-xl font-bold" style={{ color: theme.gold }}>
                  जय! विजय तुम्हारी है।
                </p>
                <p className="text-sm text-white/60 mt-1">Victory. Returning to your sadhana.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🕯️</div>
                <p className="font-devanagari text-lg font-semibold text-white/80">
                  यह भी गुज़र जाएगा।
                </p>
                <p className="text-sm text-white/50 mt-1">This too shall pass. Rise again tomorrow.</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flame icon bottom-right decorative */}
      <div className="absolute bottom-24 right-5 opacity-10 pointer-events-none">
        <Flame size={48} style={{ color: theme.gold }} />
      </div>
    </div>
  )
}
