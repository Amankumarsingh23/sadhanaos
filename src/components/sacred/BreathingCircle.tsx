'use client'

import { useState, useEffect } from 'react'

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest'

const PHASES: { phase: Phase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4000, label: 'Inhale' },
  { phase: 'hold', duration: 4000, label: 'Hold' },
  { phase: 'exhale', duration: 6000, label: 'Exhale' },
  { phase: 'rest', duration: 2000, label: 'Rest' },
]

export function BreathingCircle() {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    const { duration } = PHASES[phaseIdx]
    const t = setTimeout(() => setPhaseIdx((i) => (i + 1) % PHASES.length), duration)
    return () => clearTimeout(t)
  }, [active, phaseIdx])

  const current = PHASES[phaseIdx]

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`w-32 h-32 rounded-full border-4 border-orange-400 flex items-center justify-center transition-transform duration-1000 ${
          active && current.phase === 'inhale' ? 'scale-125' : active && current.phase === 'exhale' ? 'scale-75' : 'scale-100'
        } bg-orange-50`}
      >
        <span className="text-sm text-orange-700 font-medium">
          {active ? current.label : 'Ready'}
        </span>
      </div>
      <button
        onClick={() => { setActive((a) => !a); setPhaseIdx(0) }}
        className="text-sm text-amber-700 underline underline-offset-2"
      >
        {active ? 'Stop' : 'Begin'}
      </button>
    </div>
  )
}
