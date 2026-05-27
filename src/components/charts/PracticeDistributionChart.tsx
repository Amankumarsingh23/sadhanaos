'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#F97316', '#D97706', '#059669', '#7C3AED', '#0EA5E9']

interface DataPoint {
  name: string
  value: number
}

interface PracticeDistributionChartProps {
  data: DataPoint[]
}

export function PracticeDistributionChart({ data }: PracticeDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
