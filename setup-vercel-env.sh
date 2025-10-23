#!/bin/bash
# Setup Vercel Environment Variables
# Run this script after logging into Vercel CLI with: vercel login

set -e

echo "Setting up Vercel environment variables for production..."

# Database URL
vercel env add DATABASE_URL production <<EOF
postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
EOF

# Supabase URL (if using Supabase for storage/auth)
vercel env add SUPABASE_URL production <<EOF
https://yeecylvhgyfrhryqoojx.supabase.co
EOF

# Supabase Publishable Key
vercel env add SUPABASE_ANON_KEY production <<EOF
sb_publishable_znOwxpROinfgyTzqpxD6QA_O5Q-rbBx
EOF

# Supabase Service Role Key (for server-side operations)
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<EOF
sb_secret_252RtwN6H54xYwIg8lm40w_HIqRLnhB
EOF

echo "✓ Database and Supabase environment variables set!"
echo ""
echo "IMPORTANT: You still need to manually add these environment variables:"
echo "  - BLOB_READ_WRITE_TOKEN (from Vercel Blob Storage)"
echo "  - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "  - NEXTAUTH_URL (your production URL)"
echo "  - OPENAI_API_KEY (if using AI features)"
echo "  - FINNHUB_API_KEY (for market data)"
echo "  - COINGECKO_API_KEY (for crypto data)"
echo "  - NEXT_PUBLIC_VAPID_PUBLIC_KEY (for push notifications)"
echo "  - VAPID_PRIVATE_KEY (for push notifications)"
echo "  - VAPID_SUBJECT (mailto:your-email@example.com)"
echo ""
echo "To add these manually:"
echo "  vercel env add VARIABLE_NAME production"
