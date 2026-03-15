# Dependabot Setup for NODDO

Dependabot is GitHub's **FREE** automated dependency security scanner and updater.

## ✅ What You Get (100% Free)

- ✅ Automatic security vulnerability detection in dependencies
- ✅ Auto-generated Pull Requests to fix vulnerabilities
- ✅ Weekly dependency updates (optional)
- ✅ Works for npm, Docker, GitHub Actions, and more
- ✅ Built into GitHub - no external service needed

---

## 🚀 Method 1: Enable via GitHub UI (2 minutes)

### Step 1: Enable Dependabot Alerts

1. Go to your repo: https://github.com/YOUR_USERNAME/noddo
2. Click **Settings** tab
3. In left sidebar → **Code security**
4. Under **Dependabot**:
   - ✅ Enable **Dependabot alerts**
   - ✅ Enable **Dependabot security updates**

That's it! Dependabot is now active.

### Step 2: Enable Version Updates (Optional)

1. In **Code security** page
2. ✅ Enable **Dependabot version updates**

This creates PRs for ALL dependency updates (not just security), which can be noisy.
**Recommendation**: Keep this OFF initially, enable only security updates.

---

## 🚀 Method 2: Configure via File (Recommended)

Create `.github/dependabot.yml` in your repo:

\`\`\`yaml
# .github/dependabot.yml
version: 2
updates:
  # Enable npm dependency updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly" # Check every Monday
      day: "monday"
      time: "09:00"
      timezone: "America/Bogota"
    open-pull-requests-limit: 5 # Max 5 PRs at once
    reviewers:
      - "YOUR_GITHUB_USERNAME" # Replace with your username
    assignees:
      - "YOUR_GITHUB_USERNAME"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
    # Only update security vulnerabilities (not all deps)
    # Remove this block if you want ALL updates
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-minor", "version-update:semver-patch"]

  # GitHub Actions updates
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    labels:
      - "github-actions"
      - "dependencies"

  # Docker updates (if you have Dockerfile)
  # - package-ecosystem: "docker"
  #   directory: "/"
  #   schedule:
  #     interval: "weekly"
\`\`\`

### Commit and Push

\`\`\`bash
git add .github/dependabot.yml
git commit -m "chore: enable Dependabot"
git push
\`\`\`

Dependabot will start scanning within ~1 hour.

---

## 📧 How It Works

1. **Dependabot scans** `package.json` and `package-lock.json`
2. **Finds vulnerabilities** using GitHub Advisory Database
3. **Opens PR** with fix (updates vulnerable package)
4. **Runs your CI/CD** (tests, builds) automatically
5. **You review + merge** if tests pass

### Example PR Title

\`\`\`
chore(deps): bump express from 4.17.1 to 4.18.2 [security]
\`\`\`

---

## 🔒 What It Detects

Dependabot catches:

- ✅ Known CVEs in npm packages
- ✅ Vulnerable versions (outdated packages with fixes)
- ✅ License issues (GPL in commercial project)
- ✅ Malicious packages
- ✅ Supply chain attacks

### Example Alert

\`\`\`
🚨 High Severity

Package: jsonwebtoken
Vulnerability: CVE-2022-23529
Description: Token verification bypass
Fix: Update to 9.0.0+
\`\`\`

---

## ⚙️ Configuration Options

### Security-Only Updates (Recommended)

Only fix vulnerabilities, ignore regular updates:

\`\`\`yaml
ignore:
  - dependency-name: "*"
    update-types: ["version-update:semver-minor", "version-update:semver-patch"]
\`\`\`

### All Updates (Can be noisy)

Get PRs for every dependency update:

\`\`\`yaml
# Remove the "ignore" block
# Dependabot will update everything
\`\`\`

### Frequency

\`\`\`yaml
schedule:
  interval: "daily"   # Every day
  interval: "weekly"  # Every Monday (recommended)
  interval: "monthly" # First of month
\`\`\`

### Ignore Specific Packages

\`\`\`yaml
ignore:
  # Ignore React updates (e.g., staying on v17)
  - dependency-name: "react"
    versions: ["18.x"]

  # Ignore all Next.js updates
  - dependency-name: "next"
\`\`\`

### Auto-merge (Advanced)

With GitHub CLI + Actions, you can auto-merge minor updates:

\`\`\`.github/workflows/dependabot-auto-merge.yml
name: Dependabot auto-merge
on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v1
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{github.event.pull_request.html_url}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
\`\`\`

**⚠️ Only enable auto-merge if you have good test coverage!**

---

## 📊 Monitoring

### View Security Alerts

1. Go to repo → **Security** tab
2. **Dependabot alerts** shows all vulnerabilities
3. Each alert shows:
   - Severity (Critical, High, Medium, Low)
   - CVE number
   - Affected versions
   - Fix version

### View PRs

- Dependabot PRs appear in **Pull Requests** tab
- Labeled with `dependencies`
- Include changelog + release notes

---

## 🎯 Recommended Workflow

1. **Monday morning**: Dependabot opens PRs with security fixes
2. **Review PRs**: Check changelog, severity
3. **Run tests locally** (if needed):
   \`\`\`bash
   gh pr checkout 123  # Checkout PR #123
   npm install
   npm run build
   npm test
   \`\`\`
4. **Merge if green**: Tests pass → merge
5. **Repeat weekly**

---

## 💰 Cost

**$0/month**

Completely free. Included with all GitHub repos (public + private).

---

## 🔍 Real-World Example

Your current dependencies that might trigger alerts:

\`\`\`json
// package.json
{
  "next": "16.x.x",           // Dependabot checks for Next.js CVEs
  "react": "19.x.x",          // Checks React vulnerabilities
  "supabase": "...",          // Checks Supabase SDK
  "@sentry/nextjs": "...",    // Checks Sentry SDK
  // etc...
}
\`\`\`

If a CVE is published for any of these, Dependabot opens PR within hours.

---

## 🆘 What to Do When Alert Appears

### High/Critical Severity

1. **Review immediately** (same day)
2. **Check if exploitable** in your context
3. **Merge PR** after tests pass
4. **Deploy ASAP**

### Medium Severity

1. **Review this week**
2. **Merge in next release**

### Low Severity

1. **Review eventually**
2. **Bundle with other updates**

---

## 📝 Notifications

Configure how you receive alerts:

1. Go to **Settings** (your profile, not repo)
2. **Notifications** → **Dependabot alerts**
3. Choose:
   - ✅ Email immediately
   - ✅ Web + Mobile
   - ⬜ Weekly digest

**Recommendation**: Enable email for Critical/High, weekly digest for Low.

---

## ❓ Troubleshooting

**Q: Not seeing any PRs?**
A: Dependabot only opens PRs for actual vulnerabilities. If no vulns, no PRs.

**Q: Too many PRs?**
A: Use `open-pull-requests-limit: 3` or enable security-only mode

**Q: PR failing CI checks?**
A: Review breaking changes in changelog, update your code if needed

**Q: Want to disable?**
A: Settings → Code security → Disable Dependabot

---

## 🎯 Next Steps

After enabling:

1. ✅ Wait 1 hour for first scan
2. ✅ Check **Security** tab for any existing vulnerabilities
3. ✅ Review + merge any open PRs
4. ✅ Set up email notifications
5. ✅ Done! Runs automatically forever.

---

## 📚 Resources

- Docs: https://docs.github.com/en/code-security/dependabot
- Advisory Database: https://github.com/advisories
- npm vulnerabilities: https://www.npmjs.com/advisories
