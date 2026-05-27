interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  /** Tailwind hex or CSS color string. Defaults to sacred saffron. */
  color?: string
  trackColor?: string
  label?: string
  /** Content to render in the center instead of a label below */
  children?: React.ReactNode
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = '#E8913A',
  trackColor = '#E8D5BE',
  label,
  children,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const progress = Math.min(Math.max(value / max, 0), 1)
  const offset = circ * (1 - progress)

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className ?? ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center content */}
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-twilight font-medium">{label}</span>
      )}
    </div>
  )
}
