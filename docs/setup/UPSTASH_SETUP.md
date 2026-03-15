# Upstash Redis Setup - 2 Minutes

## What is Upstash?
Upstash is a serverless Redis database used for **rate limiting** in NODDO. It prevents abuse by limiting:
- API requests (100/10sec)
- Login attempts (5/min)
- Lead form spam (3/hour)
- Upload floods (20/min)
- Email spam (10/hour)

## Setup Steps

### Option A: Quick Setup (You Already Have Account)

If you already created an Upstash database:

1. **Get credentials** - Open https://console.upstash.com/
2. **Click on your database**
3. **Copy these two values:**
   - `REST URL` (looks like: `https://xxx-xxxxx.upstash.io`)
   - `REST TOKEN` (long string starting with A)

4. **Run this command** (paste your actual values):

```bash
# Add to .env.local
echo "" >> .env.local
echo "# Upstash Redis (rate limiting)" >> .env.local
echo "UPSTASH_REDIS_REST_URL=https://your-actual-url.upstash.io" >> .env.local
echo "UPSTASH_REDIS_REST_TOKEN=AYourActualToken" >> .env.local

# Set in Vercel (using existing credentials)
node scripts/sync-env-to-vercel.js
```

### Option B: Create New Database (2 Minutes)

1. **Visit:** https://console.upstash.com/
2. **Sign in** (or create free account - no credit card needed)
3. **Click:** "Create Database"
4. **Configure:**
   - Name: `noddo-rate-limiting`
   - Type: `Regional`
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Eviction: `No Eviction`
5. **Click:** "Create"
6. **Copy credentials** and run the command from Option A above

## Verification

After setup, rate limiting will activate automatically on next deployment. Test it:

```bash
# Should work fine
curl https://noddo.io/api/proyectos

# Run this 101 times in 10 seconds - should get rate limited
for i in {1..101}; do curl -s https://noddo.io/api/proyectos & done
```

## Free Tier Limits

Upstash free tier includes:
- 10,000 commands/day
- 256 MB storage
- TLS encryption
- REST API access

This is more than enough for NODDO. No credit card required.

## What Happens Without Upstash?

Rate limiting is **optional** - the app works fine without it:
- `src/lib/rate-limit.ts` checks if credentials exist
- If not found: rate limiting is disabled (logs show: "Rate limiting disabled - Upstash not configured")
- Production sites should enable it to prevent abuse

## Status Check

After configuration, check if it's working:

```bash
# Should show "Rate limiting: ENABLED"
curl https://noddo.io/api/health
```

## Need Help?

- Upstash Docs: https://docs.upstash.com/redis
- NODDO rate limiting code: `src/lib/rate-limit.ts`
