# Supabase & Vercel Setup Report

**Date:** 2025-01-22
**Database:** Neon PostgreSQL (via Supabase)
**Deployment:** Vercel

---

## Executive Summary

✅ **SocialFeedItem table created successfully**
✅ **All Prisma schema tables verified in database**
⚠️ **Vercel environment variables need manual setup** (CLI login required)

---

## 1. Database Tables Status

### ✅ All Tables Present (20 total)

All tables from the Prisma schema are now present in the database:

| Table Name | Status | Notes |
|------------|--------|-------|
| ChatAlert | ✅ Exists | Chat alerts for price/keyword monitoring |
| ChatContextSetting | ✅ Exists | Context settings per group |
| ChatPin | ✅ Exists | Pinned messages |
| Group | ✅ Exists | Core group table |
| Invite | ✅ Exists | Group invites |
| Membership | ✅ Exists | User-group memberships |
| Message | ✅ Exists | Chat messages |
| Notification | ✅ Exists | User notifications |
| PriceCache | ✅ Exists | Cached price data |
| PushSubscription | ✅ Exists | Web push subscriptions |
| Reaction | ✅ Exists | Message reactions |
| Session | ✅ Exists | User sessions |
| **SocialFeedItem** | ✅ **CREATED** | **Social media feed posts** |
| SocialFeedSource | ✅ Exists | Social media sources |
| SystemEvent | ✅ Exists | System event logs |
| TickerMention | ✅ Exists | Ticker mentions tracking |
| TweetSnapshot | ✅ Exists | Twitter snapshots |
| User | ✅ Exists | Core user table |
| WatchItem | ✅ Exists | User watchlist items |
| _prisma_migrations | ✅ Exists | Migration history |

### SocialFeedItem Table Details

The missing `SocialFeedItem` table has been created with the following structure:

```sql
CREATE TABLE "SocialFeedItem" (
  id TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "sourceId" TEXT,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  content TEXT NOT NULL,
  "postUrl" TEXT,
  "postId" TEXT NOT NULL,
  author TEXT,
  "publishedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
  "fetchedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "replyCount" INTEGER NOT NULL DEFAULT 0
);
```

**Indexes Created:**
- Primary key on `id`
- Unique constraint on `(platform, postId)` to prevent duplicates
- Index on `(groupId, publishedAt DESC)` for efficient group queries
- Index on `(sourceId, publishedAt DESC)` for source-based queries
- Index on `(platform, publishedAt DESC)` for platform filtering

**Foreign Keys:**
- `sourceId` references `SocialFeedSource(id)` ON DELETE SET NULL

---

## 2. Migration Files

### Existing Migrations

1. **`/Users/rom/lfg/supabase/migrations/20250117_chat_enhancements.sql`**
   - Creates: `system_event`, `chat_context_setting`, `social_feed_source`, `chat_alert`, `chat_pin`
   - Includes RLS policies (not applied in current Neon DB setup)

2. **`/Users/rom/lfg/supabase/migrations/20250122_social_feed_items.sql`**
   - Original migration for `social_feed_item` (snake_case naming)
   - Not applied (database uses PascalCase naming from Prisma)

### New Migration Created

3. **`/Users/rom/lfg/supabase/migrations/create_social_feed_item.sql`**
   - ✅ **APPLIED SUCCESSFULLY**
   - Creates `SocialFeedItem` table matching Prisma schema naming conventions
   - Includes all indexes and foreign key constraints

---

## 3. Vercel Environment Variables

### ⚠️ Status: Manual Setup Required

The Vercel CLI requires authentication. A setup script has been created at:
**`/Users/rom/lfg/setup-vercel-env.sh`**

### Required Environment Variables

#### 🔹 Database & Supabase (Ready to Set)

```bash
DATABASE_URL=postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SUPABASE_URL=https://yeecylvhgyfrhryqoojx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_znOwxpROinfgyTzqpxD6QA_O5Q-rbBx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_252RtwN6H54xYwIg8lm40w_HIqRLnhB
```

#### 🔹 Additional Required Variables (Need Values)

```bash
# Vercel Blob Storage (REQUIRED for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Next Auth (REQUIRED)
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-production-domain.vercel.app

# API Keys (Optional but recommended)
OPENAI_API_KEY=sk-...
FINNHUB_API_KEY=your_finnhub_key
COINGECKO_API_KEY=your_coingecko_key
TWITTER_BEARER_TOKEN=AAA...

# Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BD...
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# CORS (Optional)
ALLOWED_ORIGINS=https://your-production-domain.vercel.app

# App Name (Optional)
NEXT_PUBLIC_APP_NAME=LFG
```

### How to Set Vercel Environment Variables

1. **Login to Vercel CLI:**
   ```bash
   vercel login
   ```

2. **Run the setup script:**
   ```bash
   ./setup-vercel-env.sh
   ```

3. **Manually add remaining variables:**
   ```bash
   vercel env add BLOB_READ_WRITE_TOKEN production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_URL production
   # ... etc
   ```

---

## 4. Database Connection Details

### Neon Database (Primary)

```
Host: ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech
Database: neondb
User: neondb_owner
SSL Mode: require
Channel Binding: require
```

**Connection String:**
```
postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Supabase (Storage/Auth)

```
Project URL: https://yeecylvhgyfrhryqoojx.supabase.co
Publishable Key: sb_publishable_znOwxpROinfgyTzqpxD6QA_O5Q-rbBx
Secret Key: sb_secret_252RtwN6H54xYwIg8lm40w_HIqRLnhB
```

---

## 5. Next Steps

### Immediate Actions

1. ✅ **Database Tables** - Complete! All tables created.

2. ⚠️ **Vercel Environment Setup:**
   - Login to Vercel CLI: `vercel login`
   - Run setup script: `./setup-vercel-env.sh`
   - Add remaining environment variables manually

3. **Generate Missing Keys:**
   ```bash
   # NextAuth Secret
   openssl rand -base64 32

   # VAPID Keys (for push notifications)
   npx web-push generate-vapid-keys
   ```

4. **Get Vercel Blob Token:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage tab
   - Create new Blob store
   - Copy `BLOB_READ_WRITE_TOKEN`

### Optional Enhancements

1. **Row Level Security (RLS):**
   - Current setup doesn't use RLS
   - If needed, apply RLS policies from migration files

2. **API Keys:**
   - Sign up for [Finnhub](https://finnhub.io/) (market data)
   - Sign up for [CoinGecko](https://www.coingecko.com/en/api) (crypto data)
   - Get [OpenAI API key](https://platform.openai.com/) (AI features)

3. **Production Deployment:**
   ```bash
   vercel --prod
   ```

---

## 6. Verification Commands

### Check Database Tables
```bash
psql "postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -c "\dt"
```

### Check SocialFeedItem Table
```bash
psql "postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -c "\d \"SocialFeedItem\""
```

### List Vercel Environment Variables
```bash
vercel env ls
```

---

## 7. Troubleshooting

### Issue: Table Naming Mismatch
**Solution:** Database uses PascalCase (e.g., `SocialFeedItem`) to match Prisma schema, not snake_case (e.g., `social_feed_item`)

### Issue: Vercel CLI Authentication
**Solution:** Run `vercel login` and follow authentication flow

### Issue: Missing API Keys
**Solution:** Start with required keys (DATABASE_URL, BLOB_READ_WRITE_TOKEN, NEXTAUTH_SECRET) and add optional ones later

---

## 8. Files Created

1. **`/Users/rom/lfg/supabase/migrations/create_social_feed_item.sql`**
   - SQL migration for SocialFeedItem table
   - ✅ Applied successfully

2. **`/Users/rom/lfg/setup-vercel-env.sh`**
   - Automated script to set Vercel environment variables
   - ⚠️ Requires `vercel login` first

3. **`/Users/rom/lfg/SUPABASE_VERCEL_SETUP_REPORT.md`**
   - This comprehensive setup report

---

## Summary

✅ **Database Setup: COMPLETE**
- All 20 tables from Prisma schema exist
- SocialFeedItem table created with proper indexes and foreign keys

⚠️ **Vercel Setup: REQUIRES MANUAL ACTION**
- Environment variables need to be set via Vercel CLI
- Setup script created for automation
- Additional API keys needed for full functionality

🎯 **Ready to Deploy** once Vercel environment variables are configured!
