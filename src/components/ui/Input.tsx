'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId, useState } from 'react'
import { cn } from '@/lib/utils'

/* ── Text Input with floating label ──────────────────────────────────── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id: externalId, value, defaultValue, ...props }, ref) => {
    const autoId = useId()
    const id = externalId ?? autoId
    const [focused, setFocused] = useState(false)
    const hasValue = Boolean(value ?? defaultValue ?? props.placeholder)
    const lifted = focused || hasValue

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          className={cn(
            'peer block w-full rounded-card border bg-dawn-white px-4 pb-2 pt-5 text-sm text-indigo-deep',
            'placeholder:text-transparent',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-sacred-saffron focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-rose-red focus:ring-rose-red'
              : 'border-sandstone hover:border-sacred-saffron/60',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 text-sm text-twilight',
              'pointer-events-none transition-all duration-200 origin-left',
              (lifted || focused) && 'top-3 -translate-y-0 scale-75 text-sacred-saffron font-medium'
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1 text-xs text-rose-red">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-twilight">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

/* ── Textarea ─────────────────────────────────────────────────────────── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id: externalId, ...props }, ref) => {
    const autoId = useId()
    const id = externalId ?? autoId
    const [focused, setFocused] = useState(false)

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          id={id}
          rows={4}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          className={cn(
            'block w-full rounded-card border bg-dawn-white px-4 pb-3 pt-6 text-sm text-indigo-deep resize-none',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-sacred-saffron',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-rose-red' : 'border-sandstone hover:border-sacred-saffron/60',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'absolute left-4 top-3 text-xs font-medium pointer-events-none',
              focused ? 'text-sacred-saffron' : 'text-twilight'
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1 text-xs text-rose-red">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
