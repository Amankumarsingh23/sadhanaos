import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement }  from 'react'
import { createClient }   from '@supabase/supabase-js'
import { getResend, FROM_EMAIL, SITE_URL } from '@/lib/resend'
import { buildWeeklyEmail } from '@/lib/email/weeklyTemplate'
import { SacredReportDocument } from '@/lib/pdf/serverDocument'
import type { ProfileCtx, WeekCtx } from '@/lib/groq'

export const runtime  = 'nodejs'
export const maxDuration = 300  // 5 min — processing many users

// ── Admin Supabase client (service role — never expose to client) ─────────────
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)) + 1
}

function weekRange(): string {
  const end   = new Date()
  const start = new Date(end.getTime() - 6 * 86400000)
  const fmt   = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

function calcScore(week: WeekCtx): { score: number; grade: string } {
  const s = Math.round(Math.min(100,
    (week.streakDays / 7) * 25 +
    (week.meditationDays / 7) * 15 +
    ((week.pranayamaDays + week.prayerDays + week.exerciseDays) / 3 / 7) * 25 +
    (week.urgeCount > 0 ? (week.urgesResisted / week.urgeCount) * 15 : 15) +
    10 + 5
  ))
  const grade = s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F'
  return { score: s, grade }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Protect: only Vercel Cron or requests with CRON_SECRET can call this
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()
  const resend = getResend()
  const range  = weekRange()

  // Get all auth users
  const { data: { users }, error: userErr } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (userErr) return Response.json({ error: userErr.message }, { status: 500 })

  const ago7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  let sent = 0, skipped = 0, failed = 0

  for (const authUser of users) {
    try {
      const userEmail = authUser.email
      if (!userEmail) { skipped++; continue }

      // Fetch profile + week data in parallel
      const [
        { data: profile },
        { data: logs },
        { data: urges },
        { data: streakRow },
        { data: latestReport },
      ] = await Promise.all([
        admin.from('profiles').select('*').eq('id', authUser.id).single(),
        admin.from('daily_logs').select('*').eq('user_id', authUser.id).gte('log_date', ago7),
        admin.from('urge_logs').select('*').eq('user_id', authUser.id).gte('logged_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        admin.from('v_current_streak').select('current_streak').eq('user_id', authUser.id).maybeSingle(),
        admin.from('ai_reports').select('content').eq('user_id', authUser.id).eq('report_type', 'weekly').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      if (!profile) { skipped++; continue }

      const logList  = logs  ?? []
      const urgList  = urges ?? []
      const moodVals = logList.map(l => l.mood_score).filter((v): v is number => v !== null)
      const waterVals = logList.map(l => l.water_glasses).filter(v => v > 0)

      const currentStreak = streakRow?.current_streak ?? 0
      const currentDay    = daysSince(profile.sadhana_start_date)
      const weekNumber    = Math.ceil(Math.max(1, currentDay) / 7)

      const profileCtx: ProfileCtx = {
        name:          profile.full_name,
        deity:         profile.ist_deity,
        sadhanaStart:  profile.sadhana_start_date,
        targetDays:    profile.target_days ?? 90,
        currentDay,
        currentStreak,
      }

      const weekCtx: WeekCtx = {
        streakDays:     logList.filter(l => l.streak_maintained).length,
        avgMood:        moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : null,
        meditationDays: logList.filter(l => l.meditation_minutes > 0).length,
        pranayamaDays:  logList.filter(l => l.pranayama_done).length,
        prayerDays:     logList.filter(l => {
          const pc = l.prayers_completed
          return pc && typeof pc === 'object' && !Array.isArray(pc) && Object.values(pc as Record<string, unknown>).some(v => v === true)
        }).length,
        urgeCount:      urgList.length,
        urgesResisted:  urgList.filter(u => u.held_strong).length,
        exerciseDays:   logList.filter(l => l.exercise_done).length,
        waterAvg:       waterVals.length ? waterVals.reduce((a, b) => a + b, 0) / waterVals.length : 0,
        sleepAvg:       null,
        latestChallenge: null,
        latestWin:      null,
      }

      const { score, grade } = calcScore(weekCtx)
      const reportText       = latestReport?.content ?? ''
      const openingShloka    = reportText ? reportText.split(/\n{2,}/)[0]?.trim() : null

      // Build HTML email
      const { subject, html } = buildWeeklyEmail({
        userName:      profile.full_name ?? 'Sadhak',
        userEmail,
        deity:         profile.ist_deity,
        currentStreak,
        currentDay,
        targetDays:    profile.target_days ?? 90,
        score,
        grade,
        weekNumber,
        dateRange:     range,
        rishiReport:   reportText || null,
        openingShloka,
      })

      // Generate PDF attachment
      let attachments: { filename: string; content: string }[] = []
      if (reportText) {
        try {
          // renderToBuffer expects a Document element — cast through unknown to satisfy types
          const docElement = createElement(SacredReportDocument, { profile: profileCtx, week: weekCtx, reportText, weekNumber, dateRange: range })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfBuffer = await renderToBuffer(docElement as any)
          attachments = [{
            filename: `sadhana-week-${weekNumber}-${(profile.full_name ?? 'report').replace(/\s+/g, '-')}.pdf`,
            content:  pdfBuffer.toString('base64'),
          }]
        } catch (pdfErr) {
          console.error(`[weekly-report] PDF generation failed for ${userEmail}:`, pdfErr)
          // Continue without attachment — email still sends
        }
      }

      // Send email
      const { error: sendErr } = await resend.emails.send({
        from:        FROM_EMAIL,
        to:          userEmail,
        subject,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      if (sendErr) {
        console.error(`[weekly-report] Send failed for ${userEmail}:`, sendErr)
        failed++
      } else {
        sent++
      }

      // Rate limit: 1 email per 800ms to stay within Resend limits
      await sleep(800)

    } catch (err) {
      console.error('[weekly-report] Error processing user:', err)
      failed++
    }
  }

  console.log(`[weekly-report] Done: sent=${sent} skipped=${skipped} failed=${failed}`)
  return Response.json({ sent, skipped, failed, siteUrl: SITE_URL })
}
