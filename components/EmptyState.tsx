'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-tv-bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-tv-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-tv-text mb-1 text-center">{title}</h3>
      {description && (
        <p className="text-sm text-tv-text-soft text-center max-w-[280px]">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2.5 bg-tv-blue hover:bg-tv-blue-hover text-white text-sm font-semibold rounded-full transition-all active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-tv-blue focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
