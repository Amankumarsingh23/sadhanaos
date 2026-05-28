'use client'

interface WordEntry {
  word:  string
  count: number
}

interface Props {
  words: WordEntry[]
}

const COLORS = [
  '#E8913A', '#C4A842', '#D4708C', '#E8613A',
  '#A07835', '#7B5EA7', '#6B9E78', '#C45C5C',
]

export function GratitudeWordCloud({ words }: Props) {
  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-twilight text-center px-4">
        No gratitude entries yet. Start your daily log to see your gratitude patterns here.
      </div>
    )
  }

  const max = words[0].count
  const min = words[words.length - 1].count

  function fontSize(count: number): number {
    if (max === min) return 20
    return Math.round(12 + ((count - min) / (max - min)) * 26)
  }

  function opacity(count: number): number {
    if (max === min) return 1
    return 0.6 + ((count - min) / (max - min)) * 0.4
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center items-center py-3 min-h-[120px]">
      {words.map((w, i) => (
        <span
          key={w.word}
          title={`"${w.word}" mentioned ${w.count} time${w.count !== 1 ? 's' : ''}`}
          style={{
            fontSize:   fontSize(w.count),
            color:      COLORS[i % COLORS.length],
            opacity:    opacity(w.count),
            fontWeight: w.count >= max * 0.7 ? 700 : w.count >= max * 0.4 ? 600 : 400,
            cursor:     'default',
            lineHeight: 1.2,
          }}
        >
          {w.word}
        </span>
      ))}
    </div>
  )
}
