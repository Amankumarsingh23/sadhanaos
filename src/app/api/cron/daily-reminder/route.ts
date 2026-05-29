import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { buildReminderEmail }   from '@/lib/email/reminderTemplate'

export const runtime     = 'nodejs'
export const maxDuration = 120

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)) + 1
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin  = adminClient()
  const resend = getResend()
  const today  = new Date().toISOString().slice(0, 10)

  const { data: { users }, error: userErr } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (userErr) return Response.json({ error: userErr.message }, { status: 500 })

  let sent = 0, skipped = 0

  for (const authUser of users) {
    try {
      const userEmail = authUser.email
      if (!userEmail) { skipped++; continue }

      // Check if they've already logged today
      const { data: todayLog } = await admin
        .from('daily_logs')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('log_date', today)
        .maybeSingle()

      if (todayLog) { skipped++; continue }  // Already logged — skip

      // Get profile for streak context
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, ist_deity, target_days, sadhana_start_date')
        .eq('id', authUser.id)
        .single()

      if (!profile) { skipped++; continue }

      const { data: streakRow } = await admin
        .from('v_current_streak')
        .select('current_streak')
        .eq('user_id', authUser.id)
        .maybeSingle()

      const { subject, html } = buildReminderEmail({
        userName:      profile.full_name ?? 'Sadhak',
        currentStreak: streakRow?.current_streak ?? 0,
        currentDay:    daysSince(profile.sadhana_start_date),
        targetDays:    profile.target_days ?? 90,
        deity:         profile.ist_deity,
      })

      const { error: sendErr } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      userEmail,
        subject,
        html,
      })

      if (!sendErr) sent++
      else skipped++

      await sleep(400)
    } catch {
      skipped++
    }
  }

  console.log(`[daily-reminder] sent=${sent} skipped=${skipped}`)
  return Response.json({ sent, skipped })
}
