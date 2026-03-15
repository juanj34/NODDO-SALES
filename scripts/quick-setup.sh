#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   NODDO Quick Setup - 3 Steps             ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: SENTRY (Error Monitoring)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: https://sentry.io/settings/projects/noddo/keys/"
echo "2. Copy your DSN"
echo ""
read -p "Paste DSN: " SENTRY_DSN

echo ""
read -p "Organization slug: " SENTRY_ORG
read -p "Project slug (noddo): " SENTRY_PROJECT
SENTRY_PROJECT=${SENTRY_PROJECT:-noddo}

echo ""
echo "3. Open: https://sentry.io/settings/account/api/auth-tokens/"
echo "4. Create token with: project:releases + org:read"
echo ""
read -p "Paste token: " SENTRY_TOKEN

echo ""
echo "⚙️  Setting Sentry env vars in Vercel..."
echo "$SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
echo "$SENTRY_ORG" | vercel env add SENTRY_ORG production
echo "$SENTRY_PROJECT" | vercel env add SENTRY_PROJECT production
echo "$SENTRY_TOKEN" | vercel env add SENTRY_AUTH_TOKEN production

echo "✅ Sentry configured!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: UPSTASH (Rate Limiting)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: https://console.upstash.com/"
echo "2. Create database (free tier)"
echo "3. Go to REST API tab"
echo ""
read -p "Paste UPSTASH_REDIS_REST_URL: " UPSTASH_URL
read -p "Paste UPSTASH_REDIS_REST_TOKEN: " UPSTASH_TOKEN

echo ""
echo "⚙️  Setting Upstash env vars in Vercel..."
echo "$UPSTASH_URL" | vercel env add UPSTASH_REDIS_REST_URL production
echo "$UPSTASH_TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN production

echo "✅ Upstash configured!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: REDEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Trigger redeploy now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ]; then
    echo "🚀 Deploying to production..."
    vercel --prod
    echo "✅ Deployment started!"
else
    echo "⚠️  Remember to redeploy manually"
fi

echo ""
echo "🎉 DONE! Check your Vercel dashboard"
echo ""
