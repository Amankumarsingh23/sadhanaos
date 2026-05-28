'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

type WeekRow = Record<string, string | number>

interface Props {
  weeks: WeekRow[]   // each row: { week: string, [type]: count }
  types: string[]    // unique pranayama types
}

const TYPE_COLORS = [
  '#3D2C8D', '#7B5EA7', '#E8913A', '#C4A842',
  '#6B9E78', '#D4708C', '#C45C5C', '#5C8FA0',
]

export function PranayamaProgressChart({ weeks, types }: Props) {
  if (weeks.length === 0 || types.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-twilight">
        No pranayama data in this range.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={weeks} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#8B7355' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: '#8B7355' }} />
        <Tooltip
          contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {types.map((type, i) => (
          <Bar
            key={type}
            dataKey={type}
            name={type}
            stackId="prana"
            fill={TYPE_COLORS[i % TYPE_COLORS.length]}
            fillOpacity={0.85}
            maxBarSize={30}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
