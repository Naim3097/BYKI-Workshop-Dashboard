'use client'

// Shared, brand-agnostic UI primitives. Colours come from CSS variables
// (--accent etc.) each app sets in its own globals.css, so these look native to
// every workshop. Ported from Overhaulinyard's components/ui.tsx.

import React from 'react'

// Re-exported from the server-safe module so client code can keep importing it
// from '@byki/core/ui'. Server Components should import from '@byki/core/format'.
export { formatMYR } from '../format'

export function severityColor(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500/15 text-red-400 border-red-500/20'
    case 'WARNING':
    case 'MAJOR':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
    case 'MODERATE':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
    case 'MINOR':
    case 'INFO':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    default:
      return 'bg-white/5 text-white/40 border-white/10'
  }
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2',
  }
  const variants = {
    primary: 'bg-[var(--accent)] text-black hover:brightness-110 shadow-[0_0_20px_var(--accent-glow)]',
    secondary: 'glass glass-hover text-white/70 hover:text-white',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    ghost: 'text-white/40 hover:text-white/70 hover:bg-white/5',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={`glass rounded-2xl p-4 ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  color = 'default',
  className = '',
}: {
  children: React.ReactNode
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'default'
  className?: string
}) {
  const colors = {
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    red: 'bg-red-500/15 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    default: 'bg-white/5 text-white/50 border-white/10',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colors[color]} ${className}`}
    >
      {children}
    </span>
  )
}
