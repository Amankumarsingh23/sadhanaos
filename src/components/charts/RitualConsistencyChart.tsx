'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

interface RitualDay {
  date:       string
  meditation: number   // 0 or 1
  pranayama:  number
  prayer:     number
  skincare:   number
  exercise:   number
  shloka:     number
}

interface Props {
  days: RitualDay[]
}

const RITUALS: { key: keyof Omit<RitualDay, 'date'>; label: string; color: string }[] = [
  { key: 'meditation', label: 'Meditation', color: '#3D2C8D' },
  { key: 'pranayama',  label: 'Pranayama',  color: '#7B5EA7' },
  { key: 'prayer',     label: 'Prayer',     color: '#E8913A' },
  { key: 'skincare',   label: 'Skincare',   color: '#D4708C' },
  { key: 'exercise',   label: 'Exercise',   color: '#6B9E78' },
  { key: 'shloka',     label: 'Shloka',     color: '#C4A842' },
]

export function RitualConsistencyChart({ days }: Props) {
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-twilight">
        No ritual data in this range.
      </div>
    )
  }

  const display = days.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={display} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barSize={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: '#8B7355' }}
          interval="preserveStartEnd"
        />
        <YAxis domain={[0, 6]} ticks={[0, 2, 4, 6]} tick={{ fontSize: 9, fill: '#8B7355' }} />
        <Tooltip
          contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
          formatter={(value: unknown, name: unknown) => [Number(value) ? '✓' : '—', String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {RITUALS.map((r) => (
          <Bar
            key={r.key}
            dataKey={r.key}
            name={r.label}
            stackId="rituals"
            fill={r.color}
            fillOpacity={0.85}
            animationDuration={900}
            animationEasing="ease-out"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
