'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import milestonesData from '@/data/milestones-default.json'
import affirmationsData from '@/data/affirmations-default.json'

// ── Types ──────────────────────────────────────────────────────────────────
interface PracticeConfig {
  brahma_muhurta: boolean
  meditation: boolean
  meditation_minutes: number
  pranayama: boolean
  prayer: boolean
  prayer_times: string[]
  shloka_study: boolean
  gratitude: boolean
  skincare: boolean
  exercise: boolean
  water_intake: boolean
}

interface OnboardingData {
  name: string
  age: string
  gender: 'male' | 'female' | 'other' | ''
  ishta_deity: string
  target_days: number
  sankalp_text: string
  practices: PracticeConfig
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEITIES = [
  {
    id: 'krishna',
    name: 'श्री कृष्ण',
    title: 'The Supreme Guide',
    tagline: 'सर्वस्य चाहं हृदि सन्निविष्टः',
    symbol: 'कृ',
    gradientFrom: 'rgba(122,174,196,0.2)',
    gradientTo: 'rgba(74,76,122,0.15)',
    accent: '#7AAEC4',
    borderColor: 'rgba(122,174,196,0.6)',
  },
  {
    id: 'ram',
    name: 'श्री राम',
    title: 'Maryada Purushottam',
    tagline: 'रामो विग्रहवान् धर्मः',
    symbol: 'रा',
    gradientFrom: 'rgba(122,158,122,0.2)',
    gradientTo: 'rgba(242,179,102,0.12)',
    accent: '#7A9E7A',
    borderColor: 'rgba(122,158,122,0.6)',
  },
  {
    id: 'shiva',
    name: 'महादेव शिव',
    title: 'The Destroyer of Ignorance',
    tagline: 'ॐ नमः शिवाय',
    symbol: 'शि',
    gradientFrom: 'rgba(43,45,91,0.12)',
    gradientTo: 'rgba(107,109,158,0.15)',
    accent: '#4A4C7A',
    borderColor: 'rgba(74,76,122,0.5)',
  },
  {
    id: 'hanuman',
    name: 'हनुमान जी',
    title: 'The Embodiment of Devotion & Strength',
    tagline: 'मनोजवं मारुततुल्यवेगम्',
    symbol: 'हं',
    gradientFrom: 'rgba(232,145,58,0.18)',
    gradientTo: 'rgba(242,179,102,0.12)',
    accent: '#C47420',
    borderColor: 'rgba(232,145,58,0.6)',
  },
  {
    id: 'durga',
    name: 'माँ दुर्गा',
    title: 'The Divine Mother',
    tagline: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता',
    symbol: 'दुं',
    gradientFrom: 'rgba(212,131,138,0.2)',
    gradientTo: 'rgba(212,168,71,0.12)',
    accent: '#D4838A',
    borderColor: 'rgba(212,131,138,0.6)',
  },
  {
    id: 'all',
    name: 'सभी देव',
    title: 'All Divine Aspects',
    tagline: 'एकं सत् विप्रा बहुधा वदन्ति',
    symbol: 'ॐ',
    gradientFrom: 'rgba(212,168,71,0.18)',
    gradientTo: 'rgba(232,145,58,0.12)',
    accent: '#D4A847',
    borderColor: 'rgba(212,168,71,0.6)',
  },
] as const

const DURATION_OPTIONS = [
  { days: 21, label: '21 Days', sanskrit: 'त्रिवेणी', desc: 'Habit formation — rewire the neural pathways' },
  { days: 30, label: '30 Days', sanskrit: 'मास पूर्ण', desc: 'One lunar cycle — deep hormonal reset' },
  { days: 45, label: '45 Days', sanskrit: 'अर्ध-शतक', desc: 'The middle path — self-sustaining transformation' },
  { days: 60, label: '60 Days', sanskrit: 'षष्ठी सिद्धि', desc: 'The traditional brahmacharya threshold' },
  { days: 90, label: '90 Days', sanskrit: 'त्रिमास तपस्या', desc: 'Three months — the ancient tapas period' },
] as const

const PRACTICES_LIST = [
  { key: 'brahma_muhurta' as const, label: 'ब्रह्म मुहूर्त जागरण', desc: 'Wake before sunrise' },
  { key: 'meditation' as const,    label: 'ध्यान',                 desc: 'Daily meditation', hasMinutes: true },
  { key: 'pranayama' as const,     label: 'प्राणायाम',              desc: 'Breathing exercises' },
  { key: 'prayer' as const,        label: 'प्रार्थना',              desc: 'Daily prayers', hasTimes: true },
  { key: 'shloka_study' as const,  label: 'श्लोक अध्ययन',          desc: 'Daily scripture study' },
  { key: 'gratitude' as const,     label: 'कृतज्ञता',               desc: 'Gratitude journal' },
  { key: 'skincare' as const,      label: 'त्वचा देखभाल',           desc: 'Morning & evening skincare' },
  { key: 'exercise' as const,      label: 'व्यायाम',                desc: 'Physical exercise' },
  { key: 'water_intake' as const,  label: 'जल सेवन',               desc: 'Track water intake' },
]

const DEFAULT_PRACTICES: PracticeConfig = {
  brahma_muhurta: true, meditation: true, meditation_minutes: 15,
  pranayama: true, prayer: true, prayer_times: ['06:00', '20:00'],
  shloka_study: true, gratitude: true, skincare: true, exercise: true, water_intake: true,
}

// ── Animation variants ─────────────────────────────────────────────────────
const slide = {
  enter:  (d: number) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   (d: number) => ({ x: d > 0 ? -56 : 56, opacity: 0, transition: { duration: 0.22 } }),
}

// ── Shared sub-components ──────────────────────────────────────────────────
function StepHeader({ step, title, subtitle, desc }: { step: number; title: string; subtitle: string; desc: string }) {
  return (
    <div className="space-y-1 pb-2">
      <p className="text-xs font-semibold text-sacred-saffron uppercase tracking-widest">Step {step} of 5</p>
      <h2 className="font-devanagari font-display text-2xl sm:text-3xl font-semibold text-indigo-deep leading-snug">{title}</h2>
      <p className="text-sm font-medium text-twilight">{subtitle}</p>
      <p className="text-sm text-twilight leading-relaxed pt-0.5">{desc}</p>
    </div>
  )
}

function NavRow({
  onBack, onNext, nextDisabled = false, nextLabel = 'अगला',
}: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-twilight hover:text-indigo-deep transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />पिछला
      </button>
      <Button variant="primary" size="lg" disabled={nextDisabled} onClick={onNext} className="gap-1.5">
        {nextLabel} <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ── STEP 1 — आत्म परिचय ───────────────────────────────────────────────────
function StepAtmaParichay({ data, onChange, onNext }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void; onNext: () => void }) {
  const valid = data.name.trim().length >= 2 && !!data.age && !!data.gender
  return (
    <div className="space-y-7">
      <StepHeader step={1} title="आत्म परिचय" subtitle="Know Thyself" desc="Before the journey begins, introduce yourself to the practice." />
      <div className="space-y-5">
        <Input label="Your name" value={data.name} onChange={(e) => onChange({ name: e.target.value })} autoFocus />
        <Input label="Your age" type="number" min={13} max={99} value={data.age} onChange={(e) => onChange({ age: e.target.value })} />
        <div className="space-y-2">
          <p className="text-xs font-semibold text-twilight uppercase tracking-wider">Gender</p>
          <div className="flex gap-3">
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ gender: g })}
                className={`flex-1 h-10 rounded-card border text-sm font-medium transition-all duration-200 ${
                  data.gender === g
                    ? 'border-sacred-saffron bg-sacred-saffron/10 text-sacred-saffron'
                    : 'border-sandstone text-twilight hover:border-sacred-saffron/50'
                }`}
              >
                {g === 'male' ? 'पुरुष / Male' : g === 'female' ? 'महिला / Female' : 'अन्य / Other'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="lg" disabled={!valid} onClick={onNext} className="gap-1.5">
          अगला <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ── STEP 2 — इष्ट देव ─────────────────────────────────────────────────────
function StepIshtaDev({ data, onChange, onNext, onBack }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-7">
      <StepHeader
        step={2}
        title="इष्ट देव"
        subtitle="Your Divine Connection"
        desc="Choose your ishta devata — the divine form closest to your heart. Their shlokas and prayers will guide your daily practice."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DEITIES.map((d) => {
          const selected = data.ishta_deity === d.id
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange({ ishta_deity: d.id })}
              style={selected ? {
                borderColor: d.borderColor,
                background: `linear-gradient(135deg, ${d.gradientFrom}, ${d.gradientTo})`,
              } : undefined}
              className={`relative rounded-card border-2 p-4 text-left transition-all duration-200 ${
                selected ? 'shadow-warm-sm' : 'border-sandstone bg-dawn-white/50 hover:border-sacred-saffron/35'
              }`}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sacred-saffron flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
              <div className="font-devanagari text-2xl font-bold mb-2 leading-none" style={{ color: d.accent }}>
                {d.symbol}
              </div>
              <p className="font-devanagari text-sm font-semibold text-indigo-deep leading-tight">{d.name}</p>
              <p className="text-xs text-twilight mt-0.5 leading-tight">{d.title}</p>
              <p className="font-devanagari text-[11px] mt-2 leading-tight" style={{ color: d.accent, opacity: 0.8 }}>
                {d.tagline}
              </p>
            </button>
          )
        })}
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.ishta_deity} />
    </div>
  )
}

// ── STEP 3 — साधना संकल्प ─────────────────────────────────────────────────
function StepSankalp({ data, onChange, onNext, onBack }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const milestones = (milestonesData as Array<{ day: number; title: string; sanskrit: string; description: string }>)
    .filter((m) => m.day <= data.target_days)

  const isCustom = !DURATION_OPTIONS.some((o) => o.days === data.target_days)

  return (
    <div className="space-y-7">
      <StepHeader
        step={3}
        title="साधना संकल्प"
        subtitle="Your Sacred Vow"
        desc="Choose your vow duration and write your personal sankalp — your commitment to yourself."
      />

      {/* Duration picker */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-twilight uppercase tracking-wider">Sadhana Duration</p>
        <div className="space-y-2">
          {DURATION_OPTIONS.map((opt) => {
            const active = data.target_days === opt.days
            return (
              <button
                key={opt.days}
                type="button"
                onClick={() => onChange({ target_days: opt.days })}
                className={`w-full flex items-center gap-4 rounded-card border p-3.5 text-left transition-all duration-200 ${
                  active ? 'border-sacred-saffron bg-sacred-saffron/6 shadow-warm-sm' : 'border-sandstone hover:border-sacred-saffron/40 bg-dawn-white/50'
                }`}
              >
                <span className={`shrink-0 w-10 text-center text-xl font-bold font-display ${active ? 'text-sacred-saffron' : 'text-twilight'}`}>
                  {opt.days}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-deep">{opt.label}</span>
                    <span className="font-devanagari text-xs text-twilight">— {opt.sanskrit}</span>
                  </div>
                  <p className="text-xs text-twilight mt-0.5">{opt.desc}</p>
                </div>
                {active && <Check className="w-4 h-4 text-sacred-saffron shrink-0" />}
              </button>
            )
          })}

          {/* Custom */}
          <div className={`flex items-center gap-4 rounded-card border p-3.5 transition-all duration-200 ${
            isCustom ? 'border-sacred-saffron bg-sacred-saffron/6' : 'border-sandstone bg-dawn-white/50'
          }`}>
            <span className="shrink-0 w-10 text-center text-xs font-semibold text-twilight">Custom</span>
            <input
              type="number"
              min={7}
              max={365}
              placeholder="Enter days…"
              value={isCustom ? data.target_days : ''}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v >= 7) onChange({ target_days: v })
              }}
              className="flex-1 bg-transparent outline-none text-sm text-indigo-deep placeholder:text-sandstone"
            />
          </div>
        </div>

        {/* Milestone chips */}
        {milestones.length > 0 && (
          <div className="rounded-card bg-temple-gold/8 border border-temple-gold/25 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-temple-gold uppercase tracking-wider">Your Milestones</p>
            <div className="flex flex-wrap gap-2">
              {milestones.map((m) => (
                <span key={m.day} className="inline-flex items-center gap-1.5 rounded-full bg-temple-gold/12 px-3 py-1 text-xs font-medium text-indigo-deep">
                  <span className="font-bold text-temple-gold">Day {m.day}</span>
                  <span className="font-devanagari">{m.sanskrit}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-twilight leading-relaxed">
              {milestones[milestones.length - 1]?.description}
            </p>
          </div>
        )}
      </div>

      {/* Sankalp textarea */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-twilight uppercase tracking-wider">Your Personal Sankalp</p>
        <Textarea
          label="मैं संकल्प लेता/लेती हूँ कि..."
          value={data.sankalp_text}
          onChange={(e) => onChange({ sankalp_text: e.target.value })}
          rows={6}
          className="font-devanagari"
        />
        <p className="flex items-center gap-1.5 text-xs text-twilight">
          <span>🔒</span>
          This letter will be sealed and returned to you on Day {data.target_days}. Only you can break the seal.
        </p>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!data.target_days} />
    </div>
  )
}

// ── STEP 4 — दिनचर्या ─────────────────────────────────────────────────────
function StepDinacharya({ data, onChange, onNext, onBack }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const updatePractice = useCallback(
    (key: keyof PracticeConfig, value: boolean | number | string[]) =>
      onChange({ practices: { ...data.practices, [key]: value } }),
    [data.practices, onChange]
  )

  return (
    <div className="space-y-7">
      <StepHeader
        step={4}
        title="दिनचर्या"
        subtitle="Your Daily Rituals"
        desc="Choose which practices to track. All are enabled by default — turn off what doesn't fit your life right now."
      />
      <div className="space-y-2">
        {PRACTICES_LIST.map(({ key, label, desc, hasMinutes, hasTimes }) => {
          const isOn = data.practices[key] as boolean
          return (
            <div
              key={key}
              className={`rounded-card border p-4 transition-all duration-200 ${
                isOn ? 'border-sacred-saffron/40 bg-sacred-saffron/4' : 'border-sandstone bg-dawn-white/40'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`font-devanagari text-sm font-semibold leading-tight ${isOn ? 'text-indigo-deep' : 'text-twilight'}`}>{label}</p>
                  <p className="text-xs text-twilight mt-0.5">{desc}</p>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  onClick={() => updatePractice(key, !isOn)}
                  className={`relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${isOn ? 'bg-sacred-saffron' : 'bg-sandstone'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Meditation minutes */}
              {hasMinutes && isOn && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-twilight">Duration:</span>
                  {[10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updatePractice('meditation_minutes', m)}
                      className={`h-7 w-10 rounded-card text-xs font-medium transition-all duration-150 ${
                        data.practices.meditation_minutes === m
                          ? 'bg-sacred-saffron text-white'
                          : 'border border-sandstone text-twilight hover:border-sacred-saffron/50'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              )}

              {/* Prayer times */}
              {hasTimes && isOn && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-twilight">Prayer times:</p>
                  {data.practices.prayer_times.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => {
                          const updated = [...data.practices.prayer_times]
                          updated[i] = e.target.value
                          updatePractice('prayer_times', updated)
                        }}
                        className="h-8 rounded-card border border-sandstone bg-dawn-white px-2 text-sm text-indigo-deep focus:outline-none focus:ring-1 focus:ring-sacred-saffron"
                      />
                      {data.practices.prayer_times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => updatePractice('prayer_times', data.practices.prayer_times.filter((_, j) => j !== i))}
                          className="text-twilight hover:text-rose-red transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updatePractice('prayer_times', [...data.practices.prayer_times, ''])}
                    className="flex items-center gap-1 text-xs text-sacred-saffron hover:text-saffron-deep font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add time
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="समीक्षा करें" />
    </div>
  )
}

// ── STEP 5 — प्रारंभ ───────────────────────────────────────────────────────
function StepPrarambha({ data, onBegin, onBack, loading }: { data: OnboardingData; onBegin: () => void; onBack: () => void; loading: boolean }) {
  const deity = DEITIES.find((d) => d.id === data.ishta_deity)
  const durationOpt = DURATION_OPTIONS.find((o) => o.days === data.target_days)
  const durationLabel = durationOpt ? `${durationOpt.days} Days — ${durationOpt.sanskrit}` : `${data.target_days} Days — विशेष`
  const practiceCount = PRACTICES_LIST.filter(({ key }) => data.practices[key] === true).length

  return (
    <div className="space-y-7">
      <StepHeader step={5} title="प्रारंभ" subtitle="The Beginning" desc="Review your sankalp. When you are ready, take the vow." />

      {/* Summary chips */}
      <div className="rounded-card border border-sandstone bg-parchment/60 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sacred-saffron/12 border border-sacred-saffron/30 px-3 py-1 text-sm font-medium text-sacred-saffron">
            {data.name}{data.age ? `, ${data.age}` : ''}
          </span>
          {deity && (
            <span
              className="rounded-full border px-3 py-1 text-sm font-medium font-devanagari"
              style={{ borderColor: deity.borderColor, color: deity.accent }}
            >
              {deity.name}
            </span>
          )}
          <span className="rounded-full bg-temple-gold/12 border border-temple-gold/35 px-3 py-1 text-sm font-semibold text-indigo-deep font-devanagari">
            {durationLabel}
          </span>
          <span className="rounded-full bg-sage-green/12 border border-sage-green/40 px-3 py-1 text-sm text-indigo-deep">
            {practiceCount} practices
          </span>
        </div>
      </div>

      {/* Sankalp parchment */}
      {data.sankalp_text.trim() && (
        <div className="relative rounded-card border border-temple-gold/35 bg-gradient-to-br from-parchment to-sandstone/25 p-6 shadow-warm-sm overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-2 right-4 font-devanagari text-6xl text-temple-gold/10 select-none pointer-events-none leading-none"
          >
            ॐ
          </div>
          <p className="text-xs font-semibold text-temple-gold uppercase tracking-wider mb-3">
            Your Sankalp — Sealed until Day {data.target_days}
          </p>
          <p className="font-devanagari text-sm text-indigo-deep leading-relaxed whitespace-pre-wrap">
            {data.sankalp_text}
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-twilight">
            <span>🔒</span> This letter is locked. It will be revealed on Day {data.target_days}.
          </p>
        </div>
      )}

      {/* Begin CTA */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          variant="sacred"
          size="lg"
          onClick={onBegin}
          loading={loading}
          disabled={loading}
          className="w-full sm:w-auto px-10 text-base gap-2"
        >
          🙏 साधना आरम्भ करें
        </Button>
        <p className="text-xs text-twilight text-center italic">
          &ldquo;उद्धरेदात्मनात्मानम्&rdquo; — Let one lift oneself by oneself. — Gita 6.5
        </p>
      </div>

      <div className="flex justify-start">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-twilight hover:text-indigo-deep transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  )
}

// ── OM Overlay ─────────────────────────────────────────────────────────────
function OmOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: '#2B2D5B' }}
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        className="font-devanagari select-none"
        style={{
          fontSize: '7rem',
          lineHeight: 1,
          color: '#D4A847',
          textShadow: '0 0 60px rgba(212,168,71,0.5), 0 0 120px rgba(212,168,71,0.25)',
        }}
      >
        ॐ
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
        className="font-devanagari mt-8 text-lg tracking-widest"
        style={{ color: 'rgba(232,213,190,0.7)' }}
      >
        साधना आरम्भ होती है...
      </motion.p>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState(0)
  const [direction, setDirection]     = useState(1)
  const [loading, setLoading]         = useState(false)
  const [showOm, setShowOm]           = useState(false)
  const [data, setData]               = useState<OnboardingData>({
    name: '', age: '', gender: '', ishta_deity: '',
    target_days: 60, sankalp_text: '', practices: DEFAULT_PRACTICES,
  })

  const patch = useCallback((p: Partial<OnboardingData>) => setData((d) => ({ ...d, ...p })), [])

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const handleBegin = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const today = new Date().toISOString().split('T')[0]

      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: data.name,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        ist_deity: data.ishta_deity || null,
        target_days: data.target_days,
        sadhana_start_date: today,
        prayer_schedule: {
          times: data.practices.prayer_times,
          sankalp: data.sankalp_text,
          practices: {
            brahma_muhurta: data.practices.brahma_muhurta,
            meditation: data.practices.meditation,
            meditation_minutes: data.practices.meditation_minutes,
            pranayama: data.practices.pranayama,
            prayer: data.practices.prayer,
            shloka_study: data.practices.shloka_study,
            gratitude: data.practices.gratitude,
            skincare: data.practices.skincare,
            exercise: data.practices.exercise,
            water_intake: data.practices.water_intake,
          },
        },
      })

      await supabase.from('daily_logs').insert({
        user_id: user.id,
        log_date: today,
        streak_maintained: false,
        meditation_minutes: data.practices.meditation ? data.practices.meditation_minutes : 0,
        pranayama_done: false,
        pranayama_type: null,
        prayers_completed: [],
        skincare_morning: false,
        skincare_evening: false,
        water_glasses: 0,
        sleep_hours: null,
        exercise_done: false,
        gratitude_1: null,
        gratitude_2: null,
        gratitude_3: null,
        mood_score: null,
        energy_score: null,
        clarity_score: null,
        confidence_score: null,
        journal_entry: null,
        daily_intention: null,
        shloka_learned_id: null,
        notes: null,
      })

      const eligibleMilestones = (milestonesData as Array<{ day: number; title: string; description: string }>)
        .filter((m) => m.day <= data.target_days)

      if (eligibleMilestones.length > 0) {
        await supabase.from('milestones').insert(
          eligibleMilestones.map((m) => ({
            user_id: user.id,
            day_number: m.day,
            title: m.title,
            description: m.description,
            achieved: false,
            achieved_at: null,
            reflection: null,
          }))
        )
      }

      const top3Affirmations = (affirmationsData as Array<{ text_hindi?: string; text_english: string; source?: string }>).slice(0, 3)
      await supabase.from('affirmations').insert(
        top3Affirmations.map((a) => ({
          user_id: user.id,
          text_hindi: a.text_hindi ?? null,
          text_english: a.text_english,
          source: a.source ?? null,
          active: true,
        }))
      )

      setShowOm(true)
      setTimeout(() => router.push('/dashboard'), 2400)
    } catch (err) {
      console.error('[onboarding]', err)
      setLoading(false)
    }
  }

  const progressPct = ((step + 1) / 5) * 100

  return (
    <>
      <AnimatePresence>{showOm && <OmOverlay key="om" />}</AnimatePresence>

      <div className="max-w-2xl mx-auto py-6 space-y-5">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-devanagari text-xs text-twilight">साधना दीक्षा</span>
            <span className="text-xs text-twilight">{step + 1} / 5</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-sandstone">
            <motion.div
              className="h-full rounded-full origin-left"
              style={{ background: 'linear-gradient(90deg, #E8913A, #D4A847)' }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-card bg-parchment border border-sandstone shadow-warm-sm p-6 sm:p-8 min-h-[520px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slide} initial="enter" animate="center" exit="exit">
              {step === 0 && <StepAtmaParichay data={data} onChange={patch} onNext={() => go(1)} />}
              {step === 1 && <StepIshtaDev    data={data} onChange={patch} onNext={() => go(2)} onBack={() => go(0)} />}
              {step === 2 && <StepSankalp     data={data} onChange={patch} onNext={() => go(3)} onBack={() => go(1)} />}
              {step === 3 && <StepDinacharya  data={data} onChange={patch} onNext={() => go(4)} onBack={() => go(2)} />}
              {step === 4 && <StepPrarambha   data={data} onBegin={handleBegin} onBack={() => go(3)} loading={loading} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
