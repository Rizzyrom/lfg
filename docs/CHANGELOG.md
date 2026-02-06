# Changelog

All notable changes to the LFG App will be documented in this file.

---

## [1.1.0] - 2026-02-04

### Added
- **Message grouping** — consecutive messages from same sender within 3 min are grouped
- **User avatars** — initials-based avatars with consistent colors per user
- **Blue message bubbles** — own messages now use blue gradient instead of black

### Fixed
- **Message flicker bug** — fixed optimistic update race condition causing messages to disappear/reappear
- **`/analyze` command** — rewired to working `/api/pulse/asset` endpoint
- **Build errors** — removed orphaned imports breaking Vercel deploys

### Changed
- Input placeholder changed from "Message @username" to "Type a message..."
- Reduced spacing between grouped messages for tighter UI
- Timestamps only shown on last message of each group

### Removed
- AI agent system (`/ask` command, `lib/agent/`)
- Social feed integration (Twitter, Reddit fetchers)
- News aggregation routes
- Push notification system
- 5 unused commands: `/ask`, `/feed`, `/whois`, `/context`, `/snapshot`
- 7 unused components: EmptyState, ErrorBoundary, LoadingSpinner, MessageSkeleton, OfflineIndicator, Skeleton, SkeletonRow
- 14 unused API routes

### Stats
- **40 files changed**
- **3,243 lines removed**
- **235 lines added**
- **Net reduction: ~3,000 lines**

---

## [1.0.0] - Initial Release

### Features
- Real-time chat with WebSocket
- Ticker symbol detection ($TSLA, $BTC, etc.)
- Price chips with live data
- Message reactions
- Reply threading
- File attachments (images, videos, PDFs)
- @mentions with autocomplete
- Watchlist management
- User authentication (Lucia)
- Invite-only signup

---

## Known Issues (Pending)

1. **Ticker chips slow to load** — async price fetch causes visible delay
2. **Ticker messages flicker on refresh** — TickerChip re-fetches on every render
3. **iOS keyboard covers input** — needs better viewport handling

---

## Contributors

- Rom (@Rizzyrom)
- Tommy (@annese_)
- JMH (AI Assistant)
- Albert Ives (AI Assistant)
