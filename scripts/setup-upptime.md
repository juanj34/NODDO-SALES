# Upptime Setup Guide for NODDO

Upptime provides **FREE** uptime monitoring and status page using GitHub Actions.

## ✅ What You Get (100% Free)

- ✅ Uptime monitoring every 5 minutes
- ✅ Public status page at `status.noddo.io`
- ✅ Email/Slack/Discord notifications when site is down
- ✅ Response time tracking
- ✅ 90-day uptime history
- ✅ Incident logging

---

## 🚀 Setup (10 minutes)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/upptime/upptime
2. Click **"Use this template"** → **"Create a new repository"**
3. Name: `noddo-status`
4. Owner: Tu cuenta de GitHub
5. Visibility: **Public** (required for free GitHub Pages)
6. Click **"Create repository"**

### Step 2: Configure Upptime

Edit `.upptimerc.yml` in your new repo:

```yaml
# .upptimerc.yml
owner: YOUR_GITHUB_USERNAME # Change this
repo: noddo-status
assignees: # GitHub username(s) to assign issues
  - YOUR_GITHUB_USERNAME

sites:
  - name: NODDO Marketing Site
    url: https://noddo.io
    icon: https://noddo.io/LOGO_FAVICON-GOL.svg

  - name: NODDO Dashboard
    url: https://noddo.io/dashboard
    icon: https://noddo.io/LOGO_FAVICON-GOL.svg

  - name: NODDO API (Projects)
    url: https://noddo.io/api/proyectos
    icon: https://noddo.io/LOGO_FAVICON-GOL.svg
    expectedStatusCodes:
      - 200
      - 401 # API returns 401 without auth, which is OK

status-website:
  # Add your custom domain CNAME here (optional)
  cname: status.noddo.io
  # Branding
  logoUrl: https://noddo.io/LOGO_LOGO-WHITE.svg
  name: NODDO Status
  introTitle: "**NODDO** Status Page"
  introMessage: Real-time status and uptime monitoring for NODDO platform
  navbar:
    - title: Status
      href: /
    - title: GitHub
      href: https://github.com/$OWNER/$REPO
    - title: Website
      href: https://noddo.io

# Notifications
notifications:
  - type: email
    address: hola@noddo.io # Your email
  # Optional: Add Slack
  # - type: slack
  #   webhookUrl: $SLACK_WEBHOOK_URL

workflowSchedule:
  graphs: "0 0 * * *" # Generate graphs daily
  responseTime: "0 23 * * *" # Update response times daily
  staticSite: "0 1 * * *" # Deploy status page daily
  summary: "0 0 * * *" # Generate summary daily
  updateTemplate: "0 0 * * *" # Update template daily
  updates: "0 3 * * *" # Update issues daily
  uptime: "*/5 * * * *" # Check uptime every 5 minutes
```

### Step 3: Enable GitHub Pages

1. In your `noddo-status` repo, go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **`gh-pages`** (will be created automatically)
4. Folder: **`/ (root)`**
5. Click **Save**

### Step 4: Wait for First Run

GitHub Actions will run automatically and:
1. Check uptime of all sites (every 5 minutes)
2. Generate status page
3. Deploy to GitHub Pages

Wait ~5 minutes, then visit: `https://YOUR_USERNAME.github.io/noddo-status`

### Step 5: Custom Domain (Optional)

To use `status.noddo.io`:

1. Add DNS record in Vercel:
   ```
   Type: CNAME
   Name: status
   Value: YOUR_USERNAME.github.io
   TTL: 60
   ```

2. In GitHub repo settings → Pages → Custom domain:
   - Enter: `status.noddo.io`
   - Click Save
   - Wait for DNS check ✅

3. Enable **Enforce HTTPS** (after DNS propagates)

---

## 📧 Email Notifications

Upptime will send emails to `hola@noddo.io` when:
- ✅ Site goes down
- ✅ Site comes back up
- ✅ Response time is slow (>1s)

No configuration needed - it works automatically via GitHub.

---

## 🎨 Customization (Optional)

### Add More Sites

Edit `.upptimerc.yml` and add to `sites:` array:

```yaml
- name: Supabase DB
  url: https://enmtlrrfvwuzxfqjnton.supabase.co
  icon: https://supabase.com/favicon.ico

- name: Cloudflare R2
  url: https://pub-cc23f7b3b8bb46ebb178e6df44fb917e.r2.dev
  icon: https://cloudflare.com/favicon.ico
```

### Add Slack Notifications

1. Create Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
2. Add to `.upptimerc.yml`:
   ```yaml
   notifications:
     - type: slack
       webhookUrl: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Change Check Frequency

In `.upptimerc.yml`:

```yaml
workflowSchedule:
  uptime: "*/5 * * * *"  # Every 5 min (free tier max)
  # For Pro: "*/1 * * * *" (every 1 min) requires GitHub Pro
```

---

## 📊 What to Monitor

Recommended sites to monitor:

```yaml
sites:
  # Frontend
  - name: NODDO Website
    url: https://noddo.io

  - name: NODDO Dashboard
    url: https://noddo.io/dashboard

  # API Endpoints
  - name: Projects API
    url: https://noddo.io/api/proyectos
    expectedStatusCodes: [200, 401]

  - name: Leads API
    url: https://noddo.io/api/leads
    method: OPTIONS # Check CORS

  # Services
  - name: Supabase
    url: https://enmtlrrfvwuzxfqjnton.supabase.co

  - name: Cloudflare R2
    url: $R2_PUBLIC_URL # Your R2 public URL

  # Third-party dependencies
  - name: Resend Email
    url: https://api.resend.com

  - name: Mapbox API
    url: https://api.mapbox.com/v4
    expectedStatusCodes: [401] # Returns 401 without token, which is OK
```

---

## 🔍 How It Works

1. **GitHub Actions** runs every 5 minutes
2. Checks each URL in `sites` array
3. Records response time + status code
4. If site is down → opens GitHub Issue + sends notification
5. Generates static status page → deploys to GitHub Pages
6. Shows 90-day uptime % + response time graphs

---

## 💰 Cost

**$0/month**

Uses free GitHub Actions minutes (2,000 min/month free tier).
Upptime uses ~500 minutes/month with default config.

---

## 🎯 Next Steps

After setup:

1. ✅ Verify status page works: `https://YOUR_USERNAME.github.io/noddo-status`
2. ✅ Test notification: Stop your server → wait 5 min → check email
3. ✅ Add custom domain: `status.noddo.io`
4. ✅ Bookmark status page
5. ✅ Add link to footer: "System Status"

---

## 📝 Example Status Page

See working example: https://upptime.js.org

Your page will look similar with NODDO branding 🎨

---

## ❓ Troubleshooting

**Q: Status page not updating?**
A: Go to repo → Actions tab → check if workflows are enabled

**Q: Email notifications not working?**
A: GitHub uses the email from your GitHub account settings

**Q: Want faster checks?**
A: Upgrade to GitHub Pro ($4/mo) → can check every 1 minute

**Q: Can I make repo private?**
A: No, GitHub Pages requires public repo for free tier

---

## 🆘 Support

- Docs: https://upptime.js.org
- Issues: https://github.com/upptime/upptime/issues
- Discord: https://discord.gg/upptime
