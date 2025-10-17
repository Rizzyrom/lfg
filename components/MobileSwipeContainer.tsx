'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSwipeable } from 'react-swipeable'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileSwipeContainerProps {
  children: ReactNode
}

const PAGES = ['/chat', '/watchlist', '/feed'] as const
type PageRoute = typeof PAGES[number]

export default function MobileSwipeContainer({ children }: MobileSwipeContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get current page index
  const getCurrentIndex = () => {
    const index = PAGES.indexOf(pathname as PageRoute)
    return index === -1 ? 0 : index
  }

  // Handle swipe navigation
  const handleSwipe = (deltaX: number) => {
    if (!isMobile) return

    const currentIndex = getCurrentIndex()
    let targetIndex = currentIndex

    // Swipe left = next page (show page to the right)
    if (deltaX < -125 && currentIndex < PAGES.length - 1) {
      targetIndex = currentIndex + 1
      setDirection(-1)
    }
    // Swipe right = previous page (show page to the left)
    else if (deltaX > 125 && currentIndex > 0) {
      targetIndex = currentIndex - 1
      setDirection(1)
    }

    if (targetIndex !== currentIndex) {
      router.push(PAGES[targetIndex])
    }
  }

  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      // Show visual feedback during swipe if needed
    },
    onSwiped: (eventData) => {
      handleSwipe(eventData.deltaX)
    },
    trackMouse: false, // Only track touch, not mouse
    trackTouch: true,
    delta: 10, // Min distance to be considered a swipe
    preventScrollOnSwipe: false,
    rotationAngle: 0,
  })

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  // On desktop, just render children without swipe
  if (!isMobile) {
    return <>{children}</>
  }

  // On mobile, wrap with swipe detection and animation
  return (
    <div {...swipeHandlers} className="relative h-full w-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
