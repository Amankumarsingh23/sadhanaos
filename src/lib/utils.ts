export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ── Hindu Panchang (approximate) ───────────────────────────────────── */
interface HinduDate {
  tithi: string      // e.g. "तृतीया"
  paksha: string     // "शुक्ल" or "कृष्ण"
  month: string      // e.g. "ज्येष्ठ"
  dayName: string    // e.g. "सोम"
  formatted: string  // full formatted string
}

const TITHI_NAMES = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
]

const HINDU_MONTHS = [
  'माघ', 'फाल्गुन', 'चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़',
  'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष',
]

const DAY_NAMES = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']

export function getHinduDate(date: Date = new Date()): HinduDate {
  // Julian Date from Gregorian
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5

  // Synodic month; ref new moon: 11 Jan 2024 = JD 2460320.5
  const SYNODIC = 29.530589
  const REF_NEW_MOON = 2460320.5
  const daysSince = ((JD - REF_NEW_MOON) % SYNODIC + SYNODIC) % SYNODIC
  const tithiIdx = Math.floor(daysSince / (SYNODIC / 30))

  let paksha: string
  let tithi: string
  if (tithiIdx < 15) {
    paksha = 'शुक्ल'
    tithi = TITHI_NAMES[tithiIdx]
  } else if (tithiIdx === 29) {
    paksha = 'कृष्ण'
    tithi = 'अमावस्या'
  } else {
    paksha = 'कृष्ण'
    tithi = TITHI_NAMES[Math.min(tithiIdx - 15, 13)]
  }

  const month = HINDU_MONTHS[date.getMonth()]
  const dayName = DAY_NAMES[date.getDay()]
  const formatted = `${dayName}, ${month} ${paksha} ${tithi}`

  return { tithi, paksha, month, dayName, formatted }
}
