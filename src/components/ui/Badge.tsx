import type { ReactNode } from 'react'

export const tone = {
  green: 'bg-[#dcfce7] text-[#166534]',
  amber: 'bg-accent-soft text-[#805500]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
  blue: 'bg-[#e8ecf8] text-[#243775]',
  gray: 'bg-slate-100 text-slate-600',
  teal: 'bg-primary-soft text-primary-dark',
}

export const Badge = ({
  t,
  children,
  className = '',
}: {
  t: keyof typeof tone
  children: ReactNode
  className?: string
}) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[t]} ${className}`}>
    {children}
  </span>
)

