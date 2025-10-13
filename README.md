# LFG - Market Community Platform

A private, invite-only market community platform built with Next.js 14, featuring real-time chat, shared watchlists, and AI-powered market pulse summaries.

## Features

- **Invite-Only Authentication**: Secure username/password auth with Lucia
- **Shared Watchlist**: Track crypto and equity symbols across your community
- **Market Feed**: View cached prices with 24h change indicators
- **Real-Time Chat**: E2EE-ready WebSocket chat (requires separate WS server)
- **AI Pulse**: Generate market summaries from public headlines (LLM-powered)
- **n8n Integration**: Refresh market data via webhook

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Auth**: Lucia v3 with Argon2id password hashing
- **Real-time**: WebSocket server + Upstash Redis Pub/Sub
- **Styling**: TradingView Dark theme + Robinhood-style layout
- **AI**: Anthropic Claude / OpenAI GPT for public pulse summaries

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon recommended)
- Upstash Redis account
- n8n webhook URL
- (Optional) Anthropic or OpenAI API key for AI Pulse

## Setup

### 1. Clone and Install

```bash
cd lfg
pnpm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL`: Neon Postgres connection string
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis credentials
- `N8N_WEBHOOK_URL`: Your n8n webhook URL (pre-configured in .env.example)
- `APP_WEBHOOK_SECRET`: Random 32-character secret for inbound webhooks
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:3000`)

Optional (for AI Pulse):
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

### 3. Database Setup

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Create First Admin User

Run the seed script to create an admin user and generate a one-time invite:

```bash
pnpm tsx scripts/seed.ts
```

**Save the invite token** - it will only be shown once.

### 5. Run the App

```bash
pnpm dev
```

Visit http://localhost:3000

### 6. (Optional) Run WebSocket Server

For real-time chat functionality:

```bash
# In a separate terminal
npx tsx lib/ws-server.ts
```

The WebSocket server runs on port 3001 by default (set `WS_PORT` to customize).

## Usage

### Sign Up

1. Go to http://localhost:3000/login
2. Click "Have an invite? Sign up"
3. Paste your invite token
4. Create username and password

### Manage Watchlist

1. Navigate to **Watchlist** tab
2. Add symbols (e.g., BTC, ETH, AAPL)
3. Select source: Crypto or Equity
4. Click "Add"

### Refresh Market Data

Click the **Refresh** button in the top bar to trigger the n8n webhook. The webhook should:
1. Fetch latest prices from CoinGecko, Finnhub, etc.
2. POST to `/api/cache/upsert` with header `X-App-Secret: <APP_WEBHOOK_SECRET>`
3. Send JSON body:

```json
{
  "items": [
    {
      "symbol": "BTC",
      "source": "crypto",
      "price": "45000.50",
      "change24h": "2.5"
    }
  ]
}
```

### Generate AI Pulse

1. Navigate to **Feed**
2. In the right rail, click **Generate** under "AI Pulse"
3. View AI-generated summary of public market headlines

### Real-Time Chat

1. Start the WebSocket server (`npx tsx lib/ws-server.ts`)
2. Navigate to **Chat** tab
3. Send encrypted messages to your group

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | Create account with invite token |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |
| `/api/invites/create` | POST | Create invite (admin only) |
| `/api/watchlist` | GET | Get all watchlist items |
| `/api/watchlist` | POST | Add symbol to watchlist |
| `/api/watchlist?id=<id>` | DELETE | Remove symbol |
| `/api/refresh` | POST | Trigger n8n webhook |
| `/api/price-cache` | GET | Get cached prices |
| `/api/cache/upsert` | POST | Upsert prices (from n8n) |
| `/api/pulse/public` | POST | Generate AI summary |

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables (copy from `.env.local`)
4. Set `NEXT_PUBLIC_BASE_URL` to your production URL
5. Deploy

**Note**: WebSocket server requires separate hosting (Render, Railway, etc.) or use Vercel's Edge runtime with a WebSocket provider.

### Render (WebSocket Server)

1. Create new Web Service
2. Build: `pnpm install && npx prisma generate`
3. Start: `npx tsx lib/ws-server.ts`
4. Set environment variables
5. Deploy

## Security

- Passwords hashed with Argon2id
- Sessions stored securely with httpOnly cookies
- CSRF protection via Origin/Referer validation
- Rate limiting on auth and refresh endpoints
- E2EE-ready chat (client-side encryption placeholder)
- Private messages never sent to LLM (only public headlines)

## Project Structure

```
lfg/
├── app/
│   ├── api/              # API route handlers
│   ├── feed/             # Feed page
│   ├── watchlist/        # Watchlist page
│   ├── chat/             # Chat page
│   ├── login/            # Login/signup page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Homepage (redirects)
│   └── globals.css       # Global styles
├── components/           # React components
├── lib/
│   ├── auth.ts           # Lucia auth helpers
│   ├── db.ts             # Prisma client
│   ├── redis.ts          # Upstash Redis client
│   ├── crypto.ts         # E2EE helpers (client-side)
│   ├── password.ts       # Password hashing
│   ├── ws.ts             # WebSocket utilities
│   └── ws-server.ts      # WebSocket server
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── seed.ts           # Admin user + invite generator
├── .env.example          # Environment template
└── README.md             # This file
```

## Troubleshooting

### Prisma Client Not Found

```bash
npx prisma generate
```

### WebSocket Not Connecting

1. Ensure `lib/ws-server.ts` is running
2. Check `WS_PORT` environment variable
3. Verify session cookie is set (login first)

### n8n Webhook Failing

1. Check `N8N_WEBHOOK_URL` includes the secret parameter
2. Verify n8n workflow is active
3. Check n8n logs for errors

### AI Pulse Not Working

1. Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env.local`
2. Restart server
3. Check API key is valid

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
