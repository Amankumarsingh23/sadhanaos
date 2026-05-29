// Server-side PDF document — no 'use client', fonts use absolute URLs
// Used by: src/app/api/cron/weekly-report/route.ts (renderToBuffer)
// The browser version (WeeklyReportPDF.tsx) registers fonts separately with relative URLs.

import {
  Document, Page, Text, View, Font,
  Svg, Rect, Circle, Ellipse, Polygon, Line,
} from '@react-pdf/renderer'
import type { WeekCtx, ProfileCtx } from '@/lib/groq'
import { getTheme }   from '@/components/pdf/themes'

// ─── Server font registration (absolute URLs, fetched by Node.js) ─────────────

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sadhanaos.vercel.app'

Font.register({ family: 'Cinzel', src: `${BASE}/fonts/cinzel-400.woff` })
Font.register({
  family: 'Cormorant',
  fonts: [
    { src: `${BASE}/fonts/cormorant-400.woff` },
    { src: `${BASE}/fonts/cormorant-400i.woff`, fontStyle: 'italic' },
    { src: `${BASE}/fonts/cormorant-600.woff`,  fontWeight: 600 },
    { src: `${BASE}/fonts/cormorant-700.woff`,  fontWeight: 700 },
  ],
})
Font.register({
  family: 'Devanagari',
  fonts: [
    { src: `${BASE}/fonts/devanagari-400.woff` },
    { src: `${BASE}/fonts/devanagari-600.woff`, fontWeight: 600 },
  ],
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function gradeColor(g: string): string {
  return { A: '#6B9E78', B: '#E8913A', C: '#C4A842', D: '#D4708C', F: '#C45C5C' }[g] ?? '#888'
}

function stripMd(t: string): string {
  return t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#{1,6}\s*/gm, '').trim()
}

function extractShloka(text: string): { block: string; rest: string } {
  const parts = text.split(/\n{2,}/)
  if (parts.length < 2) return { block: text.slice(0, 300), rest: text }
  return { block: parts[0].trim(), rest: parts.slice(1).join('\n\n').trim() }
}

function makeWaxPoints(cx: number, cy: number, n = 24): string {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * Math.PI * 2) / n - Math.PI / 2
    const r = i % 2 === 0 ? 44 : 37
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function GoldDivider({ gold, width = 460 }: { gold: string; width?: number }) {
  const mid = width / 2
  return (
    <View style={{ marginVertical: 10 }}>
      <Svg width={width} height={14}>
        <Line x1={0}       y1={7} x2={mid - 12} y2={7} stroke={gold} strokeWidth={0.7} />
        <Polygon points={`${mid},1 ${mid + 8},7 ${mid},13 ${mid - 8},7`} fill={gold} />
        <Line x1={mid + 12} y1={7} x2={width}  y2={7} stroke={gold} strokeWidth={0.7} />
      </Svg>
    </View>
  )
}

function WaxSeal({ gold, goldDark, size = 80 }: { gold: string; goldDark: string; size?: number }) {
  const c = size / 2
  const grains = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI * 2) / 6
    return { x1: c + (c * 0.3) * Math.cos(a), y1: c + (c * 0.3) * Math.sin(a), x2: c + (c * 0.7) * Math.cos(a), y2: c + (c * 0.7) * Math.sin(a) }
  })
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Polygon points={makeWaxPoints(c, c, 24)} fill={goldDark} />
        <Circle cx={c} cy={c} r={c * 0.80} fill={gold} />
        <Circle cx={c} cy={c} r={c * 0.75} fill="#FFFACD" fillOpacity={0.18} />
        <Circle cx={c} cy={c} r={c * 0.72} fill="none" stroke={goldDark} strokeWidth={1.2} />
        {grains.map((l, i) => (
          <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={goldDark} strokeWidth={1.2} strokeOpacity={0.1} />
        ))}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Devanagari', fontSize: size * 0.36, color: goldDark, lineHeight: 1 }}>ॐ</Text>
      </View>
    </View>
  )
}

function PageBorder({ gold, children }: { gold: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, position: 'relative', margin: 28 }}>
      <View style={{ flex: 1, border: `2 solid ${gold}`, padding: 4 }}>
        <View style={{ flex: 1, border: `0.5 solid ${gold}`, padding: 20 }}>
          {children}
        </View>
      </View>
      {[{ top: -5, left: -5 }, { top: -5, right: -5 }, { bottom: -5, left: -5 }, { bottom: -5, right: -5 }].map((pos, i) => (
        <View key={i} style={{ position: 'absolute', ...pos }}>
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Polygon points="5,0 10,5 5,10 0,5" fill={gold} />
          </Svg>
        </View>
      ))}
    </View>
  )
}

function PracticeBar({ label, value, gold }: { label: string; value: number; gold: string }) {
  const pct = Math.min(1, value / 7)
  const W   = 280
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
      <Text style={{ fontFamily: 'Cinzel', fontSize: 7.5, color: '#555', width: 90, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      <View style={{ flex: 1, marginHorizontal: 8 }}>
        <Svg width={W} height={10}>
          <Rect x={0} y={2} width={W}       height={6} rx={3} fill="#E8DCC8" />
          <Rect x={0} y={2} width={W * pct} height={6} rx={3} fill={gold} />
        </Svg>
      </View>
      <Text style={{ fontFamily: 'Cormorant', fontSize: 9, color: gold, width: 30, textAlign: 'right' }}>{value}/7</Text>
    </View>
  )
}

function LotusMandala({ color, size = 160 }: { color: string; size?: number }) {
  const c = size / 2, R = size * 0.44, MR = size * 0.32, IR = size * 0.18, N = 8
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={R}  fill="none" stroke={color} strokeWidth={0.6} strokeOpacity={0.35} strokeDasharray="2,4" />
      <Circle cx={c} cy={c} r={MR} fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.45} />
      <Circle cx={c} cy={c} r={IR} fill={color} fillOpacity={0.08} stroke={color} strokeWidth={0.5} strokeOpacity={0.5} />
      {Array.from({ length: N }, (_, i) => {
        const angle = (i * Math.PI * 2) / N, dist = (MR + IR) / 2
        const px = c + dist * Math.cos(angle), py = c + dist * Math.sin(angle), deg = (i * 360) / N + 90
        return <Ellipse key={i} cx={px} cy={py} rx={size * 0.075} ry={size * 0.135} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={0.5} strokeOpacity={0.5} transform={`rotate(${deg} ${px} ${py})`} />
      })}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 16, inner = i % 2 === 0 ? MR * 1.02 : MR * 0.9
        return <Line key={i} x1={c + inner * Math.cos(angle)} y1={c + inner * Math.sin(angle)} x2={c + R * 0.97 * Math.cos(angle)} y2={c + R * 0.97 * Math.sin(angle)} stroke={color} strokeWidth={i % 2 === 0 ? 0.7 : 0.4} strokeOpacity={0.35} />
      })}
      <Circle cx={c} cy={c} r={4} fill={color} fillOpacity={0.6} />
      <Circle cx={c} cy={c} r={2} fill={color} fillOpacity={0.9} />
    </Svg>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReportDocumentProps {
  profile:    ProfileCtx
  week:       WeekCtx
  reportText: string
  weekNumber: number
  dateRange:  string
}

// ─── Pages (identical to WeeklyReportPDF but no 'use client') ────────────────

function CoverPage({ profile, week, weekNumber, dateRange }: Omit<ReportDocumentProps, 'reportText'>) {
  const theme = getTheme(profile.deity)
  const { score, grade } = calcScore(week)
  const gradeClr = gradeColor(grade)
  return (
    <Page size="A4" style={{ backgroundColor: theme.bg, fontFamily: 'Cormorant' }}>
      <View style={{ backgroundColor: theme.dark, height: 295, paddingHorizontal: 50, paddingTop: 36, alignItems: 'center' }}>
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Svg width={495} height={6}>
            <Line x1={0} y1={3} x2={196} y2={3} stroke={theme.gold} strokeWidth={0.6} />
            <Polygon points="247,0 252,3 247,6 242,3" fill={theme.gold} />
            <Line x1={298} y1={3} x2={495} y2={3} stroke={theme.gold} strokeWidth={0.6} />
          </Svg>
        </View>
        <View style={{ width: 128, height: 128, position: 'relative', alignSelf: 'center', marginBottom: 10 }}>
          <Svg width={128} height={128} viewBox="0 0 128 128">
            <Circle cx={64} cy={64} r={62} fill="none" stroke={theme.gold} strokeWidth={0.9} strokeDasharray="3,5" strokeOpacity={0.7} />
            <Circle cx={64} cy={64} r={55} fill={theme.goldDark} fillOpacity={0.22} />
            <Circle cx={64} cy={64} r={53} fill={theme.primary} fillOpacity={0.35} />
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 128, height: 128, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Devanagari', fontSize: 76, color: theme.gold, lineHeight: 1 }}>ॐ</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'Devanagari', fontSize: 22, color: theme.goldLight, letterSpacing: 3, textAlign: 'center', marginBottom: 2 }}>{theme.deityHi}</Text>
        <Text style={{ fontFamily: 'Devanagari', fontSize: 10, color: theme.gold, opacity: 0.7, marginTop: 6 }}>{theme.mantra}</Text>
        <View style={{ width: '100%', marginTop: 16 }}>
          <Svg width={495} height={6}>
            <Line x1={0} y1={3} x2={196} y2={3} stroke={theme.gold} strokeWidth={0.6} />
            <Polygon points="247,0 252,3 247,6 242,3" fill={theme.gold} />
            <Line x1={298} y1={3} x2={495} y2={3} stroke={theme.gold} strokeWidth={0.6} />
          </Svg>
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: -52, marginBottom: 18 }}>
        <WaxSeal gold={theme.gold} goldDark={theme.goldDark} size={104} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 56, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 13, color: theme.goldDark, letterSpacing: 4, textAlign: 'center', marginBottom: 6 }}>SADHANA  WEEKLY  REPORT</Text>
        <Svg width={300} height={4} style={{ marginBottom: 12 }}>
          <Line x1={0} y1={2} x2={300} y2={2} stroke={theme.gold} strokeWidth={0.8} />
        </Svg>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#888', letterSpacing: 2.5, marginBottom: 18, textAlign: 'center' }}>WEEK {weekNumber}  ·  {dateRange.toUpperCase()}</Text>
        <Text style={{ fontFamily: 'Cormorant', fontSize: 28, color: theme.dark, textAlign: 'center', fontWeight: 600 }}>{profile.name ?? 'Sadhak'}</Text>
        <Text style={{ fontFamily: 'Cormorant', fontSize: 12, color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 4 }}>Day {profile.currentDay} of {profile.targetDays}-Day Sankalp</Text>
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, border: `3 solid ${gradeClr}`, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: `${gradeClr}18` }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 32, color: gradeClr, lineHeight: 1 }}>{grade}</Text>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 8.5, color: '#888', letterSpacing: 1.5 }}>{score}/100</Text>
          </View>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 7.5, color: '#aaa', letterSpacing: 2, marginTop: 7 }}>HOLISTIC SCORE</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 20, gap: 32 }}>
          {[{ label: 'CURRENT STREAK', value: `${profile.currentStreak} days` }, { label: 'DAYS MAINTAINED', value: `${week.streakDays}/7` }].map(({ label, value }) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 16, color: theme.dark, fontWeight: 600 }}>{value}</Text>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 6.5, color: '#aaa', letterSpacing: 1.5, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ backgroundColor: theme.dark, height: 46, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 7.5, color: theme.gold, letterSpacing: 4, opacity: 0.85 }}>SADHANAOS  ·  YOUR  DIGITAL  ASHRAM</Text>
      </View>
    </Page>
  )
}

function ShlokaPage({ reportText, profile }: { reportText: string; profile: ProfileCtx }) {
  const theme = getTheme(profile.deity)
  const { block } = extractShloka(reportText)
  const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s)
  const lines = block.split('\n').map(l => stripMd(l).trim()).filter(Boolean)
  return (
    <Page size="A4" style={{ backgroundColor: theme.bg, fontFamily: 'Cormorant' }}>
      <PageBorder gold={theme.gold}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: '#aaa', letterSpacing: 4, marginBottom: 8 }}>SACRED VERSE</Text>
          <Text style={{ fontFamily: 'Devanagari', fontSize: 11, color: theme.primary, letterSpacing: 2, marginBottom: 4 }}>श्रीमद् वचन</Text>
          <GoldDivider gold={theme.gold} width={440} />
          <View style={{ flexDirection: 'row', marginBottom: 24, marginTop: 4 }}>
            {[0,1,2].map(i => <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.gold, marginHorizontal: 4 }} />)}
          </View>
          <View style={{ width: '100%', paddingHorizontal: 20, marginBottom: 24 }}>
            {lines.map((line, i) => (
              <Text key={i} style={{ fontFamily: isDevanagari(line) ? 'Devanagari' : 'Cormorant', fontSize: isDevanagari(line) ? 19 : 14, color: isDevanagari(line) ? theme.primary : '#444', textAlign: 'center', lineHeight: 1.7, fontStyle: !isDevanagari(line) ? 'italic' : 'normal', marginBottom: isDevanagari(line) ? 2 : 4 }}>{line}</Text>
            ))}
          </View>
          <GoldDivider gold={theme.gold} width={440} />
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 16 }}>
            <LotusMandala color={theme.gold} size={170} />
          </View>
          <View style={{ paddingHorizontal: 30, marginBottom: 10 }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 7.5, color: '#aaa', letterSpacing: 3, textAlign: 'center', marginBottom: 10 }}>SACRED CONTEMPLATION</Text>
            <Text style={{ fontFamily: 'Cormorant', fontSize: 12, color: '#555', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.8 }}>
              Sit with this verse. Close your eyes and breathe it in three times.{'\n'}
              Let its meaning dissolve into your being — not as knowledge, but as lived truth.{'\n'}
              Then open your eyes and ask: what must change in me today?
            </Text>
          </View>
          <GoldDivider gold={theme.gold} width={440} />
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontFamily: 'Devanagari', fontSize: 13, color: theme.gold, letterSpacing: 2 }}>{theme.mantra}</Text>
          </View>
        </View>
      </PageBorder>
      <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: '#bbb', textAlign: 'center', paddingBottom: 12, letterSpacing: 2 }}>2</Text>
    </Page>
  )
}

function MirrorPage({ profile, week }: { profile: ProfileCtx; week: WeekCtx }) {
  const theme = getTheme(profile.deity)
  const { score, grade } = calcScore(week)
  const gradeClr = gradeColor(grade)
  return (
    <Page size="A4" style={{ backgroundColor: theme.bg, fontFamily: 'Cormorant' }}>
      <View style={{ backgroundColor: theme.dark, paddingVertical: 22, paddingHorizontal: 50, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Devanagari', fontSize: 20, color: theme.gold, letterSpacing: 2 }}>साधना का दर्पण</Text>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: theme.gold, opacity: 0.7, letterSpacing: 3, marginTop: 4 }}>YOUR PRACTICE MIRROR</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 44, paddingTop: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <View style={{ position: 'relative', width: 110, height: 110, marginRight: 28 }}>
            <Svg width={110} height={110} viewBox="0 0 110 110">
              <Circle cx={55} cy={55} r={50} fill="none" stroke="#E8DCC8" strokeWidth={6} />
              <Circle cx={55} cy={55} r={50} fill="none" stroke={gradeClr} strokeWidth={6} strokeDasharray={`${(score / 100) * 314}, 314`} transform="rotate(-90 55 55)" />
              <Circle cx={55} cy={55} r={44} fill={`${gradeClr}12`} />
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 36, color: gradeClr, lineHeight: 1 }}>{grade}</Text>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: '#aaa', letterSpacing: 1 }}>{score}/100</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {[
              { label: 'CURRENT STREAK', value: `${profile.currentStreak} days` },
              { label: 'MOOD AVERAGE',   value: week.avgMood !== null ? `${week.avgMood.toFixed(1)}/5` : '—/5' },
              { label: 'WATER DAILY',    value: `${week.waterAvg.toFixed(1)} glasses` },
              { label: 'URGES RESISTED', value: week.urgeCount > 0 ? `${week.urgesResisted}/${week.urgeCount}` : 'None' },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7, borderBottomWidth: 0.4, borderBottomColor: '#E8DCC8', paddingBottom: 5 }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: '#999', letterSpacing: 1.5 }}>{label}</Text>
                <Text style={{ fontFamily: 'Cormorant', fontSize: 11, color: theme.dark, fontWeight: 600 }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
        <GoldDivider gold={theme.gold} width={500} />
        <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: '#aaa', letterSpacing: 3, marginBottom: 14, marginTop: 4 }}>WEEKLY PRACTICE CONSISTENCY</Text>
        {[
          { label: 'Meditation',  value: week.meditationDays },
          { label: 'Pranayama',   value: week.pranayamaDays  },
          { label: 'Prayer',      value: week.prayerDays     },
          { label: 'Exercise',    value: week.exerciseDays   },
          { label: 'Streak Days', value: week.streakDays     },
        ].map(p => <PracticeBar key={p.label} label={p.label} value={p.value} gold={theme.gold} />)}
        <GoldDivider gold={theme.gold} width={500} />
      </View>
      <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: '#bbb', textAlign: 'center', paddingBottom: 12, letterSpacing: 2 }}>3</Text>
    </Page>
  )
}

function GuidancePage({ reportText, profile }: { reportText: string; profile: ProfileCtx }) {
  const theme = getTheme(profile.deity)
  const { rest } = extractShloka(reportText)
  const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s)
  const isHeading = (s: string) => s.endsWith(':') || (s === s.toUpperCase() && s.length < 60 && !isDevanagari(s))
  const lines = rest.split('\n').map(l => stripMd(l).trim()).filter(Boolean)
  return (
    <Page size="A4" style={{ backgroundColor: theme.bg, fontFamily: 'Cormorant' }}>
      <PageBorder gold={theme.gold}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Svg width={22} height={14} style={{ marginRight: 8 }}>
              <Line x1={0} y1={7} x2={22} y2={7} stroke={theme.gold} strokeWidth={1.2} />
            </Svg>
            <Text style={{ fontFamily: 'Devanagari', fontSize: 16, color: theme.primary, flex: 1 }}>प्रिय साधक,</Text>
            <Svg width={22} height={14} style={{ marginLeft: 8 }}>
              <Line x1={0} y1={7} x2={22} y2={7} stroke={theme.gold} strokeWidth={1.2} />
            </Svg>
          </View>
          {lines.map((line, i) => {
            if (isDevanagari(line)) return <Text key={i} style={{ fontFamily: 'Devanagari', fontSize: 13, color: theme.primary, textAlign: 'center', lineHeight: 1.7, marginVertical: 5 }}>{line}</Text>
            if (isHeading(line)) return (
              <View key={i} style={{ marginTop: 10, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 6, height: 6 }}>
                  <Svg width={6} height={6} viewBox="0 0 6 6"><Polygon points="3,0 6,3 3,6 0,3" fill={theme.gold} /></Svg>
                </View>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 8.5, color: theme.dark, letterSpacing: 1.5, marginLeft: 6 }}>{line.replace(/:$/, '').toUpperCase()}</Text>
              </View>
            )
            return <Text key={i} style={{ fontFamily: 'Cormorant', fontSize: 11.5, color: '#333', lineHeight: 1.75, marginBottom: 3 }}>{line}</Text>
          })}
        </View>
      </PageBorder>
      <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: '#bbb', textAlign: 'center', paddingBottom: 12, letterSpacing: 2 }}>4</Text>
    </Page>
  )
}

function PathPage({ profile, week }: { profile: ProfileCtx; week: WeekCtx }) {
  const theme = getTheme(profile.deity)
  return (
    <Page size="A4" style={{ backgroundColor: theme.bg, fontFamily: 'Cormorant' }}>
      <View style={{ backgroundColor: theme.dark, paddingVertical: 22, paddingHorizontal: 50, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Devanagari', fontSize: 20, color: theme.gold, letterSpacing: 2 }}>आगे का मार्ग</Text>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 8, color: theme.gold, opacity: 0.7, letterSpacing: 3, marginTop: 4 }}>THE  PATH  AHEAD</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 44, paddingTop: 28 }}>
        {[
          { num: 'I',   title: 'Deepen the Practice', body: `Your ${week.meditationDays}/7 meditation days show ${week.meditationDays >= 5 ? 'strong commitment. Push toward daily practice.' : 'room to grow. Commit to sitting every morning before the world wakes.'}` },
          { num: 'II',  title: 'Fortify the Shield',  body: week.urgeCount > 0 ? `You faced ${week.urgeCount} urges and held ${week.urgesResisted} — ${Math.round((week.urgesResisted / week.urgeCount) * 100)}% resolve. The 4-7-8 breath must become your first instinct.` : 'No urges logged this week. Track everything — awareness itself is armor.' },
          { num: 'III', title: 'Guard the Sankalp',   body: `Day ${profile.currentDay} of ${profile.targetDays}. ${profile.targetDays - profile.currentDay} days remain. Read your sankalp every morning before any screen.` },
        ].map(({ num, title, body }) => (
          <View key={num} style={{ flexDirection: 'row', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#E8DCC8' }}>
            <View style={{ width: 32, alignItems: 'center', marginRight: 14 }}>
              <Svg width={28} height={28} viewBox="0 0 28 28">
                <Circle cx={14} cy={14} r={13} fill="none" stroke={theme.gold} strokeWidth={1} />
                <Circle cx={14} cy={14} r={10} fill={`${theme.gold}22`} />
              </Svg>
              <View style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: theme.goldDark }}>{num}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cinzel', fontSize: 9.5, color: theme.dark, letterSpacing: 1, marginBottom: 5 }}>{title.toUpperCase()}</Text>
              <Text style={{ fontFamily: 'Cormorant', fontSize: 11.5, color: '#444', lineHeight: 1.75 }}>{body}</Text>
            </View>
          </View>
        ))}
        <GoldDivider gold={theme.gold} width={500} />
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
          <Text style={{ fontFamily: 'Devanagari', fontSize: 20, color: theme.primary, textAlign: 'center', letterSpacing: 2 }}>{theme.blessing}</Text>
        </View>
        <GoldDivider gold={theme.gold} width={500} />
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <WaxSeal gold={theme.gold} goldDark={theme.goldDark} size={80} />
          <Text style={{ fontFamily: 'Devanagari', fontSize: 11, color: theme.goldDark, marginTop: 10, letterSpacing: 1.5 }}>इति शुभम्</Text>
          <Text style={{ fontFamily: 'Cormorant', fontSize: 10, color: '#aaa', fontStyle: 'italic', marginTop: 4 }}>Thus it is auspicious.</Text>
          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Cinzel', fontSize: 9, color: theme.dark, letterSpacing: 1.5 }}>Rishi</Text>
            <Text style={{ fontFamily: 'Cormorant', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>Your Digital Guru</Text>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: theme.dark, height: 38, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Cinzel', fontSize: 7, color: theme.gold, letterSpacing: 3.5, opacity: 0.8 }}>SADHANAOS  ·  YOUR  DIGITAL  ASHRAM</Text>
      </View>
    </Page>
  )
}

// ─── Exported Document ────────────────────────────────────────────────────────

export function SacredReportDocument({ profile, week, reportText, weekNumber, dateRange }: ReportDocumentProps) {
  return (
    <Document title={`Sadhana Weekly Report — Week ${weekNumber}`} author="SadhanaOS">
      <CoverPage   profile={profile} week={week} weekNumber={weekNumber} dateRange={dateRange} />
      <ShlokaPage  profile={profile} reportText={reportText} />
      <MirrorPage  profile={profile} week={week} />
      <GuidancePage profile={profile} reportText={reportText} />
      <PathPage    profile={profile} week={week} />
    </Document>
  )
}
