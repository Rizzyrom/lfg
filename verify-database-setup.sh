#!/bin/bash
# Verify Database Setup Script
# This script checks that all required tables exist in the database

set -e

DB_URL="postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "=========================================="
echo "Database Setup Verification"
echo "=========================================="
echo ""

echo "1. Checking database connection..."
psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
    exit 1
fi
echo ""

echo "2. Checking table count..."
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations';")
echo "   Total tables: $TABLE_COUNT"
if [ "$TABLE_COUNT" -eq 19 ]; then
    echo "   ✅ Correct number of tables"
else
    echo "   ⚠️  Expected 19 tables, found $TABLE_COUNT"
fi
echo ""

echo "3. Checking required tables..."
REQUIRED_TABLES=(
    "User"
    "Session"
    "Invite"
    "Group"
    "Membership"
    "Message"
    "WatchItem"
    "PriceCache"
    "Notification"
    "Reaction"
    "PushSubscription"
    "TickerMention"
    "TweetSnapshot"
    "SystemEvent"
    "ChatContextSetting"
    "SocialFeedSource"
    "SocialFeedItem"
    "ChatAlert"
    "ChatPin"
)

MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    EXISTS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';")
    if [ "$EXISTS" -eq 1 ]; then
        echo "   ✅ $table"
    else
        echo "   ❌ $table (MISSING)"
        MISSING_TABLES+=("$table")
    fi
done
echo ""

echo "4. Checking SocialFeedItem table details..."
psql "$DB_URL" -c "\d \"SocialFeedItem\"" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ SocialFeedItem table exists with proper structure"
    psql "$DB_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'SocialFeedItem' ORDER BY ordinal_position;" | head -20
else
    echo "   ❌ SocialFeedItem table structure check failed"
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo "✅ All required tables are present!"
    echo "✅ Database setup is complete!"
else
    echo "❌ Missing tables: ${MISSING_TABLES[*]}"
    echo "Run the migrations in /Users/rom/lfg/supabase/migrations/"
fi
echo ""
echo "Next step: Set up Vercel environment variables"
echo "Run: ./setup-vercel-env.sh (after vercel login)"
