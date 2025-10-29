'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'

interface PageContainerProps {
  children: ReactNode
  isActive: boolean
  isMounted: boolean
  direction: number
  pageIndex: number
}

/**
 * Container for each page that handles CSS-based transitions
 * Uses pure CSS for better performance (no framer-motion overhead)
 */
export default function PageContainer({
  children,
  isActive,
  isMounted,
  direction,
  pageIndex,
}: PageContainerProps) {
  const [isVisible, setIsVisible] = useState(isActive)
  const [animationState, setAnimationState] = useState<'enter' | 'center' | 'exit' | null>(
    isActive ? 'center' : null
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const prevActiveRef = useRef(isActive)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip animations on initial mount - all pages should appear instantly
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (isActive) {
        setIsVisible(true)
        setAnimationState('center')
      }
      prevActiveRef.current = isActive
      return
    }

    if (isActive && !prevActiveRef.current) {
      // Page becoming active
      setIsVisible(true)
      setAnimationState('enter')

      // Force a reflow to ensure the animation plays
      if (containerRef.current) {
        containerRef.current.offsetHeight
      }

      requestAnimationFrame(() => {
        setAnimationState('center')
      })
    } else if (!isActive && prevActiveRef.current) {
      // Page becoming inactive
      setAnimationState('exit')

      // Hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false)
        setAnimationState(null)
      }, 300) // Match CSS transition duration

      return () => clearTimeout(timer)
    } else if (isActive) {
      // Already active
      setAnimationState('center')
    }

    prevActiveRef.current = isActive
  }, [isActive])

  // Don't render if not mounted
  if (!isMounted) {
    return null
  }

  // Calculate transform based on direction and state
  const getTransform = () => {
    if (animationState === 'enter') {
      return direction > 0 ? 'translateX(-100%)' : 'translateX(100%)'
    } else if (animationState === 'exit') {
      return direction > 0 ? 'translateX(100%)' : 'translateX(-100%)'
    } else if (animationState === 'center') {
      return 'translateX(0)'
    }
    return 'translateX(0)'
  }

  const getOpacity = () => {
    return animationState === 'center' ? 1 : 0
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        display: isVisible || isActive ? 'block' : 'none',
        transform: getTransform(),
        opacity: getOpacity(),
        transition: animationState ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease' : 'none',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: isActive ? 1 : 0,
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}
