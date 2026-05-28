'use client'

export interface CorrelationInsight {
  icon:     string
  title:    string
  text:     string
  strength: number   // 0–1 for the strength bar
}

interface Props {
  insights: CorrelationInsight[]
}

export function CorrelationInsightsCard({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-twilight">
        Log at least 14 days of data to unlock correlation insights.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {insights.map((ins, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-card bg-parchment/80 border border-sandstone p-4"
        >
          <span className="text-2xl shrink-0 leading-none mt-0.5">{ins.icon}</span>
          <div className="flex-1 space-y-1.5 min-w-0">
            <p className="text-sm font-semibold text-indigo-deep">{ins.title}</p>
            <p className="text-xs text-twilight leading-relaxed">{ins.text}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-sandstone rounded-full overflow-hidden">
                <div
                  className="h-full bg-sacred-saffron rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(ins.strength * 100)}%` }}
                />
              </div>
              <span className="text-xs text-twilight/60 shrink-0">
                {ins.strength >= 0.7 ? 'Strong' : ins.strength >= 0.4 ? 'Moderate' : 'Mild'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
