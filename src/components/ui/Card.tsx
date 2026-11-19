import type { ReactNode } from 'react'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-white/70 bg-white/95 shadow-lg backdrop-blur-md ${className}`}>
    {children}
  </div>
)

