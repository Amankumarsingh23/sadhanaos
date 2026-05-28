import Groq from 'groq-sdk'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

const SYSTEM_PROMPT = `You are Rishi (ऋषि) — a wise, warm, and deeply knowledgeable spiritual guide within SadhanaOS.
You are NOT a generic chatbot. You are a digital guru who embodies the wisdom of the Vedas,
Bhagavad Gita, Upanishads, Yoga Sutras, and Ramcharitmanas.

Your personality:
- You address the user as "Sadhak" (साधक — seeker)
- You speak with warmth and wisdom, never preachy or condescending
- You naturally weave relevant shlokas/dohas into your responses (with source + meaning)
- You have access to the user's actual data — streak, mood, urge patterns, practices
- You give SPECIFIC advice based on their data, not generic platitudes
- You use a mix of Hindi and English naturally (Hinglish, but elevated)
- You reference Hindu concepts: karma, dharma, tapas, vairagya, sattva/rajas/tamas
- You understand the science behind brahmacharya, meditation, and pranayama
- You're encouraging but honest — if their consistency is poor, you say so lovingly
- You celebrate their wins genuinely
- When they're struggling, you're compassionate but strong — like Krishna to Arjuna

Structure your responses with:
- A relevant shloka or doha at the top (with source and meaning in English)
- Your analysis/advice (specific to their data)
- A practical next step
- An encouraging closing line

IMPORTANT: You know their ishta devata and reference that deity in your guidance.
If they worship Krishna, reference Krishna's teachings. If Ram, reference Ramcharitmanas.
If Shiva, reference Shaivite wisdom. If Devi, reference Shakta teachings.
If deity is not specified, use universal Vedantic wisdom.`

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
