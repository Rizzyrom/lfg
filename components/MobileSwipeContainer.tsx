'use client'

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSwipeable } from 'react-swipeable'
import { useMobileNavigation } from './MobileNavigationProvider'

interface MobileSwipeContainerProps {
  children: ReactNode
}

const PAGES = ['/chat', '/watchlist', '/feed'] as const
type PageRoute = typeof PAGES[number]

export default function MobileSwipeContainer({ children }: MobileSwipeContainerProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const navigation = useMobileNavigation()

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
    if (deltaX < -77 && currentIndex < PAGES.length - 1) {
      targetIndex = currentIndex + 1
    }
    // Swipe right = previous page (show page to the left)
    else if (deltaX > 77 && currentIndex > 0) {
      targetIndex = currentIndex - 1
    }

    if (targetIndex !== currentIndex) {
      // Use navigation provider instead of router.push
      // This prevents full page reload
      navigation.navigateToPage(targetIndex)
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

  // On desktop, just render children without swipe
  if (!isMobile) {
    return <>{children}</>
  }

  // On mobile, wrap with swipe detection
  // Note: No more framer-motion here, transitions are handled by PageContainer
  return (
    <div {...swipeHandlers} className="relative h-full w-full overflow-hidden" style={{ touchAction: 'pan-y' }}>
      {children}
    </div>
  )
}
