#!/bin/bash
source .env.local 2>/dev/null

echo "=== LFG Environment Variables Status ==="
echo ""

check_var() {
  local var_name=$1
  local var_value="${!var_name}"
  if [ -n "$var_value" ]; then
    local masked="${var_value:0:8}***${var_value: -4}"
    echo "✓ $var_name: $masked"
  else
    echo "✗ $var_name: NOT SET"
  fi
}

# Supabase
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"

echo ""
# Market Data APIs
check_var "COINGECKO_API_KEY"
check_var "FINNHUB_API_KEY"
check_var "FIRECRAWL_API_KEY"

echo ""
# Social APIs
check_var "X_BEARER_TOKEN"
check_var "REDDIT_CLIENT_ID"
check_var "REDDIT_CLIENT_SECRET"

echo ""
# Infrastructure
check_var "N8N_WEBHOOK_URL"
check_var "PUBLIC_ACCESS_TOKEN"
check_var "UPSTASH_REDIS_REST_URL"
check_var "UPSTASH_REDIS_REST_TOKEN"

echo ""
# LLM
check_var "OPENAI_API_KEY"
check_var "ANTHROPIC_API_KEY"

echo ""
echo "=== Database ==="
check_var "DATABASE_URL"
