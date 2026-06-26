import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          {
            'bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-0.5': variant === 'primary',
            'bg-primary-light text-white hover:bg-white/10 hover:shadow-md': variant === 'secondary',
            'border-2 border-accent text-accent hover:bg-accent/10': variant === 'outline',
            'bg-transparent text-text-dim hover:text-white hover:bg-white/5': variant === 'ghost',
            'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50': variant === 'danger',
            
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-6 text-base': size === 'md',
            'h-14 px-8 text-lg font-semibold': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
