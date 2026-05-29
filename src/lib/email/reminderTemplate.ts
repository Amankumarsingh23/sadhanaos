import { SITE_URL } from '@/lib/resend'

interface ReminderData {
  userName:      string
  currentStreak: number
  currentDay:    number
  targetDays:    number
  deity:         string | null
}

const DEITY_GOLD: Record<string, string> = {
  krishna: '#D4AF37', ram: '#D4AF37', shiva: '#B8A880',
  hanuman: '#D4AF37', durga: '#D4AF37', ganesh: '#D4AF37',
  saraswati: '#D4AF37', vishnu: '#D4AF37', default: '#D4AF37',
}

const REMINDER_LINES = [
  'Your diya is still waiting to be lit.',
  'The practice does not happen by itself — only you can do it.',
  'One more logged day is one more brick in the wall of discipline.',
  'Your future self is watching what you do in the next hour.',
  'Even 5 minutes of sadhana today is a victory over the easier path.',
  'The sadhak who logs consistently becomes the master.',
]

export function buildReminderEmail(data: ReminderData): { subject: string; html: string } {
  const gold = DEITY_GOLD[data.deity?.toLowerCase() ?? ''] ?? DEITY_GOLD.default
  const line  = REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)]
  const name  = data.userName ?? 'Sadhak'
  const streakAtRisk = data.currentStreak > 0
    ? `Your ${data.currentStreak}-day streak is at stake.`
    : `Day ${data.currentDay} of ${data.targetDays} — don&apos;t break the chain.`

  const subject = `🪔 साधक, your diya is waiting — log today`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;">
<tr><td align="center" style="padding:32px 16px;">

  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

    <!-- Header -->
    <tr>
      <td style="background:#1A0F3A;padding:32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🪔</div>
        <div style="font-size:11px;color:${gold};letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Sadhana Reminder</div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="background:#FDFAF3;padding:32px 36px;">
        <p style="margin:0 0 16px;font-size:20px;color:#1A0F3A;font-weight:bold;">नमस्ते, ${name}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#3D2C2C;line-height:1.7;">
          It&apos;s evening and your sadhana hasn&apos;t been logged yet.<br>
          <strong style="color:#1A0F3A;">${streakAtRisk}</strong>
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#8B7355;font-style:italic;border-left:3px solid ${gold};padding-left:12px;">
          &ldquo;${line}&rdquo;
        </p>
        <div style="text-align:center;">
          <a href="${SITE_URL}/log" style="display:inline-block;background:#E8913A;color:#FFF9F0;padding:14px 40px;border-radius:8px;font-size:14px;text-decoration:none;font-weight:bold;">
            Log Today&apos;s Practice →
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#1A0F3A;padding:18px 36px;text-align:center;">
        <div style="font-size:10px;color:${gold};opacity:0.5;letter-spacing:2px;">SADHANAOS · YOUR DIGITAL ASHRAM</div>
        <div style="margin-top:6px;font-size:10px;">
          <a href="${SITE_URL}/settings" style="color:${gold};opacity:0.4;text-decoration:underline;">Unsubscribe</a>
        </div>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`

  return { subject, html }
}
