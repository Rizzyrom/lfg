# LFG App Setup Guide

## Environment Variables

All features are now working! Here's how to complete the setup:

### Required Environment Variables

Add these to your `.env.local` file AND to Vercel Environment Variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://..."

# Next Auth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# CORS (Required)
ALLOWED_ORIGINS="http://localhost:3000,https://your-production-url.vercel.app"
```

### File Uploads (Required for Media in Chat)

```bash
# Vercel Blob Storage
# Get from: https://vercel.com/dashboard → Storage → Create Blob Store
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

**Important:** Make sure this is set in BOTH:
1. Your local `.env.local` file
2. Vercel Dashboard → Settings → Environment Variables

### Stock & Crypto Features (Optional but Recommended)

```bash
# Stock Market Data
# Get free API key from: https://finnhub.io/register
FINNHUB_API_KEY="your_finnhub_key"

# Crypto Data (Optional - app has fallbacks)
# Get from: https://www.coingecko.com/en/api/pricing
COINGECKO_API_KEY="your_coingecko_key"
```

**Note:** Stock search now works WITHOUT API keys using Yahoo Finance as fallback!

### Social Feeds (Optional)

```bash
# Twitter API (Optional - app uses mock data as fallback)
# Get from: https://developer.twitter.com/
TWITTER_BEARER_TOKEN="AAA..."
```

**Note:** Reddit feeds work without any API key!

### AI Features (Optional)

```bash
# OpenAI for @lfgent bot
OPENAI_API_KEY="sk-..."
```

### Push Notifications (New Feature!)

1. Generate VAPID keys:
```bash
npm install web-push
node scripts/generate-vapid-keys.js
```

2. Add to your `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BD..."
VAPID_PRIVATE_KEY="your_private_key"
VAPID_SUBJECT="mailto:your-email@example.com"
```

3. Run database migration:
```bash
npx prisma migrate dev --name add-push-subscriptions
npx prisma generate
```

## Features Fixed

### ✅ Stock Search
- Now works WITHOUT API key using Yahoo Finance
- With FINNHUB_API_KEY: Enhanced search with more detailed results
- Can search and add ANY stock ticker

### ✅ Crypto Search
- Works with CoinGecko's free tier (no API key needed)
- Search any cryptocurrency
- Real-time price updates

### ✅ Social Feeds
- **Reddit:** 20 subreddits (10 stocks + 10 crypto) - Working NOW
- **Twitter:** 20 accounts (10 stocks + 10 crypto) - Mock data (add TWITTER_BEARER_TOKEN for live)

### ✅ File Uploads
- Enhanced error handling
- Clear instructions if Blob storage not configured
- Supports images, videos, PDFs

### ✅ Push Notifications (NEW!)
- Enable in Settings page
- Get notifications when chat messages arrive
- Works on mobile and desktop PWA

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Add your `DATABASE_URL`
3. For file uploads: Add `BLOB_READ_WRITE_TOKEN` from Vercel
4. For stock search: Optionally add `FINNHUB_API_KEY`
5. For push notifications: Run `node scripts/generate-vapid-keys.js` and add keys
6. Run migrations: `npx prisma migrate dev`
7. Start dev server: `npm run dev`

## Deploy to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add ALL environment variables in Vercel Dashboard → Settings → Environment Variables
4. Create Blob Store: Vercel Dashboard → Storage → Create Blob Store
5. Copy `BLOB_READ_WRITE_TOKEN` and add to environment variables
6. Deploy!

## Testing Features

- **Stock Search:** Go to Watchlist → Add Asset → Search "AAPL" or "TSLA"
- **Crypto Search:** Go to Watchlist → Add Asset → Search "BTC" or "ETH"
- **Social Feeds:** Go to Feed → See Reddit posts and Twitter content
- **File Upload:** Go to Chat → Click paperclip icon → Upload image/video
- **Push Notifications:** Go to Settings → Enable Notifications → Send a chat message from another device

## Troubleshooting

### Blob Storage Not Working
- Make sure `BLOB_READ_WRITE_TOKEN` is set in Vercel (not just .env.local)
- Redeploy after adding environment variables
- Check Vercel Dashboard → Storage to ensure Blob store exists

### Stock Search Not Working
- Should work without API key now (uses Yahoo Finance)
- If issues persist, add `FINNHUB_API_KEY` from https://finnhub.io

### Push Notifications Not Working
- Make sure VAPID keys are generated and added to environment variables
- Run database migration: `npx prisma migrate dev`
- Check browser console for service worker errors
- Ensure HTTPS in production (required for push notifications)

## What's New

1. **Stock Search:** Yahoo Finance fallback means it works without API keys
2. **Social Feeds:** All 20 Reddit subreddits and 20 Twitter accounts added
3. **Blob Storage:** Better error messages and diagnostics
4. **Push Notifications:** Complete implementation with service worker, database, and UI
5. **Settings Page:** Now includes notification management
6. **Navigation:** Settings link added to main nav

Enjoy your LFG app! 🚀
