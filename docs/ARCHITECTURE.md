# LFG Architecture

> Last updated: Feb 5, 2026

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Custom cookie-based sessions |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Real-time | Polling (5s) — WebSocket planned |

---

## Directory Structure

```
lfg/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── signup/
│   │   ├── chat/               # Chat endpoints
│   │   │   ├── route.ts        # GET/POST messages
│   │   │   ├── attachments/
│   │   │   ├── members/
│   │   │   ├── mentions/
│   │   │   └── tickers/
│   │   ├── market-data/        # Stock/crypto prices
│   │   ├── pulse/asset/        # /analyze command
│   │   ├── reactions/          # Emoji reactions
│   │   ├── ticker/[symbol]/    # Individual ticker lookup
│   │   ├── upload/             # File uploads
│   │   └── watchlist/          # User watchlists
│   ├── chat/                   # Chat UI
│   │   ├── page.tsx
│   │   ├── ChatClient.tsx      # Main chat component
│   │   ├── ChatLayout.tsx      # Layout with sidebar
│   │   └── ChatTabs.tsx        # Mentions/tickers/files tabs
│   ├── login/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                # Redirects to /chat
├── components/
│   ├── AppShell.tsx            # Header + layout wrapper
│   ├── Message.tsx             # Message bubble component
│   ├── MentionAutocomplete.tsx # @mention dropdown
│   ├── TickerChip.tsx          # Inline $TICKER display
│   ├── Toast.tsx               # Notifications
│   └── ...
├── hooks/
│   └── useAutoScroll.ts        # Auto-scroll on new messages
├── lib/
│   ├── commands/               # Slash command system
│   │   ├── exec.ts             # Command dispatcher
│   │   └── handlers/
│   │       └── analyze.ts      # /analyze $TICKER
│   └── ...
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   └── ...
└── docs/
    ├── ARCHITECTURE.md         # This file
    └── CHANGELOG.md            # Version history
```

---

## Data Flow

### Message Send Flow
```
User types message
    ↓
ChatClient.handleSend()
    ↓
Optimistic update (temp ID)
    ↓
POST /api/chat
    ↓
Server validates + stores in DB
    ↓
Returns real message with ID
    ↓
Replace temp message with real one
```

### Message Receive Flow
```
Poll interval (5s)
    ↓
GET /api/chat
    ↓
Merge with pending optimistic messages
    ↓
Update UI state
```

---

## Key Components

### ChatClient.tsx
Main chat interface. Handles:
- Message list rendering
- Input + send logic
- Optimistic updates
- File uploads
- Reply threading
- Mention autocomplete

### Message.tsx
Individual message bubble. Features:
- Message grouping (same sender within 3 min)
- Avatar with initials
- Blue gradient (own) vs white (others)
- Ticker chip parsing
- Reactions
- Reply references

### TickerChip.tsx
Inline stock/crypto display:
- Parses $TICKER from message text
- Fetches price from /api/market-data
- Shows price + % change
- Color-coded (green/red)

---

## Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `/analyze $TICKER` | `handlers/analyze.ts` | Fetches asset pulse data |

---

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL` — Supabase connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- Various API keys for market data

---

## Known Limitations

1. **Polling-based updates** — No true real-time; 5s delay for others' messages
2. **Ticker fetch latency** — Prices load async, causes visible delay
3. **iOS keyboard handling** — Input can be obscured by keyboard

---

*Maintained by Al & JMH*
