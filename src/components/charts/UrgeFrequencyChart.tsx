'use client'

import {
  ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface UrgeWeek {
  week:         string   // "MM-DD" label
  count:        number
  avgIntensity: number   // 1–10
  winRate:      number   // 0–1
}

interface Props {
  weeks: UrgeWeek[]
}

function intensityFill(avg: number): string {
  // low intensity → amber, high → deep red
  if (avg <= 3) return '#E8D06A'
  if (avg <= 5) return '#E8913A'
  if (avg <= 7) return '#C45A1E'
  return '#7B1A1A'
}

export function UrgeFrequencyChart({ weeks }: Props) {
  if (weeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-twilight">
        No urge data in this range.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={weeks} margin={{ top: 8, right: 16, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#8B7355' }} interval="preserveStartEnd" />
        <YAxis yAxisId="left"  tick={{ fontSize: 9, fill: '#8B7355' }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 1]}
               tickFormatter={(v) => `${Math.round(v * 100)}%`}
               tick={{ fontSize: 9, fill: '#6B9E78' }} />
        <Tooltip
          contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value)
            const n = String(name)
            return n === 'winRate'
              ? [`${Math.round(v * 100)}%`, 'Held Strong']
              : [v, n === 'count' ? 'Urges' : n]
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />

        <Bar yAxisId="left" dataKey="count" name="Urges" maxBarSize={28} radius={[3, 3, 0, 0]} animationDuration={900} animationEasing="ease-out">
          {weeks.map((w, i) => (
            <Cell key={i} fill={intensityFill(w.avgIntensity)} />
          ))}
        </Bar>

        <Line
          yAxisId="right"
          dataKey="winRate"
          name="winRate"
          type="monotone"
          stroke="#6B9E78"
          strokeWidth={2}
          dot={{ r: 3, fill: '#6B9E78', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
