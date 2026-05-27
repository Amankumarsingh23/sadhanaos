'use client'

import { useState } from 'react'

interface MantraCounterProps {
  mantra?: string
  target?: number
}

export function MantraCounter({ mantra = 'Om Namah Shivaya', target = 108 }: MantraCounterProps) {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-amber-600 italic">{mantra}</p>
      <button
        onClick={() => setCount((c) => Math.min(c + 1, target))}
        className="w-28 h-28 rounded-full bg-orange-100 border-2 border-orange-300 text-3xl font-bold text-orange-700 hover:bg-orange-200 active:scale-95 transition-transform select-none"
      >
        {count}
      </button>
      <p className="text-xs text-amber-500">{count} / {target}</p>
      <button
        onClick={() => setCount(0)}
        className="text-xs text-gray-400 underline underline-offset-2"
      >
        Reset
      </button>
    </div>
  )
}
