'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Save, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ShlokCard }     from '@/components/sacred/ShlokCard'
import { MantraCounter } from '@/components/sacred/MantraCounter'
import type { Database } from '@/types/database'

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row']
type ProfileRow  = Database['public']['Tables']['profiles']['Row']

// ─── Prayer texts ──────────────────────────────────────────────────────────────

interface PrayerText {
  id:              string
  name:            string
  nameEn:          string
  sanskrit:        string
  transliteration: string
  hindi:           string
  english:         string
  context:         string
}

const GAYATRI: PrayerText = {
  id:              'gayatri',
  name:            'गायत्री मंत्र',
  nameEn:          'Gayatri Mantra',
  sanskrit:        'ॐ भूर्भुवः स्वः ।\nतत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ।।',
  transliteration: 'om bhur bhuvah svah | tat savitur varenyam | bhargo devasya dhimahi | dhiyo yo nah prachodayat',
  hindi:           'हम उस परम दिव्य तेज का ध्यान करते हैं जो सूर्य-देव का प्रकाश है। वह हमारी बुद्धि को प्रेरित और प्रकाशित करे।',
  english:         'We meditate on the divine radiance of Savitri (Sun). May that light inspire and illuminate our intellect.',
  context:         'Rig Veda 3.62.10 — the most sacred Vedic mantra, prescribed for 108 recitations at Brahma Muhurta. Purifies mind, awakens viveka.',
}

const DEITY_PRAYERS: Record<string, PrayerText[]> = {
  krishna: [
    {
      id:              'hare-krishna',
      name:            'हरे कृष्ण महामंत्र',
      nameEn:          'Hare Krishna Mahamantra',
      sanskrit:        'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ।\nहरे राम हरे राम राम राम हरे हरे ।।',
      transliteration: 'hare krishna hare krishna krishna krishna hare hare | hare rama hare rama rama rama hare hare',
      hindi:           'हे कृष्ण! हे राम! हे हरे! — मेरे मन के सारे कलुष हर लो और मुझे अपने चरणों में स्थान दो।',
      english:         'O Krishna, O Rama, O Hari — remove the mind\'s afflictions and shelter me at your lotus feet.',
      context:         'Kali-Santarana Upanishad — the Mahamantra for Kali Yuga. The supreme means of crossing the ocean of material existence through divine names.',
    },
    {
      id:              'om-namo-vasudeva',
      name:            'ॐ नमो भगवते वासुदेवाय',
      nameEn:          'Dvadasha-Akshari Mantra',
      sanskrit:        'ॐ नमो भगवते वासुदेवाय',
      transliteration: 'om namo bhagavate vasudevaya',
      hindi:           'हे सर्वव्यापी वासुदेव भगवान! आपको नमस्कार।',
      english:         'I bow to Lord Vasudeva — the all-pervading supreme being who dwells in all hearts.',
      context:         'Bhagavata Purana — the twelve-syllable mantra of Vishnu. "Vasudeva" means one who abides in all, recognizing Krishna as the omnipresent Self.',
    },
  ],
  ram: [
    {
      id:              'shri-ram',
      name:            'श्री राम जय राम',
      nameEn:          'Sri Rama Jaya Rama',
      sanskrit:        'श्री राम जय राम जय जय राम',
      transliteration: 'shri rama jaya rama jaya jaya rama',
      hindi:           'हे श्री राम! आपकी जय हो, पुनः जय हो।',
      english:         'Victory to Sri Rama — the embodiment of dharma and the highest ideal of human life.',
      context:         'Given by Swami Ramdas as the simplest, most powerful Rama-nama. Tulsidas: "Ram naam sab se uttam" — the name of Rama is supreme among all.',
    },
    {
      id:              'apadamapahartaram',
      name:            'आपदामपहर्तारम् — राम स्तुति',
      nameEn:          'Rama Stuti',
      sanskrit:        'आपदामपहर्तारं दातारं सर्वसम्पदाम् ।\nलोकाभिरामं श्रीरामं भूयो भूयो नमाम्यहम् ।।',
      transliteration: 'apadamapahartaram dataram sarvasampadam | lokabhiramam shriramam bhuyo bhuyo namamyaham',
      hindi:           'विपत्तियों को हरने वाले, सभी सम्पदाओं को देने वाले, समस्त लोकों को प्रिय श्री राम को मैं बार-बार नमस्कार करता हूँ।',
      english:         'I bow again and again to Sri Rama — remover of calamities, giver of all wealth, beloved of all the worlds.',
      context:         'Ram Raksha Stotram of sage Budha Koushika — one of the most potent protective prayers in the Vaishnava tradition.',
    },
  ],
  shiva: [
    {
      id:              'mahamrityunjaya',
      name:            'महामृत्युंजय मंत्र',
      nameEn:          'Mahamrityunjaya Mantra',
      sanskrit:        'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ।।',
      transliteration: 'om tryambakam yajamahe sugandhim pushtivardhanam | urvarukam iva bandhanat mrityor mukshiya maamritat',
      hindi:           'हम त्र्यम्बक (तीन नेत्रों वाले शिव) की पूजा करते हैं। जैसे ककड़ी अपनी बेल से मुक्त होती है, वैसे मृत्यु से नहीं — अमरत्व की ओर मुक्त करो।',
      english:         'We worship Tryambaka (three-eyed Shiva). As a ripe cucumber is freed from its stalk — liberate us from death, lead us to immortality.',
      context:         'Rig Veda 7.59.12 — called Mritasanjivani (reviver from death). Prescribed 108 recitations daily for healing, protection, and liberation.',
    },
    {
      id:              'om-namah-shivaya',
      name:            'ॐ नमः शिवाय',
      nameEn:          'Panchakshara Mantra',
      sanskrit:        'ॐ नमः शिवाय',
      transliteration: 'om namah shivaya',
      hindi:           'भगवान शिव को नमस्कार।',
      english:         'I bow to Lord Shiva — Na-Ma-Shi-Va-Ya represents the five elements: earth, water, fire, air, space.',
      context:         'Panchakshara from the Krishna Yajurveda\'s Shri Rudram. Each syllable represents a cosmic element. The supreme mantra of Shaivism.',
    },
  ],
  hanuman: [
    {
      id:              'hanuman-chalisa-doha',
      name:            'हनुमान चालीसा — उद्घाटन दोहा',
      nameEn:          'Hanuman Chalisa (Opening Doha)',
      sanskrit:        'श्री गुरु चरन सरोज रज निज मनु मुकुरु सुधारि ।\nबरनउँ रघुबर बिमल जसु जो दायकु फल चारि ।।',
      transliteration: 'shri guru charan saroj raj nij manu mukuru sudhari | baranaum raghubar bimal jasu jo dayaku phala chari',
      hindi:           'श्री गुरु के चरण-कमलों की धूलि से अपने मन-दर्पण को साफ करके, मैं रघुवर के पवित्र यश का वर्णन करता हूँ।',
      english:         'Having purified the mirror of my mind with my Guru\'s lotus-dust, I sing the pure glory of Raghuvara — giver of all four fruits.',
      context:         'Opening doha of Hanuman Chalisa by Tulsidas. Hanuman is the supreme model of brahmacharya — all his power arose from complete celibacy and surrender to Rama.',
    },
    {
      id:              'hanuman-mantra',
      name:            'हनुमान मंत्र',
      nameEn:          'Hanuman Mantra',
      sanskrit:        'ॐ हनुमते नमः',
      transliteration: 'om hanumate namah',
      hindi:           'वज्रांग हनुमानजी को नमस्कार।',
      english:         'I bow to Hanuman — whose brahmachary gave him the strength to cross oceans and serve Rama unfailingly.',
      context:         'The patron deity of brahmacharya sadhana. His extraordinary power arose from Rama-bhakti and lifelong celibacy. Chanting his name builds the same discipline.',
    },
  ],
  devi: [
    {
      id:              'ya-devi',
      name:            'या देवी सर्वभूतेषु',
      nameEn:          'Devi Stuti (Durga Saptashati)',
      sanskrit:        'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता ।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ।।',
      transliteration: 'ya devi sarva-bhuteshu shakti-rupena samsthita | namastasyai namastasyai namastasyai namo namah',
      hindi:           'जो देवी सभी प्राणियों में शक्ति-स्वरूप में स्थित हैं — उन्हें नमस्कार, नमस्कार, बार-बार नमस्कार।',
      english:         'To the Goddess who abides in all beings as Shakti — salutation, salutation, salutation again.',
      context:         'Durga Saptashati (Devi Mahatmyam), Ch. 5. This verse repeats for each manifestation: Chetana (consciousness), Mati (intellect), Kshudha (hunger) — the Divine in all.',
    },
    {
      id:              'sarva-mangala',
      name:            'सर्वमंगल माङ्गल्ये',
      nameEn:          'Durga Mantra',
      sanskrit:        'सर्वमंगल माङ्गल्ये शिवे सर्वार्थसाधिके ।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ।।',
      transliteration: 'sarva-mangala-mangalye shive sarvartha-sadhike | sharanyaye tryambake gauri narayani namostute',
      hindi:           'सभी मंगलों की मंगलस्वरूपिणी, कल्याणमयी, सब अर्थों की साधिका, शरणदायिनी, त्रिनेत्री गौरी नारायणी — आपको नमस्कार।',
      english:         'O most auspicious, O Shiva, fulfiller of all purposes, refuge-giver, three-eyed Gauri, Narayani — I bow to you.',
      context:         'Durga Saptashati — the most complete invocation of Devi. "Narayani" signals Devi and Vishnu are not two but one supreme reality.',
    },
  ],
}

// ─── Japa mantra list ─────────────────────────────────────────────────────────

const JAPA_MANTRAS = [
  { label: 'ॐ',              full: 'ॐ' },
  { label: 'गायत्री मंत्र',  full: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्' },
  { label: 'महामृत्युंजय',   full: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्' },
  { label: 'हरे कृष्ण',      full: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे' },
  { label: 'ॐ नमः शिवाय',    full: 'ॐ नमः शिवाय' },
  { label: 'राम राम',         full: 'श्री राम जय राम जय जय राम' },
]

const DEITY_NAMES: Record<string, string> = {
  krishna: 'Krishna', ram: 'Rama', shiva: 'Shiva', hanuman: 'Hanuman', devi: 'Devi',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split('T')[0] }

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

function getSlotName(time: string): { hi: string; en: string } {
  const h = parseInt(time.split(':')[0], 10)
  if (h >= 3  && h < 6)  return { hi: 'ब्रह्म मुहूर्त',   en: 'Brahma Muhurta' }
  if (h >= 6  && h < 9)  return { hi: 'प्रातः काल',       en: 'Morning Prayer' }
  if (h >= 9  && h < 12) return { hi: 'पूर्वाह्न',        en: 'Forenoon Prayer' }
  if (h >= 12 && h < 15) return { hi: 'मध्याह्न',         en: 'Noon Prayer' }
  if (h >= 15 && h < 18) return { hi: 'अपराह्न',          en: 'Afternoon Prayer' }
  if (h >= 18 && h < 21) return { hi: 'संध्या',           en: 'Sandhya Prayer' }
  return { hi: 'रात्रि प्रार्थना',  en: 'Night Prayer' }
}

function getSlotSuggestion(time: string, deity: string | null): string {
  const h = parseInt(time.split(':')[0], 10)
  if (h >= 3 && h < 8) return 'Gayatri Mantra'
  if (deity === 'krishna') return 'Hare Krishna Mahamantra'
  if (deity === 'ram' || deity === 'hanuman') return 'श्री राम जय राम'
  if (deity === 'shiva') return 'ॐ नमः शिवाय'
  if (deity === 'devi') return 'या देवी सर्वभूतेषु'
  return 'Gayatri Mantra'
}

function prayerStreak(logs: DailyLogRow[], slot: string): number {
  let s = 0
  for (let i = 0; i < 7; i++) {
    const log = logs.find(l => l.log_date === daysAgo(i))
    if (!log) { if (i === 0) continue; break }
    const pc = log.prayers_completed
    if (pc && typeof pc === 'object' && !Array.isArray(pc) && (pc as Record<string, unknown>)[slot]) {
      s++
    } else { break }
  }
  return s
}

function gratitudePattern(logs: DailyLogRow[]): string | null {
  const stop = new Set(['मैं', 'है', 'हूँ', 'का', 'की', 'के', 'में', 'से', 'को', 'और', 'पर', 'i', 'am', 'the', 'a', 'an', 'is', 'was', 'for', 'my', 'to', 'of', 'it', 'that', 'very', 'so', 'be', 'this'])
  const freq: Record<string, number> = {}
  for (const log of logs) {
    for (const g of [log.gratitude_1, log.gratitude_2, log.gratitude_3]) {
      if (g) {
        g.toLowerCase().split(/[\s,।.।।!?]+/).forEach(w => {
          if (w.length > 2 && !stop.has(w)) freq[w] = (freq[w] ?? 0) + 1
        })
      }
    }
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
  return top && top[1] >= 3
    ? `You mentioned "${top[0]}" ${top[1]} times this month. 💛`
    : null
}

const JAPA_TODAY_KEY = 'sadhanaos_japa_today'
const JAPA_TOTAL_KEY = 'sadhanaos_japa_total'

function readJapa() {
  try {
    const raw = JSON.parse(localStorage.getItem(JAPA_TODAY_KEY) ?? 'null')
    const todayMalas    = raw?.date === todayISO() ? (raw.malas as number ?? 0) : 0
    const allTimeMalas  = parseInt(localStorage.getItem(JAPA_TOTAL_KEY) ?? '0', 10)
    return { todayMalas, allTimeMalas }
  } catch { return { todayMalas: 0, allTimeMalas: 0 } }
}

function writeJapa(todayMalas: number, allTimeMalas: number) {
  try {
    localStorage.setItem(JAPA_TODAY_KEY, JSON.stringify({ date: todayISO(), malas: todayMalas }))
    localStorage.setItem(JAPA_TOTAL_KEY, String(allTimeMalas))
  } catch { /* storage unavailable */ }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'prayer' | 'gratitude' | 'japa'

const TABS: { key: Tab; hi: string }[] = [
  { key: 'prayer',    hi: 'प्रार्थना' },
  { key: 'gratitude', hi: 'कृतज्ञता' },
  { key: 'japa',      hi: 'जप माला' },
]

export default function PrarthanaPage() {
  const [tab,     setTab]     = useState<Tab>('prayer')
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [logs,    setLogs]    = useState<DailyLogRow[]>([])

  // Prayer state
  const [prayersDone, setPrayersDone] = useState<Record<string, boolean>>({})

  // Gratitude state
  const [g1, setG1]   = useState('')
  const [g2, setG2]   = useState('')
  const [g3, setG3]   = useState('')
  const [saved, setSaved] = useState(false)

  // Japa state (localStorage-backed)
  const [selectedMantra, setMantra]    = useState(JAPA_MANTRAS[0].full)
  const [customMantra,   setCustom]    = useState('')
  const [useCustom,      setUseCustom] = useState(false)
  const [todayMalas,     setToday]     = useState(0)
  const [allTimeMalas,   setAllTime]   = useState(0)

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const [profileRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('daily_logs').select('*')
          .eq('user_id', user.id)
          .gte('log_date', daysAgo(30))
          .order('log_date', { ascending: false }),
      ])

      setProfile(profileRes.data)
      const allLogs = logsRes.data ?? []
      setLogs(allLogs)

      const todayLog = allLogs.find(l => l.log_date === todayISO())
      if (todayLog) {
        const pc = todayLog.prayers_completed
        if (pc && typeof pc === 'object' && !Array.isArray(pc)) {
          setPrayersDone(pc as Record<string, boolean>)
        }
        setG1(todayLog.gratitude_1 ?? '')
        setG2(todayLog.gratitude_2 ?? '')
        setG3(todayLog.gratitude_3 ?? '')
      }
      setLoading(false)
    })()
  }, [])

  // ── Japa localStorage init ──────────────────────────────────────────────────
  useEffect(() => {
    const { todayMalas: tm, allTimeMalas: at } = readJapa()
    setToday(tm)
    setAllTime(at)
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const deity = profile?.ist_deity?.toLowerCase() ?? null

  const prayerTimes: string[] = useMemo(() => {
    const ps = profile?.prayer_schedule
    if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
      const t = (ps as Record<string, unknown>).times
      if (Array.isArray(t) && t.length > 0) return t as string[]
    }
    return ['06:00', '20:00']
  }, [profile])

  const prayerCards: PrayerText[] = useMemo(() => {
    if (deity && DEITY_PRAYERS[deity]) return [GAYATRI, ...DEITY_PRAYERS[deity]]
    return [GAYATRI]
  }, [deity])

  const activeMantra = useCustom && customMantra.trim() ? customMantra.trim() : selectedMantra

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function togglePrayer(slot: string) {
    if (!userId) return
    const newDone = { ...prayersDone, [slot]: !(prayersDone[slot] ?? false) }
    setPrayersDone(newDone)
    await supabase.from('daily_logs')
      .upsert(
        { user_id: userId, log_date: todayISO(), prayers_completed: newDone },
        { onConflict: 'user_id,log_date' }
      )
  }

  async function saveGratitude() {
    if (!userId) return
    await supabase.from('daily_logs')
      .upsert(
        { user_id: userId, log_date: todayISO(), gratitude_1: g1 || null, gratitude_2: g2 || null, gratitude_3: g3 || null },
        { onConflict: 'user_id,log_date' }
      )
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleMalaComplete() {
    const newToday = todayMalas + 1
    const newTotal = allTimeMalas + 1
    setToday(newToday)
    setAllTime(newTotal)
    writeJapa(newToday, newTotal)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment to-cream px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="rounded-card bg-sandstone/40 h-32 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment to-cream pb-24">

      {/* Sticky header + tabs */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md border-b border-sandstone">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          <h1 className="font-devanagari text-2xl text-indigo-deep mb-2">
            प्रार्थना · कृतज्ञता · जप
          </h1>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-1.5 rounded-card text-xs font-medium transition-all font-devanagari ${
                  tab === t.key
                    ? 'bg-sacred-saffron text-dawn-white'
                    : 'text-twilight hover:text-indigo-deep'
                }`}
              >
                {t.hi}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">

          {/* ───── Prayer tab ───── */}
          {tab === 'prayer' && (
            <motion.div
              key="prayer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Prayer schedule */}
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
                  आज का कार्यक्रम · Prayer Schedule
                </h2>
                <div className="space-y-2">
                  {prayerTimes.map(slot => {
                    const name    = getSlotName(slot)
                    const done    = prayersDone[slot] ?? false
                    const streak  = prayerStreak(logs, slot)
                    const suggest = getSlotSuggestion(slot, deity)
                    return (
                      <div
                        key={slot}
                        className={`rounded-card border p-4 flex items-center gap-3 transition-all ${
                          done ? 'border-sage-green/30 bg-sage-green/5' : 'border-sandstone bg-parchment shadow-warm-sm'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-devanagari text-sm font-medium text-indigo-deep">{name.hi}</span>
                            <span className="text-xs text-twilight">{slot}</span>
                            {streak > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-sacred-saffron">
                                <Flame size={10} />
                                {streak}d
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-twilight mt-0.5 truncate">{suggest}</p>
                        </div>
                        <button
                          onClick={() => togglePrayer(slot)}
                          className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                            done
                              ? 'bg-sage-green border-sage-green text-dawn-white'
                              : 'border-sandstone text-sandstone hover:border-sage-green hover:text-sage-green'
                          }`}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                {prayerTimes.length > 0 && prayerTimes.every(s => prayersDone[s]) && (
                  <p className="text-center text-sm font-devanagari text-sacred-saffron py-1">
                    🙏 सभी प्रार्थनाएं पूर्ण
                  </p>
                )}
              </section>

              {/* Prayer suggestions */}
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
                  {deity && DEITY_NAMES[deity] ? `${DEITY_NAMES[deity]} Prayers · मंत्र` : 'Mantras · मंत्र'}
                </h2>
                <div className="space-y-4">
                  {prayerCards.map(p => (
                    <ShlokCard
                      key={p.id}
                      id={p.id}
                      source={p.nameEn}
                      sanskrit={p.sanskrit}
                      transliteration={p.transliteration}
                      hindi_meaning={p.hindi}
                      english_meaning={p.english}
                      context={p.context}
                    />
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ───── Gratitude tab ───── */}
          {tab === 'gratitude' && (
            <motion.div
              key="gratitude"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Today's entries */}
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
                  आज की कृतज्ञता · Today&apos;s Gratitude
                </h2>
                <div className="rounded-card border border-sandstone bg-parchment p-4 space-y-3 shadow-warm-sm">
                  {([
                    { val: g1, set: setG1, ph: 'मैं ___ के लिए आभारी हूँ… (I am grateful for…)' },
                    { val: g2, set: setG2, ph: 'आज ___ ने मुझे खुश किया… (Something that made me happy…)' },
                    { val: g3, set: setG3, ph: 'एक बात जो मैं अक्सर भूल जाता हूँ… (Something I take for granted…)' },
                  ] as const).map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="shrink-0 mt-2.5 w-5 h-5 rounded-full bg-sacred-saffron/15 text-sacred-saffron text-[10px] flex items-center justify-center font-semibold">
                        {i + 1}
                      </span>
                      <textarea
                        value={item.val}
                        onChange={e => item.set(e.target.value)}
                        placeholder={item.ph}
                        rows={2}
                        className="flex-1 resize-none rounded-card border border-sandstone bg-dawn-white px-3 py-2 text-sm text-indigo-deep placeholder:text-twilight/40 focus:outline-none focus:ring-1 focus:ring-sacred-saffron"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={saveGratitude}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-card text-sm font-medium transition-all ${
                        saved
                          ? 'bg-sage-green text-dawn-white'
                          : 'bg-sacred-saffron text-dawn-white hover:bg-sacred-saffron/90'
                      }`}
                    >
                      {saved ? <><Check size={13} /> Saved 🙏</> : <><Save size={13} /> Save</>}
                    </button>
                  </div>
                </div>
              </section>

              {/* Pattern note */}
              {(() => {
                const p = gratitudePattern(logs)
                return p ? (
                  <div className="rounded-card border border-sacred-saffron/20 bg-sacred-saffron/5 px-4 py-3 text-sm text-indigo-mid font-display italic">
                    {p}
                  </div>
                ) : null
              })()}

              {/* 14-day timeline */}
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
                  पिछले 14 दिन · Recent Timeline
                </h2>
                <div className="space-y-0">
                  {Array.from({ length: 14 }, (_, i) => {
                    const dateStr = daysAgo(i)
                    const log     = logs.find(l => l.log_date === dateStr)
                    const d       = new Date(dateStr + 'T00:00:00')
                    const label   = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                    const entries = [log?.gratitude_1, log?.gratitude_2, log?.gratitude_3].filter(Boolean) as string[]
                    const isToday = i === 0

                    return (
                      <div key={dateStr} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${entries.length > 0 ? 'bg-sacred-saffron' : 'bg-sandstone'}`} />
                          {i < 13 && <div className="w-px flex-1 min-h-[20px] bg-sandstone/50 my-0.5" />}
                        </div>
                        {/* Content */}
                        <div className={`pb-3 flex-1 min-w-0 ${entries.length === 0 && !isToday ? 'opacity-35' : ''}`}>
                          <p className={`text-xs font-medium mb-0.5 ${isToday ? 'text-sacred-saffron' : 'text-twilight'}`}>
                            {isToday ? 'Today' : label}
                          </p>
                          {entries.length > 0 ? (
                            <ul className="space-y-0.5">
                              {entries.map((e, j) => (
                                <li key={j} className="text-xs text-indigo-mid flex gap-1.5 leading-relaxed">
                                  <span className="text-sacred-saffron/50 mt-0.5">•</span>
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-twilight/40 italic">No entry</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </motion.div>
          )}

          {/* ───── Japa tab ───── */}
          {tab === 'japa' && (
            <motion.div
              key="japa"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Mantra selector */}
              <section className="space-y-2">
                <h2 className="text-xs font-semibold text-twilight uppercase tracking-widest">
                  मंत्र चुनें · Select Mantra
                </h2>
                <div className="flex flex-wrap gap-2">
                  {JAPA_MANTRAS.map(m => (
                    <button
                      key={m.full}
                      onClick={() => { setUseCustom(false); setMantra(m.full) }}
                      className={`px-3 py-1.5 rounded-card text-xs font-devanagari font-medium transition-all ${
                        !useCustom && selectedMantra === m.full
                          ? 'bg-sacred-saffron text-dawn-white'
                          : 'bg-sandstone text-twilight hover:bg-sandstone/70'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustom(true)}
                    className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all ${
                      useCustom
                        ? 'bg-indigo-deep text-dawn-white'
                        : 'bg-sandstone text-twilight hover:bg-sandstone/70'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {useCustom && (
                  <input
                    type="text"
                    value={customMantra}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="अपना मंत्र यहाँ लिखें… (Enter your mantra)"
                    className="w-full rounded-card border border-sandstone bg-dawn-white px-3 py-2 text-sm text-indigo-deep font-devanagari placeholder:text-twilight/40 focus:outline-none focus:ring-1 focus:ring-sacred-saffron"
                    lang="hi"
                  />
                )}
              </section>

              {/* Counter */}
              <div className="flex justify-center py-4">
                <MantraCounter
                  key={activeMantra}
                  mantra={activeMantra}
                  target={108}
                  onMalaComplete={handleMalaComplete}
                />
              </div>

              {/* Stats */}
              <div className="rounded-card border border-sandstone bg-parchment p-4 shadow-warm-sm">
                <div className="grid grid-cols-2 gap-4 text-center divide-x divide-sandstone">
                  <div>
                    <p className="text-xs text-twilight">आज की माला</p>
                    <p className="text-3xl font-display font-semibold text-sacred-saffron">{todayMalas}</p>
                    <p className="text-xs text-twilight">Today&apos;s Malas</p>
                  </div>
                  <div>
                    <p className="text-xs text-twilight">कुल माला</p>
                    <p className="text-3xl font-display font-semibold text-indigo-deep">{allTimeMalas}</p>
                    <p className="text-xs text-twilight">All-Time Total</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-twilight/70 italic font-display">
                एक माला = 108 जप · Tap the circle for each recitation
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
