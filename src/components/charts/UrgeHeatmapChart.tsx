'use client'

interface HeatCell {
  hour: number  // 0–23
  day:  number  // 0=Sun … 6=Sat
  count: number
}

interface Props {
  cells:    HeatCell[]
  maxCount: number
}

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourLabel(h: number): string {
  if (h === 0)  return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

function cellBg(count: number, max: number): string {
  if (count === 0 || max === 0) return '#F5EDE0'
  const t = count / max
  // saffron gradient: light amber → deep orange-red
  const r = Math.round(248 - t * 80)
  const g = Math.round(210 - t * 120)
  const b = Math.round(130 - t * 100)
  return `rgb(${r},${Math.max(g, 10)},${Math.max(b, 10)})`
}

export function UrgeHeatmapChart({ cells, maxCount }: Props) {
  // Build [day][hour] lookup
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const c of cells) {
    if (c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24) {
      grid[c.day][c.hour] = c.count
    }
  }

  // Find peak cell for annotation
  let peakDay = -1, peakHour = -1, peakVal = 0
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h] > peakVal) {
        peakVal = grid[d][h]; peakDay = d; peakHour = h
      }
    }
  }

  const CW = 28  // cell width
  const CH = 10  // cell height
  const LW = 28  // label width

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Day headers */}
        <div className="flex" style={{ marginLeft: LW }}>
          {DAYS.map((d) => (
            <div
              key={d}
              style={{ width: CW + 2 }}
              className="text-center text-xs text-twilight shrink-0"
            >
              {d.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="flex items-center mb-px">
            <div
              style={{ width: LW }}
              className="text-xs text-twilight/60 text-right pr-1.5 shrink-0"
            >
              {hour % 4 === 0 ? hourLabel(hour) : ''}
            </div>
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const cnt = grid[dayIdx][hour]
              return (
                <div
                  key={dayIdx}
                  title={`${DAYS[dayIdx]} ${hourLabel(hour)}: ${cnt} urge${cnt !== 1 ? 's' : ''}`}
                  style={{
                    width:           CW,
                    height:          CH,
                    backgroundColor: cellBg(cnt, maxCount),
                    marginRight:     2,
                    borderRadius:    2,
                  }}
                />
              )
            })}
          </div>
        ))}

        {/* Peak annotation */}
        {peakVal > 0 && (
          <p className="text-xs text-twilight/70 mt-2 italic">
            Peak: {DAYS[peakDay]} {hourLabel(peakHour)}–{hourLabel(peakHour + 1)}{' '}
            ({peakVal} urge{peakVal !== 1 ? 's' : ''})
          </p>
        )}

        {peakVal === 0 && (
          <p className="text-xs text-twilight text-center mt-2">
            No urges recorded.
          </p>
        )}

        {/* Color scale */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs text-twilight/60">Low</span>
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <div
                key={t}
                style={{ width: 12, height: 8, backgroundColor: cellBg(t * maxCount, maxCount), borderRadius: 1 }}
              />
            ))}
          </div>
          <span className="text-xs text-twilight/60">High</span>
        </div>
      </div>
    </div>
  )
}
