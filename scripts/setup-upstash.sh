#!/bin/bash

# NODDO - Upstash Redis Setup
# This script helps configure Upstash Redis for rate limiting

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   NODDO - Upstash Redis Setup for Rate Limiting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we already have Upstash credentials in .env.local
if grep -q "UPSTASH_REDIS_REST_URL" .env.local 2>/dev/null; then
    echo "✓ Found Upstash credentials in .env.local"
    UPSTASH_URL=$(grep "UPSTASH_REDIS_REST_URL" .env.local | cut -d '=' -f2)
    UPSTASH_TOKEN=$(grep "UPSTASH_REDIS_REST_TOKEN" .env.local | cut -d '=' -f2)
else
    echo "No Upstash credentials found in .env.local"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Go to: https://console.upstash.com/"
    echo "2. Sign in (or create a free account)"
    echo "3. Click 'Create Database'"
    echo "4. Choose:"
    echo "   - Name: noddo-rate-limiting"
    echo "   - Type: Regional"
    echo "   - Region: Choose closest to your users"
    echo "   - TLS: Enabled"
    echo "5. Click 'Create'"
    echo ""
    echo "6. In the database dashboard, copy:"
    echo "   - UPSTASH_REDIS_REST_URL"
    echo "   - UPSTASH_REDIS_REST_TOKEN"
    echo ""
    read -p "Enter UPSTASH_REDIS_REST_URL: " UPSTASH_URL
    read -p "Enter UPSTASH_REDIS_REST_TOKEN: " UPSTASH_TOKEN

    # Add to .env.local
    echo "" >> .env.local
    echo "# Upstash Redis (rate limiting)" >> .env.local
    echo "UPSTASH_REDIS_REST_URL=$UPSTASH_URL" >> .env.local
    echo "UPSTASH_REDIS_REST_TOKEN=$UPSTASH_TOKEN" >> .env.local

    echo ""
    echo "✓ Credentials added to .env.local"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Configuring Vercel Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Vercel credentials from .env.local
VERCEL_TOKEN=$(grep "AUTH_BEARER_TOKEN" .env.local | cut -d '=' -f2)
VERCEL_PROJECT=$(grep "VERCEL_PROJECT_ID" .env.local | cut -d '=' -f2)

# Add UPSTASH_REDIS_REST_URL to Vercel
echo "Setting UPSTASH_REDIS_REST_URL..."
curl -s -X POST "https://api.vercel.com/v10/projects/$VERCEL_PROJECT/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"encrypted\",
    \"key\": \"UPSTASH_REDIS_REST_URL\",
    \"value\": \"$UPSTASH_URL\",
    \"target\": [\"production\", \"preview\", \"development\"]
  }" > /dev/null 2>&1 && echo "✓ UPSTASH_REDIS_REST_URL configured" || echo "⚠ UPSTASH_REDIS_REST_URL already exists or failed"

# Add UPSTASH_REDIS_REST_TOKEN to Vercel
echo "Setting UPSTASH_REDIS_REST_TOKEN..."
curl -s -X POST "https://api.vercel.com/v10/projects/$VERCEL_PROJECT/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"encrypted\",
    \"key\": \"UPSTASH_REDIS_REST_TOKEN\",
    \"value\": \"$UPSTASH_TOKEN\",
    \"target\": [\"production\", \"preview\", \"development\"]
  }" > /dev/null 2>&1 && echo "✓ UPSTASH_REDIS_REST_TOKEN configured" || echo "⚠ UPSTASH_REDIS_REST_TOKEN already exists or failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Rate limiting is now configured with Upstash Redis:"
echo ""
echo "• API endpoints: 100 req/10s per IP"
echo "• Auth endpoints: 5 req/min per IP"
echo "• Lead forms: 3 req/hour per IP"
echo "• File uploads: 20 req/min per user"
echo "• Email sending: 10 emails/hour per user"
echo ""
echo "Next steps:"
echo "1. Trigger a new deployment in Vercel (or wait for next push)"
echo "2. Rate limiting will be active automatically"
echo ""
echo "To monitor rate limiting:"
echo "https://console.upstash.com/"
echo ""
