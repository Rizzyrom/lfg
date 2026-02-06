# LFG - Market Chat Platform

A private, invite-only market community chat app with real-time stock/crypto ticker integration.

**Production:** https://lfg-phi.vercel.app/

## Features

### Chat
- **Real-time messaging** — Polling-based updates (5s interval)
- **Message grouping** — Same sender messages grouped within 3 min
- **User avatars** — Initials-based avatars with color coding
- **File attachments** — Images, videos, PDFs with compression
- **Emoji reactions** — Long-press to react
- **Reply threading** — Reply to specific messages
- **@mentions** — Autocomplete for user mentions

### Ticker Integration
- **Inline $TICKER chips** — Type `$TSLA` or `$BTC` in messages
- **Live prices** — Auto-fetches price + 24h % change
- **Color-coded** — Green for gains, red for losses

### Commands
| Command | Description |
|---------|-------------|
| `/analyze $TICKER` | Get asset pulse data |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Custom cookie-based sessions |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start dev server
pnpm dev
```

Visit http://localhost:3000

## Environment Variables

See `.env.example` for all variables. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase credentials

## Project Structure

```
lfg/
├── app/
│   ├── api/          # API routes
│   ├── chat/         # Chat UI
│   └── login/        # Auth pages
├── components/       # React components
├── hooks/            # Custom hooks
├── lib/              # Utilities & commands
├── prisma/           # Database schema
└── docs/             # Documentation
    ├── ARCHITECTURE.md
    └── CHANGELOG.md
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed structure.

## Contributing

This is a private project. Collaborators:
- Rom (owner)
- Tom
- JMH (AI)
- Al (AI)

## License

Private — All rights reserved.
