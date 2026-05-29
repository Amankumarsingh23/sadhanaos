import webpush from 'web-push'

let _configured = false

export function getWebPush() {
  if (!_configured) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL ?? 'admin@sadhanaos.app'}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
    _configured = true
  }
  return webpush
}

export interface PushPayload {
  title: string
  body:  string
  url?:  string
  tag?:  string
}

export async function sendPush(
  endpoint: string,
  p256dh:   string,
  auth:     string,
  payload:  PushPayload,
): Promise<boolean> {
  try {
    await getWebPush().sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    )
    return true
  } catch (err: unknown) {
    // 410 Gone = subscription expired, caller should delete it
    if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
      return false
    }
    console.error('[push]', err)
    return false
  }
}
