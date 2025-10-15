# React Performance Optimization Patterns - Quick Reference

## Component Memoization

### React.memo with Custom Comparison
```tsx
import { memo } from 'react'

const MyComponent = ({ id, data, onAction }) => {
  // component logic
}

export default memo(MyComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.id === nextProps.id &&
    prevProps.data === nextProps.data
  )
})
```

**When to use**: Components that render often but props rarely change

---

## Callback Memoization

### useCallback
```tsx
import { useCallback } from 'react'

const MyComponent = () => {
  const handleClick = useCallback((id: string) => {
    // handler logic
    console.log(id)
  }, []) // Empty deps = never recreates

  const handleUpdate = useCallback((value: string) => {
    // uses external dependency
    updateData(value)
  }, [updateData]) // Recreates when updateData changes

  return <button onClick={() => handleClick('123')}>Click</button>
}
```

**When to use**: Functions passed as props or used as dependencies

---

## Value Memoization

### useMemo
```tsx
import { useMemo } from 'react'

const MyComponent = ({ items }) => {
  // Expensive calculation
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.value - b.value)
  }, [items]) // Only recalculates when items change

  // Format timestamp
  const formattedDate = useMemo(() => {
    return new Date().toLocaleString()
  }, []) // Calculate once

  return <div>{sortedItems.length}</div>
}
```

**When to use**: Expensive calculations or object/array creations

---

## Scroll Performance

### Throttled Scroll Handler
```tsx
import { useCallback, useRef } from 'react'

function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
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

const MyComponent = () => {
  const handleScrollInternal = useCallback(() => {
    // scroll logic
  }, [])

  const handleScroll = useRef(
    throttle(handleScrollInternal, 100)
  ).current

  return <div onScroll={handleScroll}>...</div>
}
```

**When to use**: High-frequency events (scroll, resize, mousemove)

---

## RAF for Smooth Animations

### Request Animation Frame
```tsx
const scrollToBottom = useCallback(() => {
  requestAnimationFrame(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}, [])
```

**When to use**: DOM mutations, animations, scroll operations

---

## Pure Function Extraction

### Move Outside Component
```tsx
// ❌ Bad: Recreated every render
const MyComponent = ({ text }) => {
  const parseText = (str: string) => {
    return str.split(' ')
  }

  const words = parseText(text)
}

// ✅ Good: Created once
const parseText = (str: string) => {
  return str.split(' ')
}

const MyComponent = ({ text }) => {
  const words = useMemo(() => parseText(text), [text])
}
```

**When to use**: Pure functions that don't need component state

---

## Touch Optimizations

### CSS Classes
```tsx
<button className="touch-manipulation active-scale">
  Tap me
</button>

<div className="touch-ripple">
  Interactive element
</div>

<div className="gpu-accelerated">
  Smooth scrolling
</div>
```

### Minimum Touch Targets
```tsx
// ✅ Good: Minimum 44x44px
<button className="min-h-[44px] min-w-[44px] p-3">
  Icon
</button>

// ❌ Bad: Too small for touch
<button className="p-1">
  Icon
</button>
```

---

## Skeleton Loading

### Implementation
```tsx
const MessageSkeleton = ({ isOwn = false }) => {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-20 bg-gray-700/50 rounded mb-1" />
      <div className="px-4 py-2 rounded-xl bg-gray-700/30">
        <div className="h-4 w-48 bg-gray-600/50 rounded" />
        <div className="h-4 w-32 bg-gray-600/50 rounded mt-2" />
      </div>
      <div className="h-2 w-16 bg-gray-700/50 rounded mt-1" />
    </div>
  )
}
```

**When to use**: During data loading, replacing spinners

---

## Error Boundaries

### Usage
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}
```

**When to use**: Wrap route components, critical features

---

## Network Status Detection

### Hook Implementation
```tsx
import { useNetworkStatus, isSlowNetwork } from '@/hooks/useNetworkStatus'

const MyComponent = () => {
  const network = useNetworkStatus()

  if (!network.isOnline) {
    return <div>Offline mode</div>
  }

  if (isSlowNetwork(network)) {
    // Load low-res images
  }

  return <div>Content</div>
}
```

---

## Bundle Optimization

### Dynamic Imports
```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## Image Optimization

### Best Practices
```tsx
<img
  src={imageUrl}
  alt="Description"
  loading="lazy"           // Lazy load
  decoding="async"         // Async decode
  className="max-w-full"   // Responsive
  onError={handleError}    // Error handling
/>
```

---

## List Rendering

### Key Props
```tsx
// ✅ Good: Stable unique key
{messages.map(msg => (
  <Message key={msg.id} {...msg} />
))}

// ❌ Bad: Index as key (causes issues)
{messages.map((msg, i) => (
  <Message key={i} {...msg} />
))}
```

---

## Ref Usage vs State

### When to Use Refs
```tsx
const MyComponent = () => {
  // ✅ Use ref: Doesn't need to trigger re-render
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousValue = useRef(0)

  // ✅ Use state: Needs to trigger re-render
  const [count, setCount] = useState(0)

  return <div ref={scrollRef}>Content</div>
}
```

**Rule**: Use refs for values that don't affect rendering

---

## Hardware Acceleration

### CSS Techniques
```css
/* Transform creates new layer */
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  will-change: transform;
}

/* Smooth scrolling */
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

---

## Mobile-Specific CSS

### iOS Fixes
```css
/* Prevent zoom on input focus */
input {
  font-size: 16px;
}

/* Safe area insets */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Dynamic viewport height */
.full-height {
  height: 100vh;
  height: 100dvh;
}

/* iOS keyboard handling */
@supports (-webkit-touch-callout: none) {
  .chat-container {
    height: -webkit-fill-available;
  }
}
```

---

## Performance Monitoring

### React DevTools Profiler
```tsx
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
) {
  console.log(`${id} took ${actualDuration}ms`)
}

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

---

## Common Pitfalls

### ❌ Avoid These
```tsx
// Inline object creation (new object every render)
<Component style={{ margin: 10 }} />

// Inline function (new function every render)
<button onClick={() => handleClick(id)}>Click</button>

// Inline array (new array every render)
<List items={data.filter(x => x.active)} />

// Missing dependencies
useEffect(() => {
  doSomething(value)
}, []) // Should include 'value'
```

### ✅ Do This Instead
```tsx
// Memoize objects
const style = useMemo(() => ({ margin: 10 }), [])
<Component style={style} />

// Memoize callbacks
const handleClick = useCallback(() => handleClick(id), [id])
<button onClick={handleClick}>Click</button>

// Memoize filtered arrays
const activeItems = useMemo(
  () => data.filter(x => x.active),
  [data]
)
<List items={activeItems} />

// Correct dependencies
useEffect(() => {
  doSomething(value)
}, [value])
```

---

## Performance Checklist

- [ ] Memoize expensive calculations with `useMemo`
- [ ] Memoize callbacks with `useCallback`
- [ ] Use `React.memo` for pure components
- [ ] Extract pure functions outside components
- [ ] Throttle high-frequency event handlers
- [ ] Use `requestAnimationFrame` for DOM updates
- [ ] Lazy load images with `loading="lazy"`
- [ ] Add skeleton screens for loading states
- [ ] Implement proper error boundaries
- [ ] Use stable keys for list items
- [ ] Minimize inline object/function creation
- [ ] Add touch optimizations for mobile
- [ ] Test on real mobile devices
- [ ] Monitor with React DevTools Profiler
- [ ] Measure with Lighthouse audits

---

## Resources

- [React Performance Docs](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
