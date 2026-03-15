# Custom Domains End-to-End Testing Guide

> **System:** Custom Domain Configuration for Project Microsites
> **Status:** ✅ Fully Implemented | ⚠️ Needs E2E Production Testing
> **Last Updated:** 2026-03-15

---

## Overview

NODDO allows project owners to point custom domains (e.g., `proyecto.example.com` or `example.com`) to their microsites. The system integrates with Vercel's domain API for automatic DNS verification and SSL certificate provisioning.

**Supported Configurations:**
- ✅ Subdomain routing (e.g., `alto-de-yeguas.noddo.io`) — built-in, always works
- ✅ Custom domain routing (e.g., `proyecto.constructora.com`) — requires DNS setup

---

## Architecture Overview

```
User edits project → API saves domain → Vercel API adds domain → User configures DNS
                                                                         ↓
Middleware checks hostname → Resolves custom domain to slug → Rewrites to /sites/[slug]
```

### Files Involved

| File | Purpose |
|------|---------|
| [src/app/api/domains/route.ts](../src/app/api/domains/route.ts) | PUT: Set/update custom domain |
| [src/app/api/domains/check/route.ts](../src/app/api/domains/check/route.ts) | GET: Check subdomain availability |
| [src/app/api/domains/verify/route.ts](../src/app/api/domains/verify/route.ts) | POST: Verify DNS configuration |
| [src/lib/vercel.ts](../src/lib/vercel.ts) | Vercel API integration (add/remove/verify) |
| [src/lib/domains.ts](../src/lib/domains.ts) | Domain parsing + slug resolution |
| [src/middleware.ts](../src/middleware.ts) | Custom domain routing logic |

### Database Schema

```sql
-- proyectos table
CREATE TABLE proyectos (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  estado TEXT CHECK (estado IN ('borrador', 'publicado'))
  ...
);
```

**Key columns:**
- `slug` — Project identifier for URLs (e.g., `alto-de-yeguas`)
- `subdomain` — Optional custom subdomain (e.g., `alto-de-yeguas` → `alto-de-yeguas.noddo.io`)
- `custom_domain` — Optional custom domain (e.g., `proyecto.constructora.com`)
- `domain_verified` — `true` if DNS is configured correctly and verified
- `estado` — Only `publicado` projects are accessible via custom domains

---

## Complete Flow

### 1. Check Subdomain Availability

**Endpoint:** `GET /api/domains/check?subdomain=alto-de-yeguas`

**Logic:**
- Cleans subdomain: lowercase, alphanumeric + hyphens only
- Checks against both `slug` and `subdomain` columns (must be unique across both)

**Response:**
```json
{ "available": true }
```

**Test:**
```bash
curl "https://noddo.io/api/domains/check?subdomain=alto-de-yeguas" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Set Custom Domain

**Endpoint:** `PUT /api/domains`

**Auth:** Requires project owner (admin)

**Body:**
```json
{
  "proyecto_id": "uuid",
  "subdomain": "alto-de-yeguas",        // Optional
  "custom_domain": "proyecto.example.com"  // Optional (null to remove)
}
```

**Logic:**
1. ✅ Verify user owns the project
2. ✅ Validate domain format (regex: `^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$`)
3. ✅ Check uniqueness (no other project using this domain)
4. ✅ Save to DB with `domain_verified = false`
5. ✅ Call Vercel API:
   - Remove old domain if changed: `removeDomainFromVercel(oldDomain)`
   - Add new domain: `addDomainToVercel(newDomain)`
6. ✅ Return updated project

**Vercel API Call:**
```http
POST https://api.vercel.com/v10/projects/{PROJECT_ID}/domains?teamId={TEAM_ID}
Authorization: Bearer {AUTH_BEARER_TOKEN}
Content-Type: application/json

{ "name": "proyecto.example.com" }
```

**Environment Variables Required:**
- `AUTH_BEARER_TOKEN` — Vercel API token with `domains:write` scope
- `VERCEL_PROJECT_ID` — Vercel project ID
- `VERCEL_TEAM_ID` — (Optional) Vercel team ID

**Test:**
```bash
curl -X PUT https://noddo.io/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proyecto_id": "uuid",
    "custom_domain": "proyecto.example.com"
  }'
```

---

### 3. User Configures DNS

**After adding domain via API, user must configure DNS:**

**Option A: CNAME (Recommended for subdomains)**
```
Type:  CNAME
Name:  proyecto (or @)
Value: cname.vercel-dns.com
TTL:   Auto or 3600
```

**Option B: A Record**
```
Type:  A
Name:  @ (or proyecto)
Value: 76.76.21.21
TTL:   Auto or 3600
```

**Wait for DNS propagation:** 5 minutes to 48 hours (typically < 1 hour)

**Check DNS propagation:**
```bash
# Check CNAME
dig proyecto.example.com CNAME +short

# Check A record
dig proyecto.example.com A +short

# Check from multiple locations
https://dnschecker.org/#CNAME/proyecto.example.com
```

---

### 4. Verify Domain

**Endpoint:** `POST /api/domains/verify`

**Auth:** Requires project owner (admin)

**Body:**
```json
{
  "proyecto_id": "uuid"
}
```

**Logic:**
1. ✅ Fetch project + custom_domain from DB
2. ✅ Call Vercel API: `getDomainConfig(domain)`
3. ✅ Check `config.misconfigured`:
   - `false` → DNS configured correctly → set `domain_verified = true`
   - `true` → DNS not ready → return error message
4. ✅ Return verification status

**Vercel API Call:**
```http
GET https://api.vercel.com/v6/domains/proyecto.example.com/config?teamId={TEAM_ID}
Authorization: Bearer {AUTH_BEARER_TOKEN}
```

**Response (Success):**
```json
{
  "verified": true,
  "message": "Dominio verificado correctamente"
}
```

**Response (Pending):**
```json
{
  "verified": false,
  "message": "DNS aún no propagado. Intenta de nuevo en unos minutos.",
  "config": {
    "misconfigured": true,
    "acceptedChallenges": ["dns-01"],
    ...
  }
}
```

**Test:**
```bash
curl -X POST https://noddo.io/api/domains/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "proyecto_id": "uuid" }'
```

---

### 5. Routing (Middleware)

**File:** [src/middleware.ts](../src/middleware.ts)

**Logic:**
1. Extract hostname from request: `request.headers.get("host")`
2. Parse domain type via `parseDomain(hostname)`:
   - `localhost` or `noddo.io` → `type: "platform"` (landing page + dashboard)
   - `proyecto.noddo.io` → `type: "subdomain"`, `slug: "proyecto"`
   - `proyecto.example.com` → `type: "custom_domain"`, `domain: "proyecto.example.com"`
3. If `custom_domain`:
   - Query DB: `SELECT slug FROM proyectos WHERE custom_domain = 'proyecto.example.com' AND domain_verified = true AND estado = 'publicado'`
   - If not found → redirect to platform root
4. Rewrite path: `/galeria` → `/sites/[slug]/galeria`
5. Set header `x-site-base-path: ""` (so links don't include `/sites/[slug]`)

**Domain Resolution Query:**
```sql
-- Only return slug if domain is verified AND project is published
SELECT slug FROM proyectos
WHERE custom_domain = 'proyecto.example.com'
  AND domain_verified = true
  AND estado = 'publicado'
LIMIT 1;
```

**Test:**
```bash
# Test routing
curl -H "Host: proyecto.example.com" http://localhost:3000/

# Should rewrite to /sites/[slug]/ internally
```

---

## End-to-End Testing Scenarios

### Scenario 1: Set Up Custom Domain (Happy Path)

**Prerequisites:**
- Project exists with slug `alto-de-yeguas`
- User has a domain `proyectodemo.com` they control
- Vercel API credentials configured

**Steps:**

1. **Check subdomain availability** (optional):
   ```bash
   curl "https://noddo.io/api/domains/check?subdomain=alto-de-yeguas" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   **Expected:** `{ "available": false }` (already in use by this project)

2. **Set custom domain:**
   ```bash
   curl -X PUT https://noddo.io/api/domains \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "proyecto_id": "PROJECT_UUID",
       "custom_domain": "proyectodemo.com"
     }'
   ```
   **Expected:**
   - ✅ Returns project object with `custom_domain: "proyectodemo.com"`, `domain_verified: false`
   - ✅ Vercel API logs show domain added

3. **Check Vercel dashboard:**
   - Go to https://vercel.com/your-team/noddo/settings/domains
   - **Expected:** `proyectodemo.com` appears in domains list with status "DNS pending"

4. **Configure DNS:**
   - Go to domain registrar (GoDaddy, Namecheap, etc.)
   - Add CNAME record:
     ```
     Type:  CNAME
     Name:  @
     Value: cname.vercel-dns.com
     ```
   - Wait 5-10 minutes for propagation

5. **Check DNS propagation:**
   ```bash
   dig proyectodemo.com CNAME +short
   # Expected: cname.vercel-dns.com
   ```

6. **Verify domain:**
   ```bash
   curl -X POST https://noddo.io/api/domains/verify \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{ "proyecto_id": "PROJECT_UUID" }'
   ```
   **Expected (first try, DNS not ready):**
   ```json
   {
     "verified": false,
     "message": "DNS aún no propagado. Intenta de nuevo en unos minutos."
   }
   ```

7. **Wait 15-30 minutes, retry verification:**
   ```bash
   # Same curl command as step 6
   ```
   **Expected (DNS ready):**
   ```json
   {
     "verified": true,
     "message": "Dominio verificado correctamente"
   }
   ```

8. **Check DB:**
   ```sql
   SELECT custom_domain, domain_verified FROM proyectos WHERE id = 'PROJECT_UUID';
   ```
   **Expected:** `{ custom_domain: "proyectodemo.com", domain_verified: true }`

9. **Test routing:**
   ```bash
   curl -I https://proyectodemo.com/
   ```
   **Expected:**
   - ✅ Status 200
   - ✅ Returns microsite HTML (not 404)
   - ✅ SSL certificate valid (Vercel auto-provisions)

10. **Check Vercel dashboard:**
    - Domain status should be "Valid" with green checkmark
    - SSL certificate should show "Active"

---

### Scenario 2: Change Custom Domain

**Test changing from one domain to another:**

1. **Project currently using `old-domain.com`** (verified)

2. **Update to `new-domain.com`:**
   ```bash
   curl -X PUT https://noddo.io/api/domains \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "proyecto_id": "PROJECT_UUID",
       "custom_domain": "new-domain.com"
     }'
   ```

3. **Expected:**
   - ✅ `old-domain.com` removed from Vercel
   - ✅ `new-domain.com` added to Vercel
   - ✅ `domain_verified = false` (needs re-verification)
   - ✅ Old domain stops routing to project
   - ✅ New domain pending DNS setup

4. **Configure DNS for new-domain.com**

5. **Verify new-domain.com**

6. **Test:**
   - ✅ `https://new-domain.com/` works
   - ✅ `https://old-domain.com/` returns 404 or redirects to platform

---

### Scenario 3: Remove Custom Domain

**Test removing custom domain:**

1. **Set custom_domain to null:**
   ```bash
   curl -X PUT https://noddo.io/api/domains \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "proyecto_id": "PROJECT_UUID",
       "custom_domain": null
     }'
   ```

2. **Expected:**
   - ✅ `custom_domain = null`, `domain_verified = false` in DB
   - ✅ Domain removed from Vercel
   - ✅ Project still accessible via subdomain (`proyecto.noddo.io`)
   - ✅ Custom domain stops working

---

### Scenario 4: Domain Already In Use

**Test uniqueness validation:**

1. **Project A using `example.com`**

2. **Try to assign `example.com` to Project B:**
   ```bash
   curl -X PUT https://noddo.io/api/domains \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "proyecto_id": "PROJECT_B_UUID",
       "custom_domain": "example.com"
     }'
   ```

3. **Expected:**
   - ✅ Status 409 Conflict
   - ✅ Error: `"Este dominio ya está en uso"`

---

### Scenario 5: Invalid Domain Format

**Test validation:**

1. **Try invalid domain:**
   ```bash
   curl -X PUT https://noddo.io/api/domains \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "proyecto_id": "PROJECT_UUID",
       "custom_domain": "not a valid domain!"
     }'
   ```

2. **Expected:**
   - ✅ Status 400 Bad Request
   - ✅ Error: `"Formato de dominio inválido"`

**Valid formats:**
- ✅ `example.com`
- ✅ `proyecto.example.com`
- ✅ `www.example.com`
- ❌ `example` (missing TLD)
- ❌ `example.` (trailing dot)
- ❌ `http://example.com` (includes protocol)
- ❌ `-example.com` (starts with hyphen)

---

### Scenario 6: Unpublished Project

**Test that unpublished projects don't route:**

1. **Set custom domain for project**
2. **Verify DNS**
3. **Set project estado to `borrador`:**
   ```sql
   UPDATE proyectos SET estado = 'borrador' WHERE id = 'PROJECT_UUID';
   ```

4. **Test routing:**
   ```bash
   curl -I https://example.com/
   ```

5. **Expected:**
   - ✅ Redirects to platform root (NOT 404)
   - ✅ Does NOT show microsite content

**Why:** `resolveCustomDomainToSlug()` only returns slug if `estado = 'publicado'`

---

## Production Checklist

Before enabling custom domains for real customers:

### Environment Variables

- [ ] `AUTH_BEARER_TOKEN` set (Vercel API token)
- [ ] `VERCEL_PROJECT_ID` set
- [ ] `VERCEL_TEAM_ID` set (if using Vercel team)
- [ ] `NEXT_PUBLIC_ROOT_DOMAIN` set to `noddo.io` (NOT `localhost:3000`)

### Vercel Token Permissions

- [ ] Token has `domains:write` scope
- [ ] Token has `domains:read` scope
- [ ] Token belongs to correct team/account
- [ ] Token hasn't expired

**Check token scopes:**
```bash
curl https://api.vercel.com/v2/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database

- [ ] `proyectos.custom_domain` column exists
- [ ] `proyectos.domain_verified` column exists
- [ ] Unique constraint on `custom_domain`
- [ ] Index on `custom_domain` for fast lookups

### DNS Records

- [ ] Root domain (`noddo.io`) has A/CNAME to Vercel
- [ ] Wildcard subdomain (`*.noddo.io`) configured if using subdomains

### API Endpoints

- [ ] PUT `/api/domains` requires auth
- [ ] PUT `/api/domains` requires admin role
- [ ] POST `/api/domains/verify` requires auth
- [ ] POST `/api/domains/verify` requires admin role
- [ ] GET `/api/domains/check` requires auth

### Middleware

- [ ] `parseDomain()` correctly identifies custom domains
- [ ] `resolveCustomDomainToSlug()` queries with `domain_verified = true`
- [ ] Routing only works for `estado = 'publicado'`
- [ ] Unknown domains redirect to platform (not 404)

### Error Handling

- [ ] Vercel API errors are non-blocking (domain still saved to DB)
- [ ] Graceful fallback if Vercel API is down
- [ ] User sees helpful error messages

---

## Monitoring & Debugging

### Check Domain Status in DB

```sql
SELECT
  nombre,
  subdomain,
  custom_domain,
  domain_verified,
  estado,
  created_at
FROM proyectos
WHERE custom_domain IS NOT NULL
ORDER BY created_at DESC;
```

### Check Vercel Domains

```bash
# List all domains for project
curl "https://api.vercel.com/v9/projects/{PROJECT_ID}/domains?teamId={TEAM_ID}" \
  -H "Authorization: Bearer {TOKEN}"
```

### Check DNS from Server

```bash
# On production server
dig example.com CNAME +short
dig example.com A +short

# Check from multiple locations
https://dnschecker.org/#CNAME/example.com
```

### Test Routing Locally

```bash
# Add to /etc/hosts
127.0.0.1 proyectodemo.com

# Test with curl
curl -H "Host: proyectodemo.com" http://localhost:3000/
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Domain not routing | `domain_verified = false` | Run verification endpoint |
| Domain not routing | `estado = 'borrador'` | Publish project |
| Verification fails | DNS not propagated | Wait 15-30 min, retry |
| Verification fails | Wrong CNAME value | Update DNS to `cname.vercel-dns.com` |
| Vercel API error | Missing token | Set `AUTH_BEARER_TOKEN` env var |
| Vercel API error | Wrong token scopes | Generate new token with `domains:write` |
| SSL not working | Vercel provisioning | Wait 5-10 min after verification |
| Routing to wrong project | Duplicate custom_domain in DB | Check uniqueness constraint |

---

## Performance Considerations

### Middleware Domain Resolution

**Current:** Direct REST API call to Supabase on every request

**Performance:**
- Query is fast (~10-20ms) thanks to unique index on `custom_domain`
- No database connection overhead (uses REST API)
- Runs on Vercel Edge network (low latency)

**Optimization (if needed):**

**Option A: Vercel Edge Config**
```typescript
// Cache domain mappings in Edge Config
const domainMap = await get<Record<string, string>>('domain-to-slug');
const slug = domainMap[hostname];
```

**Option B: Redis Cache**
```typescript
// Cache for 5 minutes
const cacheKey = `domain:${hostname}`;
let slug = await redis.get(cacheKey);
if (!slug) {
  slug = await resolveCustomDomainToSlug(hostname);
  await redis.set(cacheKey, slug, 'EX', 300);
}
```

**Not needed right now** — Supabase REST query is fast enough for current scale.

---

## Success Metrics

**Track these KPIs:**

| Metric | Formula | Target |
|--------|---------|--------|
| **Domain Setup Success Rate** | Verified / Added | 90%+ |
| **Avg Time to Verification** | Verify timestamp - Add timestamp | < 24h |
| **DNS Propagation Time (median)** | Time until first successful verification | < 1h |
| **Custom Domain Adoption** | Projects with verified custom domain / Total projects | 30%+ |

---

## Quick Reference: API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/domains/check?subdomain=xxx` | GET | Required | Check if subdomain is available |
| `/api/domains` | PUT | Admin | Set/update/remove custom domain |
| `/api/domains/verify` | POST | Admin | Verify DNS configuration |

---

## Summary

✅ **Custom domain system fully implemented**
✅ **Subdomain routing works out of the box**
✅ **Vercel API integration complete**
✅ **Middleware routing handles custom domains**
✅ **DNS verification automated**
⚠️ **Needs E2E testing with real domain**
⚠️ **Verify Vercel token has correct scopes**
⚠️ **Test SSL certificate provisioning**

**Next Steps:**
1. Verify `AUTH_BEARER_TOKEN` has `domains:write` scope
2. Test with a real domain end-to-end
3. Document DNS setup instructions for users
4. Add domain management UI to editor (if not already exists)
5. Monitor verification success rate
