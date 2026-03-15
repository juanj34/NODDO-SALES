# Vercel Token Scope Verification Guide

> **Purpose:** Verify that the Vercel API token has correct permissions for domain management
> **Required Scopes:** `domains:read`, `domains:write`
> **Last Updated:** 2026-03-15

---

## Why This Matters

NODDO uses the Vercel API to:
1. Add custom domains to the Vercel project
2. Remove old domains when changed
3. Check domain DNS configuration status
4. Verify domain SSL certificate status

**Without correct token scopes, custom domains will NOT work.**

---

## Environment Variables Required

```bash
# Vercel API token (must have domains:read + domains:write scopes)
AUTH_BEARER_TOKEN=YOUR_TOKEN_HERE

# Vercel project ID (found in Vercel dashboard)
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx

# Vercel team ID (optional - only if project belongs to a team)
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx
```

---

## How to Generate a Vercel Token

### Step 1: Go to Vercel Dashboard

Visit: https://vercel.com/account/tokens

### Step 2: Create New Token

1. Click "Create Token"
2. **Name:** `NODDO Domain Management`
3. **Scope:** Select your team (if applicable) or leave as personal
4. **Expiration:** Set to "No Expiration" or 1 year
5. Click "Create"

### Step 3: Copy Token

**⚠️ CRITICAL:** Copy the token immediately and store it securely. You won't be able to see it again.

### Step 4: Add to Environment Variables

**Vercel Project Settings:**
1. Go to https://vercel.com/your-team/noddo/settings/environment-variables
2. Add variable:
   - **Name:** `AUTH_BEARER_TOKEN`
   - **Value:** (paste token)
   - **Environment:** Production, Preview, Development
3. Click "Save"

**Local Development (.env.local):**
```bash
AUTH_BEARER_TOKEN=your_token_here
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx  # If using team
```

---

## Verification Steps

### Method 1: Quick API Test (Manual)

**Test 1: Get User Info**
```bash
curl https://api.vercel.com/v2/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "user": {
    "id": "xxx",
    "email": "your@email.com",
    "name": "Your Name",
    "username": "username",
    "avatar": "https://...",
    "createdAt": 1234567890
  }
}
```

**If this fails:**
- ❌ Token is invalid or expired
- ❌ Token format is wrong (should be `Bearer TOKEN`, not just `TOKEN`)

---

**Test 2: List Project Domains**
```bash
curl "https://api.vercel.com/v9/projects/YOUR_PROJECT_ID/domains?teamId=YOUR_TEAM_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Success Response:**
```json
{
  "domains": [
    {
      "name": "noddo.io",
      "verified": true,
      "gitBranch": null,
      "redirect": null,
      "redirectStatusCode": null
    }
  ],
  "pagination": {
    "count": 1,
    "next": null,
    "prev": null
  }
}
```

**If this fails with 403 Forbidden:**
- ❌ Token doesn't have `domains:read` scope
- ❌ Token doesn't belong to the team/account that owns the project
- ❌ `VERCEL_PROJECT_ID` is wrong

---

**Test 3: Add Test Domain**
```bash
curl -X POST "https://api.vercel.com/v10/projects/YOUR_PROJECT_ID/domains?teamId=YOUR_TEAM_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "test-domain-delete-me.com" }'
```

**Expected Success Response:**
```json
{
  "name": "test-domain-delete-me.com",
  "apexName": "test-domain-delete-me.com",
  "projectId": "prj_xxxxxxxxxxxxx",
  "verified": false,
  "createdAt": 1234567890,
  "gitBranch": null
}
```

**If this fails with 403 Forbidden:**
- ❌ Token doesn't have `domains:write` scope
- ❌ **This is the critical failure** — domains cannot be added

**If this succeeds, delete the test domain:**
```bash
curl -X DELETE "https://api.vercel.com/v9/projects/YOUR_PROJECT_ID/domains/test-domain-delete-me.com?teamId=YOUR_TEAM_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Method 2: Automated Verification Script

Create a script to test all endpoints:

**File:** `scripts/verify-vercel-token.ts`

```typescript
/**
 * Vercel Token Verification Script
 *
 * Usage:
 *   npx tsx scripts/verify-vercel-token.ts
 *
 * Or add to package.json:
 *   "scripts": { "verify:vercel": "tsx scripts/verify-vercel-token.ts" }
 *   npm run verify:vercel
 */

const TOKEN = process.env.AUTH_BEARER_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!TOKEN) {
  console.error("❌ AUTH_BEARER_TOKEN not found in environment");
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error("❌ VERCEL_PROJECT_ID not found in environment");
  process.exit(1);
}

const VERCEL_API = "https://api.vercel.com";
const teamParam = TEAM_ID ? `?teamId=${TEAM_ID}` : "";

function getHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function testUserInfo() {
  console.log("\n🔍 Test 1: Get User Info");
  try {
    const res = await fetch(`${VERCEL_API}/v2/user`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    console.log(`✅ Success: Logged in as ${data.user.email}`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testListDomains() {
  console.log("\n🔍 Test 2: List Project Domains (domains:read scope)");
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains${teamParam}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      if (res.status === 403) {
        console.error("❌ Failed: 403 Forbidden — Token lacks domains:read scope");
        return false;
      }
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    console.log(`✅ Success: Found ${data.domains.length} domain(s)`);
    if (data.domains.length > 0) {
      console.log(`   First domain: ${data.domains[0].name}`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testAddDomain() {
  console.log("\n🔍 Test 3: Add Test Domain (domains:write scope)");
  const testDomain = `test-${Date.now()}.example.com`;

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${PROJECT_ID}/domains${teamParam}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: testDomain }),
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        console.error("❌ Failed: 403 Forbidden — Token lacks domains:write scope");
        console.error("   Cannot add custom domains without this permission!");
        return false;
      }
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      const errorData = await res.json();
      console.error(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      return false;
    }

    console.log(`✅ Success: Added test domain ${testDomain}`);

    // Clean up — delete the test domain
    console.log(`   Cleaning up...`);
    const deleteRes = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains/${testDomain}${teamParam}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (deleteRes.ok) {
      console.log(`   ✅ Test domain deleted`);
    } else {
      console.warn(`   ⚠️ Could not delete test domain ${testDomain} — delete manually from Vercel dashboard`);
    }

    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testGetDomainConfig() {
  console.log("\n🔍 Test 4: Get Domain Config (for verification)");

  // Get first existing domain from project
  try {
    const listRes = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains${teamParam}`,
      { headers: getHeaders() }
    );

    if (!listRes.ok) {
      console.error("❌ Cannot list domains to test config endpoint");
      return false;
    }

    const listData = await listRes.json();
    if (listData.domains.length === 0) {
      console.log("⚠️ No domains found to test — skipping config test");
      return true; // Not a failure, just nothing to test
    }

    const testDomain = listData.domains[0].name;
    console.log(`   Testing with existing domain: ${testDomain}`);

    const configRes = await fetch(
      `${VERCEL_API}/v6/domains/${testDomain}/config${teamParam}`,
      { headers: getHeaders() }
    );

    if (!configRes.ok) {
      console.error(`❌ Failed: ${configRes.status} ${configRes.statusText}`);
      return false;
    }

    const configData = await configRes.json();
    console.log(`✅ Success: Retrieved config for ${testDomain}`);
    console.log(`   Misconfigured: ${configData.misconfigured}`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Vercel Token Verification");
  console.log("=====================================");
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Team ID: ${TEAM_ID || "(none - personal account)"}`);
  console.log(`Token: ${TOKEN.slice(0, 10)}...${TOKEN.slice(-4)}`);

  const results = {
    userInfo: await testUserInfo(),
    listDomains: await testListDomains(),
    addDomain: await testAddDomain(),
    getDomainConfig: await testGetDomainConfig(),
  };

  console.log("\n=====================================");
  console.log("📊 Results Summary");
  console.log("=====================================");
  console.log(`User Info:         ${results.userInfo ? "✅" : "❌"}`);
  console.log(`List Domains:      ${results.listDomains ? "✅" : "❌"}`);
  console.log(`Add Domain:        ${results.addDomain ? "✅" : "❌"}`);
  console.log(`Get Domain Config: ${results.getDomainConfig ? "✅" : "❌"}`);

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log("\n✅ All tests passed! Token has correct scopes.");
    console.log("   Custom domains will work correctly in production.");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed. See errors above.");
    console.log("\n🔧 Troubleshooting:");

    if (!results.userInfo) {
      console.log("   - Token is invalid or expired");
      console.log("   - Generate a new token at https://vercel.com/account/tokens");
    }

    if (!results.listDomains) {
      console.log("   - Token lacks domains:read scope");
      console.log("   - Verify VERCEL_PROJECT_ID is correct");
      console.log("   - Verify VERCEL_TEAM_ID matches the project owner");
    }

    if (!results.addDomain) {
      console.log("   - ⚠️ CRITICAL: Token lacks domains:write scope");
      console.log("   - Custom domains WILL NOT WORK in production");
      console.log("   - Generate a new token with full permissions");
    }

    console.log("\n💡 To fix:");
    console.log("   1. Go to https://vercel.com/account/tokens");
    console.log("   2. Delete the old token");
    console.log("   3. Create a new token (it will automatically have all scopes)");
    console.log("   4. Update AUTH_BEARER_TOKEN in Vercel environment variables");
    console.log("   5. Re-deploy and run this script again");

    process.exit(1);
  }
}

main();
```

---

**Add script to package.json:**

```json
{
  "scripts": {
    "verify:vercel": "tsx scripts/verify-vercel-token.ts"
  }
}
```

**Run verification:**
```bash
npm run verify:vercel
```

---

## Expected Output (Success)

```
🚀 Vercel Token Verification
=====================================
Project ID: prj_xxxxxxxxxxxxx
Team ID: team_xxxxxxxxxxxxx
Token: vercel_tok...xyz

🔍 Test 1: Get User Info
✅ Success: Logged in as your@email.com

🔍 Test 2: List Project Domains (domains:read scope)
✅ Success: Found 3 domain(s)
   First domain: noddo.io

🔍 Test 3: Add Test Domain (domains:write scope)
✅ Success: Added test domain test-1234567890.example.com
   Cleaning up...
   ✅ Test domain deleted

🔍 Test 4: Get Domain Config (for verification)
   Testing with existing domain: noddo.io
✅ Success: Retrieved config for noddo.io
   Misconfigured: false

=====================================
📊 Results Summary
=====================================
User Info:         ✅
List Domains:      ✅
Add Domain:        ✅
Get Domain Config: ✅

✅ All tests passed! Token has correct scopes.
   Custom domains will work correctly in production.
```

---

## Expected Output (Failure)

```
🚀 Vercel Token Verification
=====================================
Project ID: prj_xxxxxxxxxxxxx
Team ID: (none - personal account)
Token: vercel_tok...xyz

🔍 Test 1: Get User Info
✅ Success: Logged in as your@email.com

🔍 Test 2: List Project Domains (domains:read scope)
✅ Success: Found 3 domain(s)
   First domain: noddo.io

🔍 Test 3: Add Test Domain (domains:write scope)
❌ Failed: 403 Forbidden — Token lacks domains:write scope
   Cannot add custom domains without this permission!

🔍 Test 4: Get Domain Config (for verification)
   Testing with existing domain: noddo.io
✅ Success: Retrieved config for noddo.io
   Misconfigured: false

=====================================
📊 Results Summary
=====================================
User Info:         ✅
List Domains:      ✅
Add Domain:        ❌
Get Domain Config: ✅

❌ Some tests failed. See errors above.

🔧 Troubleshooting:
   - ⚠️ CRITICAL: Token lacks domains:write scope
   - Custom domains WILL NOT WORK in production
   - Generate a new token with full permissions

💡 To fix:
   1. Go to https://vercel.com/account/tokens
   2. Delete the old token
   3. Create a new token (it will automatically have all scopes)
   4. Update AUTH_BEARER_TOKEN in Vercel environment variables
   5. Re-deploy and run this script again
```

---

## Troubleshooting

### Issue 1: Token Has No Scopes

**Problem:** Vercel tokens created via dashboard used to allow selecting specific scopes. Now they automatically include all scopes.

**Solution:**
1. Delete old token
2. Create new token (will have all scopes by default)
3. Update environment variable

---

### Issue 2: Wrong Project ID

**Symptom:** 403 or 404 errors when listing domains

**Check:**
```bash
# List all your projects
curl https://api.vercel.com/v9/projects?teamId=YOUR_TEAM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Find correct Project ID:**
```json
{
  "projects": [
    {
      "id": "prj_xxxxxxxxxxxxx",
      "name": "noddo",
      ...
    }
  ]
}
```

---

### Issue 3: Wrong Team ID

**Symptom:** 403 errors, or domains added to wrong account

**Check:**
```bash
# Get your teams
curl https://api.vercel.com/v2/teams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "teams": [
    {
      "id": "team_xxxxxxxxxxxxx",
      "slug": "your-team-name",
      "name": "Your Team Name",
      ...
    }
  ]
}
```

**If project is personal (not team):**
- Omit `VERCEL_TEAM_ID` env var entirely
- Or set to empty string: `VERCEL_TEAM_ID=`

---

### Issue 4: Token Expired

**Symptom:** All API calls return 401

**Solution:**
1. Go to https://vercel.com/account/tokens
2. Check token expiration date
3. If expired, delete and create new token

---

## Production Deployment Checklist

Before deploying custom domain feature:

- [ ] Run verification script locally: `npm run verify:vercel`
- [ ] All tests pass (4/4 green checkmarks)
- [ ] `AUTH_BEARER_TOKEN` set in Vercel production environment
- [ ] `VERCEL_PROJECT_ID` set in Vercel production environment
- [ ] `VERCEL_TEAM_ID` set if using team (or omitted if personal)
- [ ] `NEXT_PUBLIC_ROOT_DOMAIN` set to `noddo.io`
- [ ] Token doesn't expire for at least 6 months
- [ ] Re-deploy after setting environment variables
- [ ] Test adding a real domain end-to-end

---

## Security Best Practices

### 1. Rotate Tokens Regularly

**Recommended:** Rotate every 6-12 months

**Process:**
1. Generate new token
2. Update environment variable in Vercel
3. Re-deploy
4. Verify with script
5. Delete old token

### 2. Limit Token Scope

**Current:** Full access token (all scopes)

**Future:** When Vercel supports granular scopes again, use minimal permissions:
- `domains:read` — Required for verification
- `domains:write` — Required for adding/removing

### 3. Never Commit Tokens to Git

**Bad:**
```bash
# .env.local (NEVER commit this file)
AUTH_BEARER_TOKEN=vercel_tok_abc123
```

**Good:**
```bash
# .env.example (safe to commit)
AUTH_BEARER_TOKEN=your_token_here
```

**Better:**
```bash
# .gitignore
.env.local
.env*.local
```

### 4. Store Token in Vercel Dashboard Only

**Don't:**
- ❌ Hardcode in source code
- ❌ Commit to git
- ❌ Share via Slack/email
- ❌ Store in plaintext files

**Do:**
- ✅ Store in Vercel environment variables
- ✅ Store in password manager (1Password, LastPass)
- ✅ Use `.env.local` for local development (gitignored)

---

## Summary

✅ **Verification script created**
✅ **Manual test commands provided**
✅ **Troubleshooting guide complete**
✅ **Security best practices documented**

**Next Steps:**
1. Create `scripts/verify-vercel-token.ts`
2. Run `npm run verify:vercel`
3. If tests fail, regenerate token with full scopes
4. Update `AUTH_BEARER_TOKEN` in Vercel dashboard
5. Re-deploy
6. Run verification again
7. Test custom domain end-to-end

**Critical:** Token MUST have `domains:write` scope or custom domains will NOT work.
