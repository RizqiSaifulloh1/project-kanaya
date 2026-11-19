import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  className?: string
}

export const Btn = ({ children, variant = 'primary', className = '', ...p }: BtnProps) => {
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-[#0f5a30]',
    ghost: 'bg-white text-ink border border-line hover:bg-primary-soft hover:border-primary active:bg-[#d6ecdc]',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200',
  }

  return (
    <button
      {...p}
      className={`h-11 px-5 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

