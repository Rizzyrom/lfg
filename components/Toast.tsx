'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const config = {
    success: {
      bg: 'bg-tv-up',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-tv-down',
      icon: XCircle,
    },
    info: {
      bg: 'bg-tv-blue',
      icon: Info,
    },
  }

  const { bg, icon: Icon } = config[type]

  return (
    <div
      className={`fixed top-4 right-4 left-4 md:left-auto md:min-w-[320px] md:max-w-[400px] ${bg} text-white px-4 py-3 rounded-2xl shadow-xl z-[100] animate-slide-in-down flex items-center gap-3`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 touch-manipulation"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
