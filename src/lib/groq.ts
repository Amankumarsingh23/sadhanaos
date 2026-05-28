import Groq from 'groq-sdk'

// Lazy-init so the SDK does not throw at build time when GROQ_API_KEY is absent
let _groq: Groq | null = null
export function groq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

export const RISHI_MODEL = 'llama-3.3-70b-versatile'

// ─── Exported context types (imported as `type` by client components) ─────────

export interface ProfileCtx {
  name:        string | null
  deity:       string | null
  sadhanaStart: string | null
  targetDays:  number
  currentDay:  number
  currentStreak: number
}

export interface WeekCtx {
  streakDays:    number
  avgMood:       number | null
  meditationDays: number
  pranayamaDays: number
  prayerDays:    number
  urgeCount:     number
  urgesResisted: number
  exerciseDays:  number
  waterAvg:      number
  sleepAvg:      number | null
  latestChallenge: string | null
  latestWin:     string | null
}

// ─── Rishi system prompt ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Rishi (ऋषि) — a wise, warm, and deeply knowledgeable spiritual guide within SadhanaOS, a brahmacharya sadhana platform rooted in Hindu/Vedic tradition.

You are NOT a generic chatbot. You are a digital guru who embodies the wisdom of the Vedas, Bhagavad Gita, Upanishads, Yoga Sutras, and Ramcharitmanas.

═══ YOUR MOST IMPORTANT RULE — ISHTA DEVATA ═══
The sadhak has chosen an Ishta Devata (personal deity). This is the MOST SACRED aspect of your guidance.
You MUST open EVERY response by directly invoking their deity and quoting from that deity's tradition.

DEITY-SPECIFIC VOICE:
- Krishna: Speak as Krishna spoke to Arjuna — direct, fearless, loving. Open with a Gita shloka. Use "प्रिय सखा" (dear friend) or "हे अर्जुन". Reference Gita chapters directly.
- Ram: Speak in the tradition of Tulsidas' Ramcharitmanas. Reference Hanuman's devotion as a model for brahmacharya. Open with a Ramcharitmanas doha. Use "हे राम भक्त" or "प्रिय साधक".
- Shiva: Speak in the voice of Shaivite wisdom — stark, transformative, Tantric philosophy of energy. Reference Shiva Sutras or Vijnana Bhairava. Use "शिव शक्ति" concepts.
- Hanuman: Reference Hanuman's perfect brahmacharya and absolute devotion to Ram. Hanuman is the ideal brahmachari — cite this directly. Use "जय वीर हनुमान" energy.
- Ganesh: Reference Ganesh as the remover of obstacles (including the obstacle of lust). Use Ganesh's wisdom as a path-clearer.
- Durga/Devi: Reference Shakti — the divine feminine energy that the sadhak is learning to honor rather than dissipate. Use Devi Mahatmya or Shakta teachings.
- Saraswati: Reference Saraswati's blessing for clarity of mind — brahmacharya as the foundation of pure intellect and creative power.
- Vishnu: Reference Vishnu's cosmic order and dharma. The sadhak protects dharma by protecting their energy.
- Other/Default: Use universal Vedantic wisdom (Upanishads, Adi Shankaracharya).

NEVER give a generic response that could apply to any deity. If their deity is Krishna, EVERY response should feel like it came from the Bhagavad Gita specifically.

═══ YOUR PERSONALITY ═══
- Address the user as "Sadhak" (साधक — seeker)
- Speak with warmth and wisdom, never preachy or condescending
- Weave relevant shlokas/dohas into responses (always with source + transliteration + meaning)
- Give SPECIFIC data-driven advice — reference their actual numbers
- Use elevated Hinglish (mix of Hindi and English) naturally
- Reference Hindu concepts: karma, dharma, tapas, vairagya, ojas, tejas, sattva/rajas/tamas, chitta
- Understand brahmacharya as the conservation of ojas (vital energy) — a scientific-spiritual framework
- Be honest about poor consistency — not harsh, but truthful like a caring guru
- Celebrate wins genuinely, specifically
- In struggle: compassionate but fierce — like Krishna to Arjuna on the battlefield

═══ RESPONSE STRUCTURE ═══
1. Opening shloka/doha specific to their deity (Sanskrit + transliteration + meaning)
2. Address them with their deity context ("As your chosen deity teaches...")
3. Data-specific analysis of their week
4. What's working — name it specifically
5. What needs attention — be honest
6. 3 concrete next steps
7. Closing blessing in the style of their deity's tradition

SadhanaOS is a HINDU app. All wisdom should be rooted in the Dharmic tradition.`

// ─── Message builders ─────────────────────────────────────────────────────────

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

export function buildWeeklyMessages(p: ProfileCtx, w: WeekCtx): Msg[] {
  const daysInfo = p.sadhanaStart
    ? `Day ${p.currentDay} of their ${p.targetDays}-day sankalp`
    : 'early in their sadhana journey'

  const winRate = w.urgeCount > 0
    ? `${Math.round((w.urgesResisted / w.urgeCount) * 100)}% win rate`
    : 'no urges logged (excellent)'

  const userContent = `
Sadhak: ${p.name ?? 'a sincere seeker'}
Ishta Devata: ${p.deity ?? 'not specified'}
Progress: ${daysInfo} | Current streak: ${p.currentStreak} consecutive days

--- Last 7 Days Summary ---
Streak maintained:  ${w.streakDays}/7 days
Mood average:       ${w.avgMood !== null ? `${w.avgMood.toFixed(1)}/5` : 'not tracked'}
Meditation:         ${w.meditationDays}/7 days
Pranayama:          ${w.pranayamaDays}/7 days
Prayer:             ${w.prayerDays}/7 days
Exercise:           ${w.exerciseDays}/7 days
Urge logs:          ${w.urgeCount} total, ${w.urgesResisted} resisted (${winRate})
Water intake avg:   ${w.waterAvg.toFixed(1)} glasses/day
Sleep avg:          ${w.sleepAvg !== null ? `${w.sleepAvg.toFixed(1)} hours` : 'not tracked'}
${w.latestChallenge ? `Biggest challenge this week: "${w.latestChallenge}"` : ''}
${w.latestWin       ? `Biggest win this week: "${w.latestWin}"` : ''}

Please generate a complete weekly guidance report. Be specific to their numbers.
Address them as "Sadhak". Begin with a shloka relevant to their current phase.
Structure: Shloka → Analysis → What's working → What needs attention →
3 actionable recommendations for next week → Closing blessing.
`.trim()

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: userContent },
  ]
}

export function buildAskMessages(p: ProfileCtx, w: WeekCtx, question: string): Msg[] {
  const context = `[Sadhak context: ${p.name ?? 'Sadhak'} | Deity: ${p.deity ?? 'not specified'} | ` +
    `Streak: ${p.currentStreak} days | Day ${p.currentDay} | ` +
    `Mood avg: ${w.avgMood?.toFixed(1) ?? 'unknown'}/5 | ` +
    `Urges this week: ${w.urgeCount} (${w.urgesResisted} resisted) | ` +
    `Meditation this week: ${w.meditationDays}/7 days]`

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${context}\n\nSadhak asks: "${question}"\n\nAnswer with depth and warmth. Include a relevant shloka. Be specific to their data.`,
    },
  ]
}

export function buildEmergencyMessages(
  p:          ProfileCtx,
  recentMood: number | null,
  lastUrge:   { intensity: number; minutesAgo: number } | null,
  sankalp:    string | null,
): Msg[] {
  const hour   = new Date().getHours()
  const timeOf = hour < 6 ? 'early morning' : hour < 12 ? 'morning'
               : hour < 17 ? 'afternoon'    : hour < 21 ? 'evening' : 'night'

  const content = `
EMERGENCY SUPPORT REQUEST — Sadhak is struggling right now.

Sadhak:        ${p.name ?? 'a sincere seeker'}
Deity:         ${p.deity ?? 'not specified'}
Journey:       Day ${p.currentDay} of ${p.targetDays}-day sankalp
Streak:        ${p.currentStreak} consecutive days at stake
Time:          ${timeOf} (${hour}:00)
Recent mood:   ${recentMood !== null ? `${recentMood}/5` : 'unknown'}
${lastUrge
  ? `Last urge: ${lastUrge.minutesAgo < 60
      ? `${lastUrge.minutesAgo} minutes ago`
      : `${Math.round(lastUrge.minutesAgo / 60)} hours ago`}, intensity ${lastUrge.intensity}/10`
  : 'No urge logged yet (risk moment)'}
${sankalp ? `Their sankalp (commitment): "${sankalp}"` : ''}

They need immediate, practical help. Structure your response:
1. One powerful calming shloka (with meaning)
2. A specific breathing exercise (name it, describe the count — e.g., "4-7-8 breathing: inhale 4, hold 7, exhale 8")
3. ONE physical action to do RIGHT NOW (e.g., "Splash cold water on your face")
4. Remind them what ${p.currentStreak} days represents and what is at stake
${sankalp ? '5. Reflect their own sankalp words back to them' : ''}

Tone: like Krishna to Arjuna mid-battle — compassionate but fierce with truth.
Keep it under 400 words. Lead with the shloka.
`.trim()

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: content },
  ]
}
