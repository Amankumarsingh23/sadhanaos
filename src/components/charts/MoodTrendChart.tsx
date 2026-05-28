'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer,
} from 'recharts'

interface MoodPoint {
  date:       string
  mood:       number | null
  meditation: number
}

interface Props {
  data: MoodPoint[]
}

export function MoodTrendChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-36 text-xs text-twilight">No mood data in this range.</div>
  }

  const display = data.map((d) => ({
    ...d,
    label: d.date.slice(5),  // MM-DD
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={display} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
        {/* Background mood bands */}
        <ReferenceArea y1={4} y2={5} fill="#6B9E78" fillOpacity={0.08} />
        <ReferenceArea y1={3} y2={4} fill="#E8D5BE" fillOpacity={0.10} />
        <ReferenceArea y1={2} y2={3} fill="#E8D5BE" fillOpacity={0.06} />
        <ReferenceArea y1={1} y2={2} fill="#C45C5C" fillOpacity={0.08} />

        <CartesianGrid strokeDasharray="3 3" stroke="#E8D5BE" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: '#8B7355' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[1, 5]}
          tick={{ fontSize: 9, fill: '#8B7355' }}
          ticks={[1, 2, 3, 4, 5]}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, background: '#FDF8F0', border: '1px solid #E8D5BE', borderRadius: 8 }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value)
            const n = String(name)
            return n === 'mood' ? [`${v}/5`, 'Mood'] : [`${v} min`, 'Meditation']
          }}
        />

        {/* Meditation bars — background layer */}
        <Bar
          dataKey="meditation"
          name="meditation"
          yAxisId={0}
          fill="#C4A882"
          fillOpacity={0.35}
          radius={[2, 2, 0, 0]}
          maxBarSize={18}
        />

        {/* Mood line — foreground */}
        <Line
          dataKey="mood"
          name="mood"
          type="monotone"
          stroke="#3D2C8D"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3D2C8D', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
