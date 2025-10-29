# LFG Navigation & Routing Architecture Analysis

**Analysis Date**: 2025-10-28
**Purpose**: Comprehensive analysis of current navigation, routing, data fetching, and performance patterns

---

## 1. Navigation & Routing Architecture

### 1.1 Routing Type: **Next.js Route-Based Navigation**

The app uses **Next.js 14 App Router** with three separate route pages:
- `/chat` → `app/chat/page.tsx`
- `/watchlist` → `app/watchlist/page.tsx`
- `/feed` → `app/feed/page.tsx`

**These are NOT components in a single page**, but actual Next.js routes that trigger full page navigation.

### 1.2 Swipe Navigation Handler

**File**: `components/MobileSwipeContainer.tsx` (116 lines)

**How it works**:
```typescript
// Uses react-swipeable library
const PAGES = ['/chat', '/watchlist', '/feed']

// Swipe handlers detect horizontal swipes
const swipeHandlers = useSwipeable({
  onSwiped: (eventData) => {
    handleSwipe(eventData.deltaX)
  },
  trackTouch: true,
  delta: 10, // Min distance: 10px
})

// Navigation triggered via Next.js router
const handleSwipe = (deltaX: number) => {
  // Swipe left (deltaX < -77): next page
  // Swipe right (deltaX > 77): previous page
  router.push(PAGES[targetIndex])
}
```

**Key characteristics**:
- **Mobile-only**: Checks `window.innerWidth < 1024` (lg breakpoint)
- **77px threshold**: Requires swipe of at least 77px to trigger navigation
- **Framer Motion animations**: Slide in/out transitions
- **Touch-only**: `trackMouse: false` (no mouse swipe on desktop)
- **Vertical scroll preserved**: `preventScrollOnSwipe: false`, `touchAction: 'pan-y'`

### 1.3 Navigation UI Elements

#### Desktop Navigation
**Location**: `components/AppShell.tsx` lines 78-109

Desktop shows traditional link navigation in header:
```typescript
<nav className="hidden md:flex items-center gap-1 ml-4">
  <Link href="/chat">Chat</Link>
  <Link href="/watchlist">Watchlist</Link>
  <Link href="/feed">Feed</Link>
</nav>
```

#### Mobile Bottom Navigation
**Location**: `components/AppShell.tsx` lines 242-264

5px tall indicator bar at bottom with three equal segments:
```typescript
<nav className="fixed bottom-0 h-[5px] flex">
  <Link href="/chat" className={pathname === '/chat' ? 'bg-tv-blue' : ''} />
  <Link href="/watchlist" className={pathname === '/watchlist' ? 'bg-tv-blue' : ''} />
  <Link href="/feed" className={pathname === '/feed' ? 'bg-tv-blue' : ''} />
</nav>
```

Active page highlighted in blue.

### 1.4 Layout Structure

**Root Layout**: `app/layout.tsx` (48 lines)
- Minimal wrapper with PWA registration
- No AppShell at root level

**Page-Level Layout**: Each page wraps content in `<AppShell>`
```typescript
// Example: app/chat/page.tsx
<AppShell
  leftRail={<WatchlistRail />}
  rightRail={<RightRail />}
  pageTitle="@ CHAT"
>
  <MobileSwipeContainer>
    <ChatClient />
  </MobileSwipeContainer>
</AppShell>
```

**AppShell provides**:
- Header with navigation
- 3-column responsive grid (left rail, main, right rail)
- Mobile drawers for left/right rails
- Bottom navigation indicator

---

## 2. Three Main Pages Structure

### 2.1 Chat Page

**Route**: `/chat`
**File**: `app/chat/page.tsx` (30 lines)

**Structure**:
```
AppShell
  ├── leftRail: WatchlistRail
  ├── rightRail: RightRail
  └── children: MobileSwipeContainer
                  └── ChatClient (332+ lines)
```

**ChatClient imports**:
- `Message` component (memoized)
- `MentionAutocomplete`
- `Toast`
- `useAutoScroll` hook
- Icons from lucide-react

**Type**: Server Component (async, checks auth)

**Data fetching**: Client-side in ChatClient

### 2.2 Markets/Watchlist Page

**Route**: `/watchlist`
**File**: `app/watchlist/page.tsx` (29 lines)

**Structure**:
```
AppShell
  ├── leftRail: WatchlistRail
  ├── rightRail: RightRail
  └── children: MobileSwipeContainer
                  └── WatchlistClient (332 lines)
```

**WatchlistClient imports**:
- `Link` from next/link
- `usePathname` from next/navigation
- `TrendingUp` icon
- `SkeletonRow` component
- `AssetSearchBar` component

**Type**: Server Component (async, checks auth)

**Data fetching**: Client-side in WatchlistClient

### 2.3 News/Feed Page

**Route**: `/feed`
**File**: `app/feed/page.tsx` (28 lines)

**Structure**:
```
AppShell
  ├── leftRail: TrendingRail
  ├── rightRail: RightRail
  └── children: MobileSwipeContainer
                  └── FeedLayout (150+ lines)
                        └── UnifiedFeed (200+ lines)
```

**FeedLayout imports**:
- `Search`, `ExternalLink` icons
- `UnifiedFeed` component (heavy)

**UnifiedFeed imports**:
- Multiple icons from lucide-react
- `memo` from React
- No chart libraries (lighter than Markets page)

**Type**: Server Component (async, checks auth)

**Data fetching**: Client-side in FeedLayout and UnifiedFeed

### 2.4 Summary

| Page | Route | Main Client Component | Line Count | Server/Client |
|------|-------|----------------------|------------|---------------|
| Chat | `/chat` | ChatClient.tsx | 332+ | Server → Client |
| Markets | `/watchlist` | WatchlistClient.tsx | 332 | Server → Client |
| Feed | `/feed` | FeedLayout.tsx | 150+ | Server → Client |

**Pattern**: All pages are **route-based**, not conditionally rendered components.

---

## 3. Markets Page Deep Dive

### 3.1 What Renders on Markets Page

**Component Tree**:
```
WatchlistClient
  ├── AssetSearchBar (search/add symbols)
  ├── SkeletonRow (loading state)
  └── Two-Column Grid
        ├── Stocks Column
        │     └── Asset Bubbles (links to /asset/[symbol])
        └── Crypto Column
              └── Asset Bubbles (links to /asset/[symbol])
```

**No charts render on Markets page itself** - only when clicking into asset detail page.

### 3.2 AssetChart Component Usage

**NOT used on Markets page.**

**Used on**: `/asset/[symbol]` detail page only

**Import location**: `app/asset/[symbol]/AssetDetailClient.tsx` lines 10-13

```typescript
// Lazy loaded with dynamic import
const AssetChart = dynamic(() => import('@/components/AssetChart'), {
  loading: () => <div className="card p-6 h-[450px] animate-pulse" />,
  ssr: false, // Client-side only
})
```

**AssetChart dependencies** (from `components/AssetChart.tsx`):
```typescript
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'
import useSWR from 'swr'
import { TrendingUp, TrendingDown } from 'lucide-react'
```

**Heavy imports**:
- `lightweight-charts`: ~400KB (TradingView charting library)
- `useSWR`: ~10KB

### 3.3 API Calls on Markets Page Mount

**WatchlistClient.tsx data fetching**:

1. **Initial load** (line 34):
   ```typescript
   GET /api/watchlist/prices
   ```
   Fetches ALL watchlist items with prices in parallel.

2. **Staggered price updates** (lines 69-101):
   After initial load, sets up staggered updates:
   - Each item updates every 5 minutes
   - Updates spread out over 5-minute cycle (5s intervals)
   - Only when page is visible (Page Visibility API)

3. **Polling**:
   - Initial: All prices fetched immediately
   - Ongoing: Individual item updates every 5 minutes, staggered
   - Example: 10 items = 1 update every 30 seconds (spread over 5 min)

**No heavy API calls** - just price data.

### 3.4 WatchlistClient Component Code Highlights

**Key features**:
- **Staggered refresh**: Spreads updates to avoid rate limiting (lines 69-101)
- **Visibility detection**: Pauses updates when tab hidden (lines 104-118)
- **Memoized rendering**: `useMemo` for stocks/crypto separation (lines 171-178)
- **Grid layout**: Two-column responsive grid (lines 280-326)
- **Asset bubbles**: Gradient cards with price/change indicators (lines 181-247)
- **Touch-optimized**: Active scale animation, touch-manipulation (line 190)

**File location**: `app/watchlist/WatchlistClient.tsx` (332 lines)

### 3.5 Markets Page - No Heavy Components

**Markets page does NOT load**:
- ❌ AssetChart (lightweight-charts)
- ❌ TechnicalIndicators
- ❌ MarketDataPanel
- ❌ SentimentPanel
- ❌ AssetNews

These are only loaded on `/asset/[symbol]` detail pages with dynamic imports.

---

## 4. Data Fetching Patterns

### 4.1 Data Fetching Strategy

**Primary pattern**: Client-side fetch with hooks

**Technologies**:
- **fetch API** with async/await
- **SWR** for caching (on AssetChart only)
- **useEffect** + **setInterval** for polling
- **useCallback** for memoized fetch functions

### 4.2 Example Patterns

#### Pattern 1: Polling with setInterval (ChatClient)
```typescript
// app/chat/ChatClient.tsx lines 73-91
const fetchMessages = useCallback(async () => {
  const res = await fetch('/api/chat')
  if (res.ok) {
    setMessages(await res.json())
  }
}, [])

useEffect(() => {
  fetchMessages()
  const interval = setInterval(fetchMessages, 5000) // 5s polling
  return () => clearInterval(interval)
}, [fetchMessages])
```

#### Pattern 2: SWR with caching (AssetChart)
```typescript
// components/AssetChart.tsx lines 44-51
const { data, error, isLoading } = useSWR(
  `/api/chart?symbol=${symbol}&source=${source}&days=${days}`,
  fetcher,
  {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute deduplication
  }
)
```

#### Pattern 3: Manual fetch with loading state (WatchlistClient)
```typescript
// app/watchlist/WatchlistClient.tsx lines 34-47
const fetchAllPrices = useCallback(async () => {
  try {
    const res = await fetch('/api/watchlist/prices')
    if (res.ok) {
      setItems(await res.json())
    }
  } finally {
    setLoading(false)
  }
}, [])
```

#### Pattern 4: Parallel fetching (UnifiedFeed)
```typescript
// components/UnifiedFeed.tsx lines 61-71
const [newsRes, redditRes, twitterRes] = await Promise.all([
  fetch('/api/news', {
    headers: { 'Cache-Control': 'max-age=180' }
  }),
  fetch('/api/social/reddit', {
    headers: { 'Cache-Control': 'max-age=120' }
  }),
  fetch('/api/social/twitter', {
    headers: { 'Cache-Control': 'max-age=120' }
  }),
])
```

### 4.3 Caching Configuration

**Server-side caching** (from `lib/cache.ts`):
- **Redis/Upstash**: Primary cache (if configured)
- **In-memory LRU**: Fallback (max 1000 entries)
- **Request deduplication**: Prevents parallel duplicate requests

**Cache TTLs**:
```typescript
// From PERFORMANCE_OPTIMIZATION_REPORT.md
News feed:          300s (5 minutes)
Social feeds:       120s (2 minutes)
Watchlist prices:    60s (1 minute)
Market data:         30s
Chat messages:       No cache (real-time)
```

**Client-side caching**:
- **SWR**: Used only for AssetChart component
- **Cache headers**: Sent with fetch requests (`Cache-Control: max-age=180`)
- **Deduplication**: SWR dedupes requests within 60s window

### 4.4 Refetch Behavior

**Do pages refetch on every mount?**

| Page | Refetch on Mount | Caching | Notes |
|------|------------------|---------|-------|
| Chat | ✅ Yes | ❌ No cache | Real-time, 5s polling |
| Markets | ✅ Yes | ⚠️ Server cache only | Immediate fetch, then staggered |
| Feed | ✅ Yes | ✅ Server + client cache | 2-5 min TTL, Cache-Control headers |
| Asset Detail | ⚠️ SWR cached | ✅ SWR caching | 5 min refresh, no refetch on focus |

**Current behavior**:
- **Chat**: Always refetches (real-time required)
- **Markets**: Refetches but staggered updates reduce server load
- **Feed**: May serve from cache (server-side), 2-5 min TTL
- **Asset Detail**: SWR caches for 5 minutes, won't refetch on focus

**Issues**:
- Navigating away and back to Markets triggers full refetch
- No persistence between page transitions
- Every swipe navigation causes remount and refetch

---

## 5. Bundle & Loading Analysis

### 5.1 Heaviest Imports on Markets Page

**WatchlistClient dependencies**:
```typescript
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp } from 'lucide-react'          // ⚠️ ~50KB (tree-shakeable)
import SkeletonRow from '@/components/SkeletonRow'
import AssetSearchBar from './AssetSearchBar'
```

**Estimated bundle weights**:
- React hooks: ~5KB (core)
- Next.js Link + usePathname: ~10KB
- lucide-react (TrendingUp icon): ~2KB (with tree-shaking)
- Custom components: ~10KB total

**Total Markets page client bundle: ~30-40KB** (excluding React core)

**No heavy libraries on Markets page.**

### 5.2 Heaviest Imports Across App

**Asset Detail Page** (heaviest):
```typescript
// AssetDetailClient.tsx
import dynamic from 'next/dynamic'

// These are dynamically imported (code-split):
const AssetChart = dynamic(() => import('@/components/AssetChart'))
  // ↳ lightweight-charts: ~400KB
  // ↳ useSWR: ~10KB

const TechnicalIndicators = dynamic(() => import('@/components/TechnicalIndicators'))
const MarketDataPanel = dynamic(() => import('@/components/MarketDataPanel'))
const SentimentPanel = dynamic(() => import('@/components/SentimentPanel'))
const AssetNews = dynamic(() => import('@/components/AssetNews'))
```

**MobileSwipeContainer** (used on all pages):
```typescript
import { useSwipeable } from 'react-swipeable'    // ~15KB
import { motion, AnimatePresence } from 'framer-motion' // ⚠️ ~80KB
```

**UnifiedFeed** (Feed page):
```typescript
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { TrendingUp, TrendingDown, ExternalLink, ThumbsUp,
         MessageCircle, Share2, Newspaper } from 'lucide-react' // ~10KB
// Multiple icons = larger payload if not tree-shaken properly
```

### 5.3 react-swipeable Usage

**Locations**:
1. `components/MobileSwipeContainer.tsx` (page navigation)
2. `app/chat/ChatTabs.tsx` (tab swipes within chat)
3. `app/feed/FeedTabs.tsx` (tab swipes within feed)

**Usage pattern**:
```typescript
const handlers = useSwipeable({
  onSwiped: (eventData) => handleSwipe(eventData.deltaX),
  trackTouch: true,
  delta: 10,
})

return <div {...handlers}>content</div>
```

**Bundle weight**: ~15KB

### 5.4 Current Lazy Loading

**Only in Asset Detail page** (`AssetDetailClient.tsx`):

✅ **Dynamic imports**:
```typescript
const AssetChart = dynamic(() => import('@/components/AssetChart'), {
  loading: () => <SkeletonLoader />,
  ssr: false, // Client-side only
})
// Same for: TechnicalIndicators, MarketDataPanel, SentimentPanel, AssetNews
```

**Images**:
```typescript
// components/FeedItem.tsx line 6
<img loading="lazy" /> // Native lazy loading

// components/Message.tsx
<img loading="lazy" /> // Native lazy loading
```

**NOT lazy loaded**:
- ❌ ChatClient
- ❌ WatchlistClient
- ❌ FeedLayout/UnifiedFeed
- ❌ react-swipeable (loaded on all pages)
- ❌ framer-motion (loaded on all pages)

### 5.5 Main Entry Points

**Server Component entry points** (each page):
```
app/chat/page.tsx        → ChatClient.tsx
app/watchlist/page.tsx   → WatchlistClient.tsx
app/feed/page.tsx        → FeedLayout.tsx → UnifiedFeed.tsx
```

**Bundle splitting**:
- Next.js automatically code-splits by route
- Each route gets its own chunk
- Shared components bundled in common chunk

**Shared across all pages** (in common chunk):
- React core
- Next.js runtime
- AppShell component
- MobileSwipeContainer (react-swipeable + framer-motion)

---

## 6. Layout Structure & Gesture Handling

### 6.1 Swipe Gesture Implementation

**Component**: `components/MobileSwipeContainer.tsx`

**Flow**:
```
User swipes horizontally
  ↓
react-swipeable detects touch movement
  ↓
onSwiped callback fires with deltaX
  ↓
handleSwipe checks deltaX threshold (±77px)
  ↓
Determines target page index
  ↓
router.push(PAGES[targetIndex])
  ↓
Next.js navigation triggers
  ↓
Framer Motion exit animation on old page
  ↓
New page mounts
  ↓
Framer Motion enter animation on new page
```

**Animation**:
```typescript
// components/MobileSwipeContainer.tsx lines 73-86
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? -300 : 300, // Slide from left/right
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 300 : -300, // Slide out opposite direction
    opacity: 0,
  }),
}

// Spring animation
transition={{
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
}}
```

### 6.2 Container Components

**No single container wrapping all three pages.**

Each page is a separate route that renders:
```
<html>
  <body>
    <AppShell>
      <MobileSwipeContainer>
        <PageContent />
      </MobileSwipeContainer>
    </AppShell>
  </body>
</html>
```

**Why no shared container**: Route-based navigation means full page remount.

### 6.3 Loading States

**Suspense boundaries**: ❌ None currently

**Loading states by page**:

1. **Markets page**:
   ```typescript
   // WatchlistClient.tsx lines 262-266
   {loading ? (
     <div className="space-y-2">
       <SkeletonRow />
       <SkeletonRow />
     </div>
   ) : /* content */}
   ```

2. **Chat page**:
   - No explicit loading state
   - Messages appear when fetched

3. **Feed page**:
   ```typescript
   // UnifiedFeed.tsx
   {loading && <div>Loading feed...</div>}
   ```

4. **Asset Detail page** (best loading states):
   ```typescript
   // AssetDetailClient.tsx lines 10-25
   const AssetChart = dynamic(() => import('@/components/AssetChart'), {
     loading: () => <div className="card animate-pulse h-[450px]" />,
     ssr: false,
   })
   // Each heavy component has skeleton loader
   ```

**Error boundaries**:
- ✅ Used on Asset Detail page only
- ❌ Not used on main navigation pages

---

## 7. Performance Issues Identified

### 7.1 Navigation Performance Problems

**Issue 1: Full Page Remount on Swipe**
- Every swipe triggers Next.js navigation
- Page unmounts completely
- New page mounts from scratch
- All state lost
- All data refetched

**Impact**:
- ⚠️ Poor UX for frequent navigation
- ⚠️ Wasted API calls
- ⚠️ Janky transitions despite animations

**Issue 2: Heavy Bundle on Every Page**
- `framer-motion` (~80KB) loaded on all pages for MobileSwipeContainer
- `react-swipeable` (~15KB) loaded on all pages
- Total ~95KB overhead for navigation

**Impact**:
- ⚠️ Slower initial page load
- ⚠️ Unnecessary for desktop users (no swipe)

**Issue 3: No State Persistence**
- Markets page: Scroll position lost
- Feed page: Filter selection lost
- Chat page: Input text lost (if partially typed)

**Impact**:
- ⚠️ Poor mobile UX
- ⚠️ User frustration

### 7.2 Data Fetching Issues

**Issue 1: Refetch on Every Mount**
- No client-side cache between navigations
- Markets page refetches all prices
- Feed refetches all feeds
- Only server-side cache helps (but still network round-trip)

**Issue 2: Polling Continues When Page Hidden**
- WatchlistClient has visibility detection (✅ good)
- ChatClient does NOT check visibility (❌ wastes resources)
- UnifiedFeed does NOT check visibility (❌ wastes resources)

**Issue 3: No Optimistic Updates**
- Adding watchlist item: waits for full refetch
- Sending chat message: waits for server response

### 7.3 Bundle Size Issues

**Issue 1: No Lazy Loading on Main Pages**
- All client components load immediately
- No progressive enhancement
- No route-level code splitting beyond Next.js default

**Issue 2: framer-motion on All Pages**
- 80KB library for simple slide animations
- Could use CSS transitions instead
- Only needed on mobile for swipe animations

**Issue 3: Multiple lucide-react Icons**
- UnifiedFeed imports 7 icons
- Each import adds to bundle if tree-shaking fails
- Should import from single entry point

---

## 8. Recommendations Summary

### 8.1 High Priority (Breaking Changes)

1. **Hybrid Navigation Architecture**
   - Keep routes for deep linking
   - Use client-side state machine for mobile swipes
   - Conditionally render pages based on state (no router.push)
   - Preserve state between navigations

2. **Remove Route-Based Navigation for Swipes**
   - Create `<MobileNavigationProvider>` context
   - Store current page index in state
   - Render all three pages, show active one
   - Use framer-motion AnimatePresence for transitions
   - Only use router.push for deep links (external navigation)

### 8.2 Medium Priority (Performance)

3. **Lazy Load Heavy Components**
   - Lazy load ChatClient, WatchlistClient, FeedLayout
   - Show skeleton loaders during load
   - Prefetch next/previous pages on idle

4. **Replace framer-motion with CSS**
   - Slide animations can be pure CSS
   - Reduces bundle by 80KB
   - Better performance on low-end devices

5. **Implement SWR Globally**
   - Replace fetch + useState with SWR everywhere
   - Configure global cache provider
   - Persistent cache across navigations

### 8.3 Low Priority (Nice to Have)

6. **Add Suspense Boundaries**
   - Wrap each page in Suspense
   - Progressive loading for better UX

7. **Optimize lucide-react Imports**
   - Create icon barrel file
   - Single import point
   - Better tree-shaking

8. **Page Visibility API**
   - Pause all polling when tab hidden
   - Resume when visible
   - Save battery and bandwidth

---

## 9. Code Locations Quick Reference

| Item | File Path | Lines |
|------|-----------|-------|
| **Navigation Handler** | `components/MobileSwipeContainer.tsx` | 116 |
| **AppShell Layout** | `components/AppShell.tsx` | 268 |
| **Chat Page** | `app/chat/page.tsx` | 30 |
| **Chat Client** | `app/chat/ChatClient.tsx` | 332+ |
| **Markets Page** | `app/watchlist/page.tsx` | 29 |
| **Markets Client** | `app/watchlist/WatchlistClient.tsx` | 332 |
| **Feed Page** | `app/feed/page.tsx` | 28 |
| **Feed Layout** | `app/feed/FeedLayout.tsx` | 150+ |
| **Unified Feed** | `components/UnifiedFeed.tsx` | 200+ |
| **Asset Chart** | `components/AssetChart.tsx` | 279 |
| **Asset Detail** | `app/asset/[symbol]/AssetDetailClient.tsx` | 77 |
| **Cache Layer** | `lib/cache.ts` | 192 |
| **Root Layout** | `app/layout.tsx` | 48 |

---

## 10. Key Findings Summary

### Current Architecture

✅ **What works well**:
- Clean route separation for deep linking
- Dynamic imports on Asset Detail page
- Server-side caching layer
- Staggered price updates on Markets page
- Page Visibility API on Markets page
- Touch-optimized UI with proper gesture thresholds

❌ **What needs improvement**:
- Full page remount on every swipe navigation
- No state persistence between pages
- Heavy bundle (framer-motion) on all pages
- No lazy loading on main pages
- Refetch on every mount (no SWR/React Query)
- No Suspense boundaries
- Mixed data fetching patterns (fetch + SWR)

### Navigation Flow

```
Mobile: Swipe → MobileSwipeContainer → router.push() → Full page reload
Desktop: Click Link → router.push() → Full page reload
```

Both trigger **full Next.js navigation**, causing complete remount.

### Performance Impact

- **Swipe navigation**: ~200-500ms (route change + remount + refetch)
- **Data refetch**: Every page mount
- **Bundle overhead**: ~95KB (framer-motion + react-swipeable)
- **State loss**: Complete on every navigation

### Recommendation Priority

1. 🔴 **Critical**: Implement hybrid navigation (state-based for swipes)
2. 🟠 **High**: Add global SWR cache
3. 🟡 **Medium**: Lazy load main page components
4. 🟢 **Low**: Replace framer-motion with CSS
