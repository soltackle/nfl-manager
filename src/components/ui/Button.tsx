import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none ring-offset-primary',
          {
            'bg-accent text-white hover:bg-accent/90': variant === 'primary',
            'bg-surface text-white hover:bg-surface/90': variant === 'secondary',
            'hover:bg-surface hover:text-accent': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 py-2 px-4': size === 'md',
            'h-11 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
