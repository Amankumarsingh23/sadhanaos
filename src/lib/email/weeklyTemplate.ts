import { SITE_URL } from '@/lib/resend'

interface DeityStyle {
  dark:    string
  primary: string
  gold:    string
  mantra:  string
  deityHi: string
}

const DEITY_STYLES: Record<string, DeityStyle> = {
  krishna:    { dark: '#0D1440', primary: '#1B2A6B', gold: '#D4AF37', mantra: 'ॐ नमो भगवते वासुदेवाय', deityHi: 'श्री कृष्ण' },
  ram:        { dark: '#3A0A0A', primary: '#7B1A1A', gold: '#D4AF37', mantra: 'ॐ श्री रामाय नमः',        deityHi: 'श्री राम' },
  shiva:      { dark: '#080818', primary: '#1A1A40', gold: '#B8A880', mantra: 'ॐ नमः शिवाय',            deityHi: 'श्री शिव' },
  hanuman:    { dark: '#3A1200', primary: '#B5451B', gold: '#D4AF37', mantra: 'ॐ हनुमते नमः',           deityHi: 'श्री हनुमान' },
  durga:      { dark: '#3A0000', primary: '#8B0000', gold: '#D4AF37', mantra: 'ॐ दुं दुर्गायै नमः',     deityHi: 'श्री दुर्गा' },
  ganesh:     { dark: '#2A0A00', primary: '#8B3500', gold: '#D4AF37', mantra: 'ॐ गं गणपतये नमः',       deityHi: 'श्री गणेश' },
  saraswati:  { dark: '#0A1A40', primary: '#1A3A7B', gold: '#D4AF37', mantra: 'ॐ ऐं सरस्वत्यै नमः',   deityHi: 'श्री सरस्वती' },
  vishnu:     { dark: '#0A0020', primary: '#2A0A5A', gold: '#D4AF37', mantra: 'ॐ नमो नारायणाय',        deityHi: 'श्री विष्णु' },
  default:    { dark: '#1A0F3A', primary: '#3D2C8D', gold: '#D4AF37', mantra: 'ॐ तत् सत्',             deityHi: 'परमात्मन्' },
}

function gradeColor(grade: string): string {
  return { A: '#6B9E78', B: '#E8913A', C: '#C4A842', D: '#D4708C', F: '#C45C5C' }[grade] ?? '#888'
}

interface WeeklyEmailData {
  userName:       string
  userEmail:      string
  deity:          string | null
  currentStreak:  number
  currentDay:     number
  targetDays:     number
  score:          number
  grade:          string
  weekNumber:     number
  dateRange:      string
  rishiReport:    string | null   // first ~500 chars of the Groq report
  openingShloka:  string | null   // extracted shloka from the report
}

export function buildWeeklyEmail(data: WeeklyEmailData): { subject: string; html: string } {
  const style = DEITY_STYLES[data.deity?.toLowerCase() ?? ''] ?? DEITY_STYLES.default
  const gradeClr = gradeColor(data.grade)
  const name  = data.userName ?? 'Sadhak'
  const preview = data.rishiReport
    ? data.rishiReport.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').slice(0, 480) + '…'
    : `You have completed ${data.currentDay} days of your ${data.targetDays}-day sankalp. Your holistic score this week is ${data.score}/100 (Grade ${data.grade}).`

  const subject = `🕉️ साधना Week ${data.weekNumber} — Your Sacred Report is Here`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SadhanaOS Weekly Report</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;">
<tr><td align="center" style="padding:24px 16px 0;">

  <!-- Main card -->
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">

    <!-- ═══ HEADER BAND ═══ -->
    <tr>
      <td style="background:${style.dark};padding:40px 32px 32px;text-align:center;">
        <!-- OM symbol -->
        <div style="font-size:64px;line-height:1;margin-bottom:12px;color:${style.gold};">ॐ</div>
        <!-- Deity name -->
        <div style="font-size:18px;color:${style.gold};letter-spacing:3px;margin-bottom:8px;">${style.deityHi}</div>
        <!-- Thin gold line -->
        <div style="width:200px;height:1px;background:${style.gold};margin:12px auto;opacity:0.5;"></div>
        <!-- Report title -->
        <div style="font-size:11px;color:${style.gold};letter-spacing:5px;text-transform:uppercase;opacity:0.85;">Sadhana Weekly Report</div>
        <div style="font-size:13px;color:${style.gold};margin-top:6px;opacity:0.65;">${data.dateRange} · Week ${data.weekNumber}</div>
      </td>
    </tr>

    <!-- ═══ GREETING ═══ -->
    <tr>
      <td style="background:#FDFAF3;padding:32px 36px 24px;border-bottom:1px solid #E8D5BE;">
        <p style="margin:0 0 4px;font-size:22px;color:#1A0F3A;font-weight:bold;">नमस्ते, ${name}</p>
        <p style="margin:0;font-size:13px;color:#8B7355;font-style:italic;">
          Day ${data.currentDay} of your ${data.targetDays}-day sankalp · ${data.currentStreak} day streak
        </p>
      </td>
    </tr>

    <!-- ═══ SCORE BADGES ═══ -->
    <tr>
      <td style="background:#FDFAF3;padding:20px 36px 24px;border-bottom:1px solid #E8D5BE;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- Holistic Grade -->
            <td width="48%" style="text-align:center;padding:16px;border:2px solid ${gradeClr}30;border-radius:10px;background:${gradeClr}10;">
              <div style="font-size:42px;font-weight:bold;color:${gradeClr};line-height:1;">${data.grade}</div>
              <div style="font-size:9px;color:#8B7355;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Holistic Grade</div>
              <div style="font-size:13px;color:${gradeClr};margin-top:2px;">${data.score}/100</div>
            </td>
            <td width="4%"></td>
            <!-- Streak -->
            <td width="48%" style="text-align:center;padding:16px;border:2px solid ${style.gold}30;border-radius:10px;background:${style.gold}08;">
              <div style="font-size:42px;font-weight:bold;color:${style.gold};line-height:1;">🔥</div>
              <div style="font-size:9px;color:#8B7355;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Current Streak</div>
              <div style="font-size:20px;color:${style.gold};margin-top:2px;font-weight:bold;">${data.currentStreak} days</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${data.openingShloka ? `
    <!-- ═══ SHLOKA ═══ -->
    <tr>
      <td style="background:#FDFAF3;padding:24px 36px;border-bottom:1px solid #E8D5BE;">
        <div style="border-left:3px solid ${style.gold};padding:14px 16px;background:${style.gold}08;border-radius:0 8px 8px 0;">
          <div style="font-size:9px;color:#8B7355;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Sacred Verse</div>
          <div style="font-size:14px;color:#1A0F3A;line-height:1.8;font-style:italic;">${data.openingShloka.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').slice(0, 300)}</div>
        </div>
      </td>
    </tr>
    ` : ''}

    <!-- ═══ RISHI'S MESSAGE ═══ -->
    <tr>
      <td style="background:#FDFAF3;padding:24px 36px;border-bottom:1px solid #E8D5BE;">
        <div style="font-size:9px;color:#8B7355;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Rishi Says</div>
        <p style="margin:0;font-size:14px;color:#3D2C2C;line-height:1.85;">${preview}</p>
      </td>
    </tr>

    <!-- ═══ PDF NOTE ═══ -->
    <tr>
      <td style="background:#F5F0E8;padding:18px 36px;border-bottom:1px solid #E8D5BE;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#8B7355;">
              📎 <strong style="color:#3D2C8D;">Your Sacred Report PDF is attached</strong>
              <span style="display:block;font-size:11px;margin-top:3px;color:#8B7355;">5-page royal report with wax seal · Download and keep it.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ═══ CTA BUTTON ═══ -->
    <tr>
      <td style="background:#FDFAF3;padding:28px 36px;text-align:center;border-bottom:1px solid #E8D5BE;">
        <a href="${SITE_URL}/rishi" style="display:inline-block;background:${style.dark};color:${style.gold};padding:14px 36px;border-radius:8px;font-size:13px;letter-spacing:2px;text-decoration:none;border:1px solid ${style.gold}40;text-transform:uppercase;">
          Open Rishi Margdarshan →
        </a>
        <div style="margin-top:12px;">
          <a href="${SITE_URL}/log" style="font-size:12px;color:#E8913A;text-decoration:none;">Log today's sadhana →</a>
        </div>
      </td>
    </tr>

    <!-- ═══ MANTRA FOOTER ═══ -->
    <tr>
      <td style="background:${style.dark};padding:24px 36px;text-align:center;">
        <div style="font-size:14px;color:${style.gold};margin-bottom:8px;opacity:0.8;">${style.mantra}</div>
        <div style="width:100px;height:1px;background:${style.gold};margin:10px auto;opacity:0.3;"></div>
        <div style="font-size:10px;color:${style.gold};opacity:0.5;letter-spacing:2px;">SADHANAOS · YOUR DIGITAL ASHRAM</div>
        <div style="font-size:10px;color:${style.gold};opacity:0.3;margin-top:8px;">
          <a href="${SITE_URL}/settings" style="color:${style.gold};opacity:0.5;text-decoration:underline;">Unsubscribe</a>
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
