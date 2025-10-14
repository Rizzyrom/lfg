import { useEffect, useRef, useState } from 'react'

interface UseAutoScrollOptions {
  threshold?: number // Distance from bottom (in pixels) to consider "at bottom"
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { threshold = 100 } = options
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const userScrolledRef = useRef(false)

  // Check if user is at bottom of scroll container
  const checkIfAtBottom = () => {
    if (!scrollRef.current) return true

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= threshold
  }

  // Handle scroll events
  const handleScroll = () => {
    const atBottom = checkIfAtBottom()
    setIsAtBottom(atBottom)

    if (atBottom) {
      setShowNewMessages(false)
    }

    // Mark that user has manually scrolled
    userScrolledRef.current = true
  }

  // Scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
      setIsAtBottom(true)
      setShowNewMessages(false)
    }
  }

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
