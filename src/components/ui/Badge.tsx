import { HTMLAttributes, forwardRef } from 'react'
import { cn } from './Button'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DE' | 'LB' | 'CB' | 'S' | 'K' | 'default'
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent',
          {
            'border-transparent bg-red-500/20 text-red-500': variant === 'QB',
            'border-transparent bg-green-500/20 text-green-500': variant === 'RB',
            'border-transparent bg-blue-500/20 text-blue-500': variant === 'WR',
            'border-transparent bg-yellow-500/20 text-yellow-500': variant === 'TE',
            'border-transparent bg-slate-500/20 text-slate-300': variant === 'OL',
            'border-transparent bg-orange-500/20 text-orange-500': variant === 'DE',
            'border-transparent bg-purple-500/20 text-purple-500': variant === 'LB',
            'border-transparent bg-cyan-500/20 text-cyan-500': variant === 'CB',
            'border-transparent bg-pink-500/20 text-pink-500': variant === 'S',
            'border-transparent bg-lime-500/20 text-lime-500': variant === 'K',
            'border-transparent bg-muted text-white': variant === 'default',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'
