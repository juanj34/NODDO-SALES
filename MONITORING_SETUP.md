# Production Monitoring Setup Guide

This guide covers setting up comprehensive monitoring for NODDO platform.

## 📊 Uptime Monitoring (BetterStack)

### Why BetterStack?
- **Free tier:** 10 monitors, 3-minute checks
- **Smart alerting:** Phone, SMS, Slack, email
- **Status pages:** Public uptime page for customers
- **Incident management:** Built-in

### Setup (5 minutes)

1. **Create Account**
   - Go to https://betterstack.com/uptime
   - Sign up with GitHub (free)

2. **Add Monitors**
   
   **Main Site:**
   ```
   Name: NODDO Website
   URL: https://noddo.io
   Method: GET
   Expected: 200
   Check interval: 1 minute
   Regions: Multiple (US, EU, Asia)
   Alert on: 2 consecutive failures
   ```

   **Dashboard:**
   ```
   Name: NODDO Dashboard
   URL: https://noddo.io/dashboard
   Method: GET
   Expected: 200 (redirects to login if not authenticated)
   Check interval: 3 minutes
   ```

   **API Health:**
   ```
   Name: NODDO API
   URL: https://noddo.io/api/health
   Method: GET
   Expected: 200
   Check interval: 1 minute
   ```

3. **Configure Alerts**
   - Add your email
   - Add your phone for critical alerts
   - Connect Slack workspace (optional)
   - Set escalation policy (alert after 2 failed checks)

4. **Create Status Page**
   - Enable public status page
   - Customize domain: status.noddo.io
   - Add to footer of website

---

## 🔍 Application Performance Monitoring (Sentry)

### Already Configured! ✅

Sentry is ready to go. Just add env vars to Vercel:

```bash
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=noddo
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### What You Get:
- Real-time error tracking
- Performance monitoring
- Release tracking
- User context (which user hit the error)
- Breadcrumbs (what actions led to error)
- Source maps for readable stack traces

---

## 📈 Analytics (Vercel Analytics)

### Free with Vercel Pro

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable "Web Analytics"
3. Install (already done):
   ```bash
   npm install @vercel/analytics
   ```

4. Add to `app/layout.tsx` (already done in your codebase)

### What You Get:
- Core Web Vitals
- Page views
- Top pages
- Traffic sources
- Real user monitoring

---

## 🗄️ Database Monitoring (Supabase Dashboard)

### Built-in (No Setup Required) ✅

Supabase provides:
- **Database Health:** CPU, RAM, disk usage
- **Query Performance:** Slow queries, most frequent
- **Connection Pool:** Active connections
- **Storage:** Table sizes, growth trends

Access at: https://supabase.com/dashboard/project/YOUR_PROJECT/reports

### Recommended Alerts:
1. **Database Size > 90%** → Upgrade plan
2. **Connection Pool > 80%** → Optimize queries or add pooling
3. **Slow Queries > 1s** → Add indexes

---

## 📧 Email Monitoring (Resend Dashboard)

### Built-in (No Setup Required) ✅

Resend provides:
- Email delivery rate
- Bounce rate
- Spam complaints
- Click/open tracking

Access at: https://resend.com/emails

### Recommended Alerts:
1. **Bounce Rate > 5%** → Check email validation
2. **Spam Rate > 0.1%** → Review email content

---

## 🔔 Alert Channels

### Critical Alerts (Downtime, Security)
- **Phone/SMS:** BetterStack
- **Slack:** #alerts channel
- **Email:** admin@noddo.io

### Warning Alerts (Performance, Usage)
- **Slack:** #monitoring channel
- **Email:** dev@noddo.io

### Info (Deployments, Updates)
- **Slack:** #deploys channel

---

## 📋 Monitoring Checklist

### Daily (Automated)
- [ ] Uptime checks (BetterStack - every 1-3 min)
- [ ] Error rate (Sentry - real-time)
- [ ] API response times (Vercel Analytics)

### Weekly (Manual Review)
- [ ] Database growth trend (Supabase)
- [ ] Slow queries (Supabase)
- [ ] Email deliverability (Resend)
- [ ] Security audit results (GitHub Actions)

### Monthly (Strategic)
- [ ] Traffic growth vs capacity
- [ ] Cost optimization opportunities
- [ ] Performance benchmark vs competitors

---

## 🚨 Incident Response Playbook

### When BetterStack Alerts Fire

**Website Down (5xx errors):**
1. Check Vercel deployment status
2. Check Supabase status page
3. Check recent deploys (rollback if needed)
4. Check Sentry for error spikes

**Slow Response Times:**
1. Check database query performance (Supabase)
2. Check Vercel function logs
3. Check for traffic spikes (DDoS?)
4. Enable rate limiting if needed

**Database Connection Pool Exhausted:**
1. Check for slow queries
2. Check for connection leaks
3. Increase pool size temporarily
4. Add pgBouncer if needed

---

## 📊 Recommended Dashboard

### Create a Grafana/Datadog Dashboard (Optional - Advanced)

**Metrics to Track:**
- Request volume (per endpoint)
- Error rate (by endpoint, by user)
- P50/P95/P99 response times
- Database query latency
- Cache hit rate
- Rate limit hits

**Supabase Metrics Integration:**
```bash
# Export Supabase metrics to Datadog/Grafana
# (Requires Supabase Pro plan)
```

---

## 💡 Quick Wins

1. **Enable Vercel Analytics** (free, 2 min setup)
2. **Set up BetterStack** (free, 5 min setup)
3. **Configure Sentry** (already done, just add env vars)
4. **Create Slack webhook for alerts** (10 min)

These 4 steps give you 80% of enterprise monitoring coverage.

---

## 🔗 Resources

- [BetterStack Docs](https://betterstack.com/docs/uptime/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
