import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'sacred' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sacred-saffron focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'rounded-card select-none',

          variant === 'primary'     && 'bg-sacred-saffron text-dawn-white hover:bg-saffron-light active:bg-saffron-deep shadow-warm-sm hover:shadow-warm-md',
          variant === 'secondary'   && 'border-2 border-sacred-saffron text-sacred-saffron bg-transparent hover:bg-sacred-saffron/10 active:bg-sacred-saffron/20',
          variant === 'ghost'       && 'text-sacred-saffron bg-transparent hover:bg-sacred-saffron/10 active:bg-sacred-saffron/15',
          variant === 'sacred'      && 'bg-gradient-to-r from-temple-gold to-saffron-light text-indigo-deep font-semibold shadow-gold-glow hover:shadow-saffron-glow hover:from-saffron-light hover:to-temple-gold active:scale-[0.97]',
          variant === 'destructive' && 'bg-rose-red text-dawn-white hover:bg-rose-red/90 active:bg-rose-red/80 shadow-warm-sm',

          size === 'sm' && 'h-8  px-3 text-sm rounded-lg',
          size === 'md' && 'h-10 px-5 text-sm',
          size === 'lg' && 'h-12 px-7 text-base',

          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
