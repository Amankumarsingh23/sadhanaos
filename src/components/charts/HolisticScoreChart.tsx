'use client'

import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'

interface WeekScore {
  week:  string   // display label e.g. "Wk 3"
  score: number   // 0–100
}

interface Props {
  weeks: WeekScore[]
}

function gradeColor(score: number): string {
  if (score >= 85) return '#6B9E78'  // sage   — A
  if (score >= 70) return '#E8913A'  // saffron — B
  if (score >= 55) return '#C4A842'  // gold   — C
  if (score >= 40) return '#D4708C'  // lotus  — D
  return '#C45C5C'                   // rose   — F
}

function gradeLabel(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function HolisticScoreChart({ weeks }: Props) {
  if (weeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-twilight">
        Complete at least one week of sadhana to see your holistic score.
      </div>
    )
  }

  const display = weeks.map((w) => ({ ...w, grade: gradeLabel(w.score) }))

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={165}>
        <BarChart data={display} margin={{ top: 20, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#8B7355' }} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: '#8B7355' }} />
          <Tooltip
            contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
            formatter={(value: unknown) => [`${Number(value)}/100`, 'Sadhana Score']}
          />
          <Bar dataKey="score" maxBarSize={36} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="grade"
              position="top"
              style={{ fontSize: 11, fontWeight: 700 }}
              formatter={(v: unknown) => String(v)}
            />
            {display.map((w, i) => (
              <Cell key={i} fill={gradeColor(w.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs text-twilight">
        {[
          { grade: 'A', label: '≥ 85', color: '#6B9E78' },
          { grade: 'B', label: '≥ 70', color: '#E8913A' },
          { grade: 'C', label: '≥ 55', color: '#C4A842' },
          { grade: 'D', label: '≥ 40', color: '#D4708C' },
          { grade: 'F', label: '< 40', color: '#C45C5C' },
        ].map(({ grade, label, color }) => (
          <span key={grade} className="flex items-center gap-1">
            <span style={{ backgroundColor: color }} className="w-2.5 h-2.5 rounded-sm inline-block" />
            {grade} ({label})
          </span>
        ))}
      </div>

      {/* Scoring breakdown */}
      <details className="text-xs text-twilight/70">
        <summary className="cursor-pointer hover:text-twilight">Score breakdown</summary>
        <ul className="mt-1 space-y-0.5 pl-3">
          <li>Streak maintained: 25 pts</li>
          <li>Rituals avg: 25 pts</li>
          <li>Meditation: 15 pts</li>
          <li>Urges resisted: 15 pts</li>
          <li>Weekly reflection: 10 pts</li>
          <li>Scripture studied: 10 pts</li>
        </ul>
      </details>
    </div>
  )
}
