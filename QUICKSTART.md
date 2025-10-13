# LFG - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies

```bash
cd lfg
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Minimum required for local dev:
DATABASE_URL="postgresql://user:pass@host/db"
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"
ALLOWED_ORIGINS="http://localhost:3000"
```

### 3. Initialize Database

```bash
npx prisma migrate dev --name init
```

### 4. Create Admin & Invite

```bash
pnpm seed
```

**Copy the invite token** shown in the output - you'll need it to sign up!

### 5. Start the App

```bash
pnpm dev
```

Visit http://localhost:3000

### 6. Sign Up

1. Click "Have an invite? Sign up"
2. Paste the invite token from step 4
3. Create your username and password
4. Start using LFG!

---

## Optional: WebSocket Chat

To enable real-time chat:

```bash
# In a separate terminal
pnpm ws
```

---

## Optional: AI Pulse

Add to `.env.local`:

```env
ANTHROPIC_API_KEY="sk-ant-..."
# OR
OPENAI_API_KEY="sk-..."
```

Restart server to activate AI Pulse feature.

---

## Next Steps

- **Add Symbols**: Go to Watchlist tab → Add crypto/equity symbols
- **Refresh Prices**: Click "Refresh" button (requires n8n webhook)
- **Invite Friends**: Admin users can generate invites via `/api/invites/create`

---

## Troubleshooting

**"Prisma Client not found"**
```bash
npx prisma generate
```

**"Connection refused" on WebSocket**
- Make sure `pnpm ws` is running
- Check that you're logged in (session cookie required)

**n8n webhook not working**
- Verify `N8N_WEBHOOK_URL` in `.env.local`
- Ensure n8n workflow is active

---

## Production Deploy

See [README.md](./README.md) for full deployment instructions to Vercel, Render, etc.
