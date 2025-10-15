import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoScrollOptions {
  threshold?: number // Distance from bottom (in pixels) to consider "at bottom"
  throttleMs?: number // Throttle delay for scroll events
}

// Throttle utility function
function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastRan = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastRan >= delay) {
      func(...args)
      lastRan = now
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastRan = Date.now()
      }, delay - (now - lastRan))
    }
  }) as T
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { threshold = 100, throttleMs = 100 } = options
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const userScrolledRef = useRef(false)
  const isScrollingRef = useRef(false)

  // Check if user is at bottom of scroll container - memoized
  const checkIfAtBottom = useCallback(() => {
    if (!scrollRef.current) return true

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= threshold
  }, [threshold])

  // Handle scroll events - memoized and throttled
  const handleScrollInternal = useCallback(() => {
    const atBottom = checkIfAtBottom()
    setIsAtBottom(atBottom)

    if (atBottom) {
      setShowNewMessages(false)
    }

    // Mark that user has manually scrolled
    if (!isScrollingRef.current) {
      userScrolledRef.current = true
    }
  }, [checkIfAtBottom])

  // Create throttled version
  const handleScroll = useRef(throttle(handleScrollInternal, throttleMs)).current

  // Scroll to bottom function - memoized with RAF for smooth performance
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      isScrollingRef.current = true

      // Use RAF to avoid layout thrashing
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
          })
          setIsAtBottom(true)
          setShowNewMessages(false)

          // Reset scrolling flag after animation
          setTimeout(() => {
            isScrollingRef.current = false
          }, smooth ? 500 : 0)
        }
      })
    }
  }, [])

  // Auto-scroll effect when content changes
  const autoScrollOnNewContent = (dependencies: any[]) => {
    useEffect(() => {
      // Only auto-scroll if user is at bottom or hasn't scrolled yet
      if (isAtBottom || !userScrolledRef.current) {
        scrollToBottom(true)
      } else {
        // User is scrolled up, show "new messages" indicator
        setShowNewMessages(true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)
  }

  return {
    scrollRef,
    isAtBottom,
    showNewMessages,
    scrollToBottom,
    handleScroll,
    autoScrollOnNewContent,
  }
}
