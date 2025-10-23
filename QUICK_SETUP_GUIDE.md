# LFG - Quick Setup Guide

## Database Setup ✅ COMPLETE

All 19 required tables exist in the Neon PostgreSQL database, including the newly created `SocialFeedItem` table.

### Verify Database
```bash
./verify-database-setup.sh
```

---

## Vercel Environment Setup ⚠️ ACTION REQUIRED

### Step 1: Login to Vercel
```bash
vercel login
```

### Step 2: Link Your Project (if not already linked)
```bash
cd /Users/rom/lfg
vercel link
```

### Step 3: Run Automated Setup Script
```bash
./setup-vercel-env.sh
```

This will set:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Add Required Environment Variables Manually

#### A. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Then set it:
```bash
vercel env add NEXTAUTH_SECRET production
# Paste the generated secret when prompted
```

#### B. Set NextAuth URL
```bash
vercel env add NEXTAUTH_URL production
# Enter: https://your-domain.vercel.app
```

#### C. Get Vercel Blob Token
1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database** → **Blob**
3. Copy the `BLOB_READ_WRITE_TOKEN`

```bash
vercel env add BLOB_READ_WRITE_TOKEN production
# Paste the token when prompted
```

### Step 5: Optional API Keys (Add as needed)

#### OpenAI (for AI features)
```bash
vercel env add OPENAI_API_KEY production
```

#### Finnhub (for stock market data)
```bash
vercel env add FINNHUB_API_KEY production
```

#### CoinGecko (for crypto data)
```bash
vercel env add COINGECKO_API_KEY production
```

#### Push Notifications
Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Then set them:
```bash
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
# For VAPID_SUBJECT, enter: mailto:your-email@example.com
```

---

## Deploy to Production

### Option 1: Auto-deploy from Git
Push to your main branch, and Vercel will auto-deploy.

### Option 2: Manual Deploy
```bash
vercel --prod
```

---

## Verify Deployment

### Check Environment Variables
```bash
vercel env ls
```

### Check Production Logs
```bash
vercel logs --prod
```

---

## Database Credentials Reference

### Neon PostgreSQL
```
DATABASE_URL=postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Supabase
```
URL: https://yeecylvhgyfrhryqoojx.supabase.co
Publishable Key: sb_publishable_znOwxpROinfgyTzqpxD6QA_O5Q-rbBx
Secret Key: sb_secret_252RtwN6H54xYwIg8lm40w_HIqRLnhB
```

---

## Troubleshooting

### "No existing credentials found" error
Run: `vercel login`

### Tables not found
Run: `./verify-database-setup.sh` to check database status

### Environment variables not working
Make sure to add them for the correct environment:
- `production` - for live site
- `preview` - for preview deployments
- `development` - for local development

Example:
```bash
vercel env add VARIABLE_NAME production preview
```

### Database migration needed
Check migration files in:
```
/Users/rom/lfg/supabase/migrations/
```

Run with psql:
```bash
psql "$DATABASE_URL" -f /Users/rom/lfg/supabase/migrations/MIGRATION_FILE.sql
```

---

## Files Created

| File | Purpose |
|------|---------|
| `/Users/rom/lfg/SUPABASE_VERCEL_SETUP_REPORT.md` | Detailed setup report |
| `/Users/rom/lfg/QUICK_SETUP_GUIDE.md` | This quick reference |
| `/Users/rom/lfg/setup-vercel-env.sh` | Automated Vercel env setup |
| `/Users/rom/lfg/verify-database-setup.sh` | Database verification script |
| `/Users/rom/lfg/supabase/migrations/create_social_feed_item.sql` | SocialFeedItem table migration |
| `/Users/rom/lfg/supabase/EMERGENCY_RECREATE_SOCIAL_FEED_ITEM.sql` | Emergency recreation script |

---

## Quick Commands

```bash
# Verify database
./verify-database-setup.sh

# Setup Vercel environment
vercel login
./setup-vercel-env.sh

# Deploy to production
vercel --prod

# View environment variables
vercel env ls

# View production logs
vercel logs --prod
```

---

## Status Summary

✅ **Database**: All 19 tables created and verified
⚠️ **Vercel**: Environment variables need manual setup
🎯 **Next**: Run `./setup-vercel-env.sh` after `vercel login`
