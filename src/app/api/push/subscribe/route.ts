import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { endpoint, keys } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('push_subscriptions').upsert({
    user_id:  user.id,
    endpoint,
    p256dh:   keys.p256dh,
    auth:     keys.auth,
  }, { onConflict: 'user_id,endpoint' })

  return Response.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('push_subscriptions')
    .delete().eq('user_id', user.id).eq('endpoint', endpoint)

  return Response.json({ ok: true })
}
