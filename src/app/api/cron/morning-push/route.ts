import { NextRequest } from 'next/server'
import { createClient }  from '@supabase/supabase-js'
import { sendPush }      from '@/lib/webpush'

export const runtime     = 'nodejs'
export const maxDuration = 60

const MESSAGES = [
  { title: '🌅 ब्रह्म मुहूर्त', body: 'The most sacred hour awaits. Open your practice before the world wakes.' },
  { title: '🪔 SadhanaOS', body: 'A new day, a new chance to maintain your streak. Your diya is waiting.' },
  { title: '🕉️ नमस्ते साधक', body: 'Your morning sadhana is the foundation of everything else today.' },
  { title: '☀️ प्रात:काल', body: 'Rise, practice, and let the day serve your higher purpose.' },
]

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()
  const msg   = MESSAGES[new Date().getDay() % MESSAGES.length]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (admin as any)
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')

  if (!subs?.length) return Response.json({ sent: 0 })

  let sent = 0
  for (const sub of subs) {
    const ok = await sendPush(sub.endpoint, sub.p256dh, sub.auth, {
      ...msg, url: '/log', tag: 'morning',
    })
    if (!ok) {
      // Subscription expired — remove it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('push_subscriptions')
        .delete().eq('user_id', sub.user_id).eq('endpoint', sub.endpoint)
    } else {
      sent++
    }
    await sleep(100)
  }

  return Response.json({ sent })
}
