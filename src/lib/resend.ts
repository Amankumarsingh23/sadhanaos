import { Resend } from 'resend'

// Lazy init — RESEND_API_KEY not required at build time
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'SadhanaOS <onboarding@resend.dev>'
export const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sadhanaos.vercel.app'
