# LFG Project Structure

```
lfg/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts    # POST - Login endpoint
│   │   │   ├── logout/route.ts   # POST - Logout endpoint
│   │   │   └── signup/route.ts   # POST - Signup with invite
│   │   ├── cache/
│   │   │   └── upsert/route.ts   # POST - Upsert prices (n8n webhook)
│   │   ├── invites/
│   │   │   └── create/route.ts   # POST - Create invite (admin)
│   │   ├── pulse/
│   │   │   └── public/route.ts   # POST - AI pulse summary
│   │   ├── price-cache/route.ts  # GET - Get cached prices
│   │   ├── refresh/route.ts      # POST - Trigger n8n webhook
│   │   ├── watchlist/route.ts    # GET/POST/DELETE - Watchlist CRUD
│   │   └── ws/route.ts           # GET - WebSocket upgrade (Edge)
│   ├── chat/
│   │   ├── ChatClient.tsx        # Chat UI with WebSocket
│   │   └── page.tsx              # Chat page (server component)
│   ├── feed/
│   │   ├── FeedClient.tsx        # Feed UI with price display
│   │   └── page.tsx              # Feed page (server component)
│   ├── login/
│   │   └── page.tsx              # Login/signup page
│   ├── watchlist/
│   │   ├── WatchlistClient.tsx   # Watchlist management UI
│   │   └── page.tsx              # Watchlist page (server component)
│   ├── globals.css               # TradingView Dark styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage (redirects)
│
├── components/                   # React Components
│   ├── AppShell.tsx              # Robinhood-style 3-column layout
│   ├── FeedCard.tsx              # Price display card
│   ├── Message.tsx               # Chat message bubble
│   ├── RightRail.tsx             # AI Pulse + chat preview
│   ├── SkeletonRow.tsx           # Loading skeleton
│   └── WatchlistRail.tsx         # Watchlist sidebar
│
├── lib/                          # Server Utilities
│   ├── auth.ts                   # Lucia auth + session helpers
│   ├── crypto.ts                 # E2EE helpers (AES-GCM)
│   ├── db.ts                     # Prisma client singleton
│   ├── password.ts               # Argon2id password hashing
│   ├── redis.ts                  # Upstash Redis client + rate limit
│   ├── ws.ts                     # WebSocket message utilities
│   └── ws-server.ts              # Standalone WebSocket server
│
├── prisma/
│   └── schema.prisma             # Database schema (Postgres)
│
├── scripts/
│   └── seed.ts                   # Admin user + invite generator
│
├── .env.example                  # Environment template
├── .eslintrc.json                # ESLint config
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies + scripts
├── postcss.config.js             # PostCSS config
├── PROJECT_STRUCTURE.md          # This file
├── QUICKSTART.md                 # Quick start guide
├── README.md                     # Full documentation
├── tailwind.config.ts            # Tailwind + TradingView theme
└── tsconfig.json                 # TypeScript configuration
```

## Database Models (Prisma)

- **User**: username, passwordHash, sessions
- **Session**: Lucia session management
- **Invite**: tokenHash (Argon2id), expiry, consumption tracking
- **Group**: encrypted name, memberships, messages, watchlist
- **Membership**: user-group junction with role (ADMIN/MEMBER/ANALYST/BOT)
- **Message**: ciphertext storage (E2EE-ready), media pointer
- **WatchItem**: symbol, source (crypto/equity), tags
- **PriceCache**: symbol+source composite key, price, change24h

## Key Features

### Authentication (Lucia v3)
- Invite-only signup with Argon2id-hashed tokens
- Username + password (no email)
- 14-day session cookies (httpOnly, secure)
- CSRF protection via Origin/Referer validation
- Rate limiting on sensitive endpoints

### Real-Time Chat
- WebSocket server (lib/ws-server.ts) on port 3001
- Upstash Redis Pub/Sub for multi-instance support
- E2EE-ready (client-side AES-GCM helpers)
- Persistent message storage (ciphertext only)

### Market Data
- Shared watchlist per group
- Price cache with 24h change tracking
- n8n webhook integration for data refresh
- Inbound webhook endpoint for n8n push updates

### AI Pulse
- Public-only LLM summaries (never private messages)
- Supports Anthropic Claude or OpenAI GPT
- Rate limited per user

### UI/UX
- TradingView Dark color scheme
- Robinhood-style 3-column layout
- Responsive grid (desktop: left + main + right)
- Tabular number formatting for prices
- Focus-visible accessibility
- Reduced motion support

## Scripts

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm seed         # Create admin + invite
pnpm ws           # Start WebSocket server
```

## Environment Variables

See `.env.example` for complete list. Required:
- `DATABASE_URL`: Neon Postgres
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `N8N_WEBHOOK_URL`: Pre-configured n8n webhook
- `ALLOWED_ORIGINS`: CSRF protection
- `APP_WEBHOOK_SECRET`: Inbound webhook auth

Optional:
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`: AI Pulse
- `COINGECKO_API_KEY`, `FINNHUB_API_KEY`: Future integrations
- `WS_PORT`: WebSocket server port (default: 3001)

## Security Features

✅ Argon2id password hashing (memoryCost: 19456, timeCost: 2)
✅ Lucia session management with secure cookies
✅ CSRF protection on all POST routes
✅ Rate limiting (auth, invites, refresh, pulse)
✅ E2EE-ready chat (ciphertext-only storage)
✅ Private messages never sent to LLM
✅ Webhook secret verification
✅ No client-side secret exposure

## Deployment Targets

- **Next.js App**: Vercel (recommended), Render, Railway
- **WebSocket Server**: Render Web Service, Railway, or self-hosted
- **Database**: Neon Postgres (serverless)
- **Cache/Pub-Sub**: Upstash Redis (serverless)

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18, Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 5 |
| Auth | Lucia v3 |
| Password Hashing | Argon2id (@node-rs/argon2) |
| Sessions | Lucia + Prisma adapter |
| Real-time | WebSocket (ws) + Upstash Redis |
| Rate Limiting | Upstash Redis |
| E2EE | Web Crypto API (AES-GCM) |
| AI | Anthropic Claude / OpenAI GPT |
| External Integration | n8n webhook |
| Deployment | Vercel, Render |

---

**Built with:** Next.js 14 • TypeScript • Prisma • Lucia • Upstash • WebSockets • TradingView Dark Theme
