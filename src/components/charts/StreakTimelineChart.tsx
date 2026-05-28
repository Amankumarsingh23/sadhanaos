'use client'

interface StreakDay {
  date: string
  maintained: boolean
}

interface Props {
  days: StreakDay[]
  startDate?: string | null
}

const MILESTONES = [7, 14, 21, 30, 60, 90]

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildGrid(days: StreakDay[]): (StreakDay | null)[][] {
  if (days.length === 0) return []
  const first = new Date(days[0].date)
  const dow   = first.getDay()                // day-of-week of first entry (0=Sun)
  const padded: (StreakDay | null)[] = [
    ...Array.from({ length: dow }, () => null),
    ...days,
  ]
  const rows: (StreakDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    rows.push(padded.slice(i, i + 7))
  }
  return rows
}

function computeCurrentStreak(days: StreakDay[]): number {
  let n = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].maintained) n++
    else break
  }
  return n
}

function dayIndex(date: string, start: string): number {
  return Math.round((new Date(date).getTime() - new Date(start).getTime()) / 86400000) + 1
}

export function StreakTimelineChart({ days, startDate }: Props) {
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-twilight">
        No streak data yet. Start your sadhana to track consistency.
      </div>
    )
  }

  const grid          = buildGrid(days)
  const currentStreak = computeCurrentStreak(days)
  const currentStart  = days.findIndex((_, i) => {
    for (let j = days.length - 1; j >= i; j--) {
      if (!days[j].maintained) return false
    }
    return true
  })
  const streakStartDate = currentStreak > 0 ? days[days.length - currentStreak]?.date : null

  const milestoneDates = new Set<string>()
  if (startDate) {
    MILESTONES.forEach((m) => {
      const d = new Date(new Date(startDate).getTime() + (m - 1) * 86400000)
      milestoneDates.add(d.toISOString().slice(0, 10))
    })
  }

  const CELL = 14
  const GAP  = 2

  return (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="flex gap-0.5 pl-0">
        {DAY_ABBR.map((d, i) => (
          <div key={i} style={{ width: CELL }} className="text-center text-xs text-twilight/60 shrink-0">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-0.5">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-0.5">
            {Array.from({ length: 7 }, (_, ci) => {
              const cell = row[ci] ?? null
              if (!cell) {
                return <div key={ci} style={{ width: CELL, height: CELL }} className="shrink-0" />
              }
              const isCurrent  = streakStartDate !== null && cell.date >= streakStartDate
              const isMilestone = milestoneDates.has(cell.date)
              const color = cell.maintained
                ? isCurrent
                  ? '#E8913A'  // saffron for current streak
                  : '#6B9E78'  // sage for past streaks
                : '#F0E4D0'    // sand for breaks

              const dayNum = startDate ? dayIndex(cell.date, startDate) : null

              return (
                <div
                  key={ci}
                  title={`${cell.date}${dayNum ? ` — Day ${dayNum}` : ''}${cell.maintained ? ' ✓' : ' ✗'}`}
                  style={{
                    width:           CELL,
                    height:          CELL,
                    backgroundColor: color,
                    borderRadius:    3,
                    border:          isMilestone ? '2px solid #C4A842' : 'none',
                    boxShadow:       isCurrent && cell.maintained ? '0 0 4px #E8913A88' : 'none',
                  }}
                  className="shrink-0 cursor-default"
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend + current streak */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-twilight">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-sacred-saffron inline-block" /> Current streak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-sage-green inline-block" /> Past streak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: '#F0E4D0' }} /> Break
          </span>
        </div>
        {currentStreak > 0 && (
          <span className="text-xs font-bold text-sacred-saffron">
            🔥 {currentStreak} day streak
          </span>
        )}
      </div>

      {/* Milestone legend */}
      {startDate && (
        <p className="text-xs text-twilight/60">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-temple-gold mr-1 align-middle" />
          Gold border = milestone (7/14/21/30/60/90 day mark)
        </p>
      )}
    </div>
  )
}
