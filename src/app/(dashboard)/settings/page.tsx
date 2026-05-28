'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Settings, Bell, Download, RefreshCw, Trash2,
  Info, ChevronDown, ChevronUp, Check, X, Plus, Loader2,
  Shield, Heart, Brain, Wind, BookOpen, Sparkles, Sun,
  Dumbbell, Droplets, AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Database } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type Json       = Database['public']['Tables']['daily_logs']['Row']['prayers_completed']

interface PracticeConfig {
  brahma_muhurta:    boolean
  meditation:        boolean
  meditation_minutes: number
  pranayama:         boolean
  prayer:            boolean
  prayer_times:      string[]
  shloka_study:      boolean
  gratitude:         boolean
  skincare:          boolean
  exercise:          boolean
  water_intake:      boolean
}

interface ReminderTimes {
  morning:  string
  evening:  string
  urge:     string
}

type SectionId = 'profile' | 'sadhana' | 'reminders' | 'export' | 'reset' | 'account' | 'about'

// ─── Constants ────────────────────────────────────────────────────────────────

const REMINDERS_KEY  = 'sadhanaos_reminder_times'
const ARCHIVE_KEY    = 'sadhanaos_archived_journeys'

const DEITIES = [
  { id: 'krishna', name: 'श्री कृष्ण',   accent: '#7AAEC4' },
  { id: 'ram',     name: 'श्री राम',      accent: '#7A9E7A' },
  { id: 'shiva',   name: 'महादेव शिव',    accent: '#4A4C7A' },
  { id: 'hanuman', name: 'हनुमान जी',     accent: '#C47420' },
  { id: 'durga',   name: 'माँ दुर्गा',    accent: '#D4838A' },
  { id: 'all',     name: 'सभी देव',       accent: '#D4A847' },
] as const

const DURATION_OPTIONS = [21, 30, 45, 60, 90] as const

const PRACTICES = [
  { key: 'brahma_muhurta' as const, hi: 'ब्रह्म मुहूर्त', en: 'Wake before sunrise',   Icon: Sun      },
  { key: 'meditation'     as const, hi: 'ध्यान',           en: 'Meditation',             Icon: Brain    },
  { key: 'pranayama'      as const, hi: 'प्राणायाम',        en: 'Pranayama',              Icon: Wind     },
  { key: 'prayer'         as const, hi: 'प्रार्थना',        en: 'Daily prayers',          Icon: Heart    },
  { key: 'shloka_study'   as const, hi: 'श्लोक अध्ययन',    en: 'Scripture study',        Icon: BookOpen },
  { key: 'gratitude'      as const, hi: 'कृतज्ञता',         en: 'Gratitude journal',      Icon: Sparkles },
  { key: 'skincare'       as const, hi: 'त्वचा देखभाल',     en: 'Morning & eve skincare', Icon: Sun      },
  { key: 'exercise'       as const, hi: 'व्यायाम',          en: 'Physical exercise',      Icon: Dumbbell },
  { key: 'water_intake'   as const, hi: 'जल सेवन',          en: 'Track water intake',     Icon: Droplets },
]

const SECTIONS: { id: SectionId; icon: React.ReactNode; label: string; sublabel: string }[] = [
  { id: 'profile',   icon: <User size={15} />,        label: 'Profile',             sublabel: 'Name, age, deity' },
  { id: 'sadhana',   icon: <Settings size={15} />,    label: 'Sadhana Settings',    sublabel: 'Target, rituals' },
  { id: 'reminders', icon: <Bell size={15} />,        label: 'Reminder Times',      sublabel: 'Stored locally' },
  { id: 'export',    icon: <Download size={15} />,    label: 'Data Export',         sublabel: 'CSV download' },
  { id: 'reset',     icon: <RefreshCw size={15} />,   label: 'Reset Sadhana',       sublabel: 'Fresh start' },
  { id: 'account',   icon: <Trash2 size={15} />,      label: 'Account',             sublabel: 'Delete account' },
  { id: 'about',     icon: <Info size={15} />,        label: 'About',               sublabel: 'v0.1.0' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrayerSchedule(json: Json): PracticeConfig {
  const defaults: PracticeConfig = {
    brahma_muhurta: true, meditation: true, meditation_minutes: 15,
    pranayama: true, prayer: true, prayer_times: ['06:00', '20:00'],
    shloka_study: true, gratitude: true, skincare: true,
    exercise: true, water_intake: true,
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return defaults
  const ps = json as Record<string, Json>
  const p  = ps['practices']
  if (!p || typeof p !== 'object' || Array.isArray(p)) return defaults
  const pr = p as Record<string, Json>
  return {
    brahma_muhurta:    (pr['brahma_muhurta'] as boolean)  ?? defaults.brahma_muhurta,
    meditation:        (pr['meditation'] as boolean)       ?? defaults.meditation,
    meditation_minutes:(pr['meditation_minutes'] as number)?? defaults.meditation_minutes,
    pranayama:         (pr['pranayama'] as boolean)        ?? defaults.pranayama,
    prayer:            (pr['prayer'] as boolean)           ?? defaults.prayer,
    prayer_times:      (Array.isArray(ps['times']) ? ps['times'] as string[] : defaults.prayer_times),
    shloka_study:      (pr['shloka_study'] as boolean)     ?? defaults.shloka_study,
    gratitude:         (pr['gratitude'] as boolean)        ?? defaults.gratitude,
    skincare:          (pr['skincare'] as boolean)         ?? defaults.skincare,
    exercise:          (pr['exercise'] as boolean)         ?? defaults.exercise,
    water_intake:      (pr['water_intake'] as boolean)     ?? defaults.water_intake,
  }
}

function buildPrayerSchedule(cfg: PracticeConfig, existing: Json): Json {
  const ps = (existing && typeof existing === 'object' && !Array.isArray(existing))
    ? { ...(existing as Record<string, Json>) }
    : {} as Record<string, Json>
  return {
    ...ps,
    times: cfg.prayer_times,
    practices: {
      brahma_muhurta:    cfg.brahma_muhurta,
      meditation:        cfg.meditation,
      meditation_minutes: cfg.meditation_minutes,
      pranayama:         cfg.pranayama,
      prayer:            cfg.prayer,
      shloka_study:      cfg.shloka_study,
      gratitude:         cfg.gratitude,
      skincare:          cfg.skincare,
      exercise:          cfg.exercise,
      water_intake:      cfg.water_intake,
    },
  }
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

function escapeCsv(v: unknown): string {
  const s = v == null ? '' : String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id, open, onToggle, icon, label, sublabel, accent = false, children,
}: {
  id: SectionId; open: boolean; onToggle: () => void; icon: React.ReactNode
  label: string; sublabel: string; accent?: boolean; children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [open])

  return (
    <div
      ref={ref}
      id={`section-${id}`}
      className={`rounded-card border overflow-hidden transition-shadow ${
        open ? 'border-sacred-saffron/50 shadow-gold-glow' : 'border-sandstone shadow-warm-sm'
      } bg-white/80`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-parchment/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`p-1.5 rounded-lg ${accent ? 'bg-rose-red/10 text-rose-red' : 'bg-sacred-saffron/10 text-sacred-saffron'}`}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-indigo-deep">{label}</p>
            <p className="text-xs text-twilight">{sublabel}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-twilight shrink-0" /> : <ChevronDown size={16} className="text-twilight shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-sandstone/50 px-4 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Toggle chip ──────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, label, hi, Icon }: {
  on: boolean; onToggle: () => void; label: string; hi: string; Icon: React.FC<{size?: number; className?: string}>
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
        on
          ? 'border-sacred-saffron bg-sacred-saffron/10 text-sacred-saffron font-semibold'
          : 'border-sandstone bg-white/60 text-twilight'
      }`}
    >
      <Icon size={13} className={on ? 'text-sacred-saffron' : 'text-twilight'} />
      <span className="font-devanagari text-xs">{hi}</span>
      <span className="hidden sm:inline text-[10px]">{label}</span>
      {on && <Check size={11} />}
    </button>
  )
}

// ─── Save indicator ───────────────────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1 text-xs text-sage-green font-semibold"
        >
          <Check size={12} /> Saved
        </motion.span>
      )}
    </AnimatePresence>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [profile,    setProfile]   = useState<ProfileRow | null>(null)
  const [loading,    setLoading]   = useState(true)
  const [openSection, setSection]  = useState<SectionId | null>('profile')

  // ── Profile form ────────────────────────────────────────────────────────────
  const [name,   setName]   = useState('')
  const [age,    setAge]    = useState('')
  const [deity,  setDeity]  = useState('')
  const [gender, setGender] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile,  setSavedProfile]  = useState(false)

  // ── Sadhana settings ────────────────────────────────────────────────────────
  const [targetDays, setTargetDays] = useState(60)
  const [practices,  setPractices]  = useState<PracticeConfig>({
    brahma_muhurta: true, meditation: true, meditation_minutes: 15,
    pranayama: true, prayer: true, prayer_times: ['06:00', '20:00'],
    shloka_study: true, gratitude: true, skincare: true,
    exercise: true, water_intake: true,
  })
  const [newPrayerTime,  setNewPrayerTime]  = useState('')
  const [savingSadhana,  setSavingSadhana]  = useState(false)
  const [savedSadhana,   setSavedSadhana]   = useState(false)

  // ── Reminders ───────────────────────────────────────────────────────────────
  const [reminders, setReminders] = useState<ReminderTimes>({ morning: '06:00', evening: '20:00', urge: '21:00' })
  const [savedReminders, setSavedReminders] = useState(false)

  // ── Export ──────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState<string | null>(null)

  // ── Reset Sadhana ───────────────────────────────────────────────────────────
  const [showResetModal, setShowResetModal]       = useState(false)
  const [resetConfirm,   setResetConfirm]         = useState('')
  const [resetting,      setResetting]            = useState(false)
  const [resetDone,      setResetDone]            = useState(false)

  // ── Delete Account ──────────────────────────────────────────────────────────
  const [showDeleteModal,  setShowDeleteModal]    = useState(false)
  const [deleteStep,       setDeleteStep]         = useState(1)
  const [deleteConfirm,    setDeleteConfirm]      = useState('')
  const [deleting,         setDeleting]           = useState(false)

  // ─── Load profile ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!data) return

    setProfile(data)
    setName(data.full_name ?? '')
    setAge(data.age != null ? String(data.age) : '')
    setDeity(data.ist_deity ?? '')
    setGender(data.gender ?? '')
    setTargetDays(data.target_days)

    const cfg = parsePrayerSchedule(data.prayer_schedule)
    setPractices(cfg)

    const savedRem = localStorage.getItem(REMINDERS_KEY)
    if (savedRem) {
      try { setReminders(JSON.parse(savedRem)) } catch { /* ignore */ }
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Toggle section ───────────────────────────────────────────────────────
  function toggleSection(id: SectionId) {
    setSection((prev) => prev === id ? null : id)
  }

  // ─── Save profile ─────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!profile) return
    setSavingProfile(true)
    await supabase.from('profiles').update({
      full_name: name.trim() || null,
      age:       age ? parseInt(age) : null,
      ist_deity: deity || null,
      gender:    gender || null,
    }).eq('id', profile.id)
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
  }

  // ─── Save sadhana settings ────────────────────────────────────────────────
  async function saveSadhana() {
    if (!profile) return
    setSavingSadhana(true)
    const newSchedule = buildPrayerSchedule(practices, profile.prayer_schedule)
    await supabase.from('profiles').update({
      target_days:      targetDays,
      prayer_schedule:  newSchedule,
    }).eq('id', profile.id)
    setSavingSadhana(false)
    setSavedSadhana(true)
    setTimeout(() => setSavedSadhana(false), 2500)
  }

  // ─── Save reminders ───────────────────────────────────────────────────────
  function saveReminders() {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders))
    setSavedReminders(true)
    setTimeout(() => setSavedReminders(false), 2500)
  }

  // ─── Data export ──────────────────────────────────────────────────────────
  async function exportData(type: 'daily' | 'urge' | 'weekly') {
    if (!profile) return
    setExporting(type)

    if (type === 'daily') {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('log_date')
      if (data && data.length > 0) {
        const headers = Object.keys(data[0])
        const rows    = data.map((r) => headers.map((h) => String(r[h as keyof typeof r] ?? '')))
        downloadCsv([headers, ...rows], `sadhana-daily-logs-${todayISO()}.csv`)
      }
    }

    if (type === 'urge') {
      const { data } = await supabase
        .from('urge_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('logged_at')
      if (data && data.length > 0) {
        const headers = Object.keys(data[0])
        const rows    = data.map((r) => headers.map((h) => String(r[h as keyof typeof r] ?? '')))
        downloadCsv([headers, ...rows], `sadhana-urge-logs-${todayISO()}.csv`)
      }
    }

    if (type === 'weekly') {
      const { data } = await supabase
        .from('weekly_reflections')
        .select('*')
        .eq('user_id', profile.id)
        .order('week_start_date')
      if (data && data.length > 0) {
        const headers = Object.keys(data[0])
        const rows    = data.map((r) => headers.map((h) => String(r[h as keyof typeof r] ?? '')))
        downloadCsv([headers, ...rows], `sadhana-reflections-${todayISO()}.csv`)
      }
    }

    setExporting(null)
  }

  // ─── Reset sadhana ────────────────────────────────────────────────────────
  async function resetSadhana() {
    if (!profile || resetConfirm.trim().toLowerCase() !== 'reset') return
    setResetting(true)

    // Archive summary to localStorage
    const { data: streakData } = await supabase
      .from('v_current_streak')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()

    const archive = {
      archivedAt:   new Date().toISOString(),
      startDate:    profile.sadhana_start_date,
      targetDays:   profile.target_days,
      totalDays:    streakData?.total_days_maintained ?? 0,
      longestStreak: streakData?.current_streak ?? 0,
    }

    try {
      const existing = JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? '[]') as unknown[]
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...existing, archive]))
    } catch { /* ignore */ }

    // Reset profile: new start date
    await supabase.from('profiles').update({
      sadhana_start_date: todayISO(),
    }).eq('id', profile.id)

    // Reset milestones
    await supabase.from('milestones').delete().eq('user_id', profile.id)
    await supabase.rpc('seed_milestones', { p_user_id: profile.id })

    setResetting(false)
    setResetDone(true)
    setShowResetModal(false)
    setTimeout(() => { setResetDone(false); router.push('/dashboard') }, 2000)
  }

  // ─── Delete account ───────────────────────────────────────────────────────
  async function deleteAccount() {
    if (!profile || deleteConfirm.trim().toLowerCase() !== 'delete my account') return
    setDeleting(true)

    // Delete all user data in order
    await Promise.all([
      supabase.from('daily_logs').delete().eq('user_id', profile.id),
      supabase.from('urge_logs').delete().eq('user_id', profile.id),
      supabase.from('milestones').delete().eq('user_id', profile.id),
      supabase.from('weekly_reflections').delete().eq('user_id', profile.id),
      supabase.from('affirmations').delete().eq('user_id', profile.id),
      supabase.from('scripture_progress').delete().eq('user_id', profile.id),
      supabase.from('ai_reports').delete().eq('user_id', profile.id),
    ])
    await supabase.from('profiles').delete().eq('id', profile.id)

    // Clear localStorage
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('sadhanaos_'))
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    await supabase.auth.signOut()
    router.push('/')
  }

  // ─── Prayer time helpers ──────────────────────────────────────────────────
  function addPrayerTime() {
    const t = newPrayerTime.trim()
    if (!t || practices.prayer_times.includes(t)) return
    const sorted = [...practices.prayer_times, t].sort()
    setPractices((p) => ({ ...p, prayer_times: sorted }))
    setNewPrayerTime('')
  }

  function removePrayerTime(t: string) {
    setPractices((p) => ({ ...p, prayer_times: p.prayer_times.filter((x) => x !== t) }))
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment to-cream flex items-center justify-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl">🕉️</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream pb-20">

      {/* Header */}
      <div className="px-4 pt-8 pb-2 text-center">
        <p className="font-devanagari text-sacred-saffron text-base tracking-wide">सेटिंग्स</p>
        <h1 className="font-display text-3xl text-indigo-deep font-semibold mt-0.5">Settings</h1>
        <p className="text-sm text-twilight mt-1">Manage your sadhana configuration</p>
      </div>

      {/* Quick nav */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { toggleSection(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                openSection === s.id
                  ? 'bg-sacred-saffron text-white border-sacred-saffron'
                  : 'border-sandstone text-twilight bg-white/70 hover:border-sacred-saffron/50'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-3">

        {/* ── 1. Profile ─────────────────────────────────────────────────── */}
        <Section
          id="profile"
          open={openSection === 'profile'}
          onToggle={() => toggleSection('profile')}
          icon={<User size={15} />}
          label="Profile"
          sublabel="Name, age, ishta devata"
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age"
                type="number"
                min={13} max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <div>
                <p className="text-xs font-semibold text-twilight mb-2">Gender</p>
                <div className="flex gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(gender === g ? '' : g)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border capitalize transition-all ${
                        gender === g
                          ? 'bg-sacred-saffron/15 border-sacred-saffron text-sacred-saffron font-semibold'
                          : 'border-sandstone text-twilight'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ishta Devata */}
            <div>
              <p className="text-xs font-semibold text-twilight mb-2">Ishta Devata</p>
              <div className="grid grid-cols-3 gap-2">
                {DEITIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDeity(deity === d.id ? '' : d.id)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all ${
                      deity === d.id
                        ? 'border-sacred-saffron bg-sacred-saffron/10'
                        : 'border-sandstone bg-white/60 hover:border-sacred-saffron/40'
                    }`}
                  >
                    <p className={`font-devanagari text-xs font-semibold ${deity === d.id ? 'text-sacred-saffron' : 'text-indigo-deep'}`}>
                      {d.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                size="sm"
                onClick={saveProfile}
                loading={savingProfile}
              >
                Save Profile
              </Button>
              <SavedBadge show={savedProfile} />
            </div>
          </div>
        </Section>

        {/* ── 2. Sadhana Settings ────────────────────────────────────────── */}
        <Section
          id="sadhana"
          open={openSection === 'sadhana'}
          onToggle={() => toggleSection('sadhana')}
          icon={<Settings size={15} />}
          label="Sadhana Settings"
          sublabel="Target days & active rituals"
        >
          <div className="space-y-5">
            {/* Target duration */}
            <div>
              <p className="text-xs font-semibold text-twilight mb-2">Target Duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setTargetDays(d)}
                    className={`px-4 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                      targetDays === d
                        ? 'bg-sacred-saffron text-white border-sacred-saffron shadow-gold-glow'
                        : 'border-sandstone text-twilight bg-white/60 hover:border-sacred-saffron/50'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Rituals */}
            <div>
              <p className="text-xs font-semibold text-twilight mb-2">Active Rituals</p>
              <div className="flex flex-wrap gap-2">
                {PRACTICES.map(({ key, hi, en, Icon }) => (
                  <Toggle
                    key={key}
                    on={!!practices[key as keyof typeof practices]}
                    onToggle={() => setPractices((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    label={en}
                    hi={hi}
                    Icon={Icon}
                  />
                ))}
              </div>
            </div>

            {/* Meditation minutes — show only if meditation on */}
            {practices.meditation && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-twilight shrink-0">Meditation duration</p>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPractices((p) => ({ ...p, meditation_minutes: m }))}
                      className={`w-10 h-8 rounded-lg border text-xs font-semibold transition-all ${
                        practices.meditation_minutes === m
                          ? 'bg-sacred-saffron/15 border-sacred-saffron text-sacred-saffron'
                          : 'border-sandstone text-twilight'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <span className="text-xs text-twilight">min</span>
                </div>
              </div>
            )}

            {/* Prayer times — show only if prayer on */}
            {practices.prayer && (
              <div>
                <p className="text-xs font-semibold text-twilight mb-2">Prayer Times</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {practices.prayer_times.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 bg-sacred-saffron/10 border border-sacred-saffron/30 text-sacred-saffron text-xs px-2.5 py-1 rounded-full font-semibold"
                    >
                      {t}
                      <button onClick={() => removePrayerTime(t)} className="hover:text-rose-red transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={newPrayerTime}
                    onChange={(e) => setNewPrayerTime(e.target.value)}
                    className="text-xs rounded-lg border border-sandstone bg-white/80 px-2 py-1.5 text-indigo-deep focus:outline-none focus:border-sacred-saffron"
                  />
                  <button
                    onClick={addPrayerTime}
                    disabled={!newPrayerTime}
                    className="flex items-center gap-1 text-xs text-sacred-saffron border border-sacred-saffron/40 rounded-lg px-2 py-1.5 hover:bg-sacred-saffron/8 disabled:opacity-40 transition-all"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button size="sm" onClick={saveSadhana} loading={savingSadhana}>
                Save Settings
              </Button>
              <SavedBadge show={savedSadhana} />
            </div>
          </div>
        </Section>

        {/* ── 3. Reminder Times ─────────────────────────────────────────── */}
        <Section
          id="reminders"
          open={openSection === 'reminders'}
          onToggle={() => toggleSection('reminders')}
          icon={<Bell size={15} />}
          label="Daily Reminder Times"
          sublabel="Stored on this device only"
        >
          <div className="space-y-4">
            <p className="text-xs text-twilight">
              Set your preferred times for daily check-ins. These are saved locally and can be used with browser notifications if enabled.
            </p>

            {(
              [
                { key: 'morning' as const, label: 'Morning Log',   desc: 'When to log your morning sadhana',   icon: '🌅' },
                { key: 'evening' as const, label: 'Evening Review', desc: 'When to reflect on your day',        icon: '🌙' },
                { key: 'urge'    as const, label: 'Urge Check-in',  desc: 'Reminder to log any urge battles',   icon: '🛡️' },
              ] as const
            ).map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center shrink-0">{icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-deep">{label}</p>
                  <p className="text-xs text-twilight">{desc}</p>
                </div>
                <input
                  type="time"
                  value={reminders[key]}
                  onChange={(e) => setReminders((r) => ({ ...r, [key]: e.target.value }))}
                  className="text-sm rounded-lg border border-sandstone bg-white/80 px-2 py-1.5 text-indigo-deep focus:outline-none focus:border-sacred-saffron font-semibold"
                />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <Button size="sm" variant="secondary" onClick={saveReminders}>
                Save Times
              </Button>
              <SavedBadge show={savedReminders} />
            </div>
          </div>
        </Section>

        {/* ── 4. Data Export ────────────────────────────────────────────── */}
        <Section
          id="export"
          open={openSection === 'export'}
          onToggle={() => toggleSection('export')}
          icon={<Download size={15} />}
          label="Data Export"
          sublabel="Download your sadhana records"
        >
          <div className="space-y-3">
            <p className="text-xs text-twilight">
              Download your data as CSV files. Your data belongs to you.
            </p>

            {(
              [
                { type: 'daily'  as const, label: 'Daily Logs',        desc: 'All daily check-ins: mood, meditation, urges, rituals',  icon: '📋' },
                { type: 'urge'   as const, label: 'Urge Logs',         desc: 'Every urge battle: intensity, triggers, outcome',        icon: '⚔️' },
                { type: 'weekly' as const, label: 'Weekly Reflections', desc: 'All 8-dimension weekly ratings and reflections',         icon: '📊' },
              ]
            ).map(({ type, label, desc, icon }) => (
              <div key={type} className="flex items-center gap-3 p-3 rounded-xl border border-sandstone bg-parchment/40">
                <span className="text-xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-deep">{label}</p>
                  <p className="text-xs text-twilight">{desc}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => exportData(type)}
                  loading={exporting === type}
                  className="shrink-0"
                >
                  {exporting === type ? '' : 'Export'}
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Reset Sadhana ─────────────────────────────────────────── */}
        <Section
          id="reset"
          open={openSection === 'reset'}
          onToggle={() => toggleSection('reset')}
          icon={<RefreshCw size={15} />}
          label="Reset Sadhana"
          sublabel="Start a fresh journey"
          accent
        >
          <div className="space-y-3">
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">What this does</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                  <li>Resets your start date to today</li>
                  <li>Reseeds milestones as unachieved</li>
                  <li>Archives your current journey progress (locally)</li>
                  <li>All past logs, urge data, and reflections are preserved</li>
                </ul>
              </div>
            </div>

            {resetDone ? (
              <p className="text-sm text-center text-sage-green font-semibold py-2">
                ✅ Sadhana reset. Starting fresh from today. 🙏
              </p>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowResetModal(true)}
              >
                Reset Sadhana
              </Button>
            )}
          </div>
        </Section>

        {/* ── 6. Account ───────────────────────────────────────────────── */}
        <Section
          id="account"
          open={openSection === 'account'}
          onToggle={() => toggleSection('account')}
          icon={<Trash2 size={15} />}
          label="Account"
          sublabel="Danger zone"
          accent
        >
          <div className="space-y-3">
            {/* Sign out */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-sandstone bg-parchment/40">
              <div>
                <p className="text-sm font-semibold text-indigo-deep">Sign Out</p>
                <p className="text-xs text-twilight">You can sign back in anytime</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              >
                Sign Out
              </Button>
            </div>

            {/* Delete account */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-rose-red/30 bg-rose-red/5">
              <div>
                <p className="text-sm font-semibold text-rose-red">Delete Account</p>
                <p className="text-xs text-twilight">Permanently removes all your data</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteConfirm('') }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Section>

        {/* ── 7. About ─────────────────────────────────────────────────── */}
        <Section
          id="about"
          open={openSection === 'about'}
          onToggle={() => toggleSection('about')}
          icon={<Info size={15} />}
          label="About SadhanaOS"
          sublabel="v0.1.0"
        >
          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="font-devanagari text-3xl text-sacred-saffron">🕉️</p>
              <p className="font-display text-xl text-indigo-deep font-semibold mt-1">SadhanaOS</p>
              <p className="text-xs text-twilight">Version 0.1.0 — Dawn Ashram Release</p>
            </div>

            <div className="space-y-2 text-xs text-twilight">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-parchment/60 border border-sandstone">
                <Shield size={13} className="text-sacred-saffron mt-0.5 shrink-0" />
                <p>Built for sincere seekers of brahmacharya. All data is stored in your own Supabase project. No third-party analytics. No ads.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl border border-sandstone bg-white/60 text-center">
                  <p className="font-semibold text-indigo-deep text-sm">Stack</p>
                  <p className="mt-1">Next.js 16 · Supabase · Groq AI · Tailwind v4</p>
                </div>
                <div className="p-3 rounded-xl border border-sandstone bg-white/60 text-center">
                  <p className="font-semibold text-indigo-deep text-sm">Wisdom</p>
                  <p className="mt-1">Bhagavad Gita · Yoga Sutras · Ramcharitmanas · Upanishads</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-sandstone bg-parchment/60 text-center space-y-1">
                <p className="font-semibold text-indigo-deep">
                  ॐ तत् सत्
                </p>
                <p className="italic">
                  &ldquo;That thou art. All this is the eternal truth.&rdquo;
                </p>
                <p className="text-twilight/60">— Chandogya Upanishad</p>
              </div>
            </div>
          </div>
        </Section>

      </div>

      {/* ── Reset Sadhana Modal ──────────────────────────────────────────────── */}
      <Modal
        open={showResetModal}
        onClose={() => { setShowResetModal(false); setResetConfirm('') }}
        title="Reset Sadhana"
        size="sm"
      >
        <div className="space-y-4 px-1">
          <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Your journey summary will be archived locally. All logs are kept. Milestones will be reset. This cannot be undone.
            </p>
          </div>
          <p className="text-sm text-indigo-deep">
            Type <strong>reset</strong> to confirm:
          </p>
          <Input
            label="Type 'reset'"
            value={resetConfirm}
            onChange={(e) => setResetConfirm(e.target.value)}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button size="sm" variant="ghost" onClick={() => { setShowResetModal(false); setResetConfirm('') }}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={resetConfirm.trim().toLowerCase() !== 'reset'}
              loading={resetting}
              onClick={resetSadhana}
            >
              Reset Journey
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Account Modal ─────────────────────────────────────────────── */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirm('') }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4 px-1">
          {deleteStep === 1 ? (
            <>
              <div className="flex gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 space-y-1">
                  <p className="font-semibold">This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Your profile and all settings</li>
                    <li>All daily logs and mood data</li>
                    <li>All urge logs</li>
                    <li>All reflections and AI reports</li>
                    <li>All milestones and progress</li>
                  </ul>
                  <p className="pt-1 font-semibold">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteStep(2)}>
                  I understand, continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-indigo-deep">
                Type <strong>delete my account</strong> to confirm permanent deletion:
              </p>
              <Input
                label="Type 'delete my account'"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirm('') }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleteConfirm.trim().toLowerCase() !== 'delete my account'}
                  loading={deleting}
                  onClick={deleteAccount}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete Everything'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

    </div>
  )
}
