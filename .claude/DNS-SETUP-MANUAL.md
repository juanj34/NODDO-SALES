# 📧 DNS Configuration for Resend Email — MANUAL SETUP

> **Domain:** noddo.io
> **Provider:** Vercel DNS
> **Email Service:** Resend
> **Time Required:** 10 minutes + 24h DNS propagation

---

## ✅ OPTION 1: Via Vercel Dashboard (EASIEST)

### Step 1: Get DNS Records from Resend

1. **Login to Resend**
   https://resend.com/domains

2. **Add Domain**
   - Click "Add Domain"
   - Enter: `noddo.io`
   - Click "Add"

3. **Copy DNS Records**
   Resend will show 5 DNS records. Write them down:

   ```
   📋 SPF Record:
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all

   📋 DMARC Record:
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s

   📋 DKIM Record 1:
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.resend.com

   📋 DKIM Record 2:
   Type: CNAME
   Name: resend2._domainkey
   Value: [unique value from Resend]

   📋 DKIM Record 3:
   Type: CNAME
   Name: resend3._domainkey
   Value: [unique value from Resend]
   ```

---

### Step 2: Add Records in Vercel DNS

1. **Go to Vercel DNS Settings**
   https://vercel.com/noddo/settings/domains

2. **Select noddo.io**
   - Click on `noddo.io` in the domains list
   - Go to "DNS Records" tab

3. **Add Each Record:**

   **SPF Record:**
   - Click "Add Record"
   - Type: `TXT`
   - Name: `@`
   - Value: `v=spf1 include:resend.com ~all`
   - TTL: `3600` (1 hour)
   - Click "Save"

   **DMARC Record:**
   - Click "Add Record"
   - Type: `TXT`
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s`
   - TTL: `3600`
   - Click "Save"

   **DKIM Record 1:**
   - Click "Add Record"
   - Type: `CNAME`
   - Name: `resend._domainkey`
   - Value: `resend._domainkey.resend.com`
   - TTL: `3600`
   - Click "Save"

   **DKIM Record 2:**
   - Click "Add Record"
   - Type: `CNAME`
   - Name: `resend2._domainkey`
   - Value: `[paste from Resend]`
   - TTL: `3600`
   - Click "Save"

   **DKIM Record 3:**
   - Click "Add Record"
   - Type: `CNAME`
   - Name: `resend3._domainkey`
   - Value: `[paste from Resend]`
   - TTL: `3600`
   - Click "Save"

---

### Step 3: Verify in Resend (24-48h)

1. **Go back to Resend**
   https://resend.com/domains

2. **Check noddo.io status**
   - Resend auto-checks DNS every few hours
   - Status will change from "Pending" → "Verified"
   - Usually takes 1-24 hours

3. **Test Email Sending**
   - Once verified, send a test email
   - Check spam score (should be 0)
   - Verify DKIM/SPF/DMARC pass in email headers

---

## ✅ OPTION 2: Via Vercel API (ADVANCED)

If you have Vercel CLI or API token:

```bash
# Get your token from: https://vercel.com/account/tokens

export VERCEL_TOKEN="your-token-here"
export VERCEL_TEAM_ID="your-team-id"  # Optional, if using team

# Add SPF
curl -X POST "https://api.vercel.com/v2/domains/noddo.io/records?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TXT",
    "name": "@",
    "value": "v=spf1 include:resend.com ~all",
    "ttl": 3600
  }'

# Add DMARC
curl -X POST "https://api.vercel.com/v2/domains/noddo.io/records?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TXT",
    "name": "_dmarc",
    "value": "v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s",
    "ttl": 3600
  }'

# Add DKIM records (get values from Resend first)
curl -X POST "https://api.vercel.com/v2/domains/noddo.io/records?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "resend._domainkey",
    "value": "resend._domainkey.resend.com",
    "ttl": 3600
  }'

# Repeat for resend2 and resend3
```

---

## 🔍 Verification Commands

After 24 hours, verify DNS propagation:

```bash
# Check SPF
dig TXT noddo.io +short | grep spf
# Expected: "v=spf1 include:resend.com ~all"

# Check DMARC
dig TXT _dmarc.noddo.io +short
# Expected: "v=DMARC1; p=quarantine..."

# Check DKIM
dig CNAME resend._domainkey.noddo.io +short
# Expected: resend._domainkey.resend.com

# Online tools
https://mxtoolbox.com/spf.aspx?domain=noddo.io
https://mxtoolbox.com/dmarc.aspx?domain=noddo.io
```

---

## 📊 Expected Results

**SPF Record:**
```
v=spf1 include:resend.com ~all
```
- ✅ Authorizes Resend servers to send emails
- ✅ Soft-fail (~all) for other servers
- ✅ Prevents email spoofing

**DMARC Record:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@noddo.io; pct=100; adkim=s; aspf=s
```
- ✅ Policy: Quarantine suspicious emails
- ✅ Reports sent to dmarc@noddo.io
- ✅ Apply to 100% of emails
- ✅ Strict alignment for DKIM and SPF

**DKIM Records:**
```
resend._domainkey → resend._domainkey.resend.com
resend2._domainkey → [unique Resend value]
resend3._domainkey → [unique Resend value]
```
- ✅ Cryptographically sign all outgoing emails
- ✅ Prevents email tampering
- ✅ Improves deliverability

---

## ✅ Success Checklist

- [ ] Resend domain status: "Verified" ✅
- [ ] SPF lookup returns correct value ✅
- [ ] DMARC lookup returns correct value ✅
- [ ] DKIM lookups return Resend CNAMEs ✅
- [ ] Test email sent successfully ✅
- [ ] Email spam score = 0 ✅
- [ ] Gmail shows DKIM/SPF/DMARC pass ✅

---

## 🚨 Troubleshooting

### "DNS records not found after 24h"

**Check:**
1. Verify records were added correctly in Vercel DNS
2. Check for typos in record names/values
3. Try from different DNS server: `dig @8.8.8.8 TXT noddo.io`
4. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### "Resend shows 'Pending' forever"

**Fix:**
1. Check DNS propagation globally: https://dnschecker.org/
2. Wait full 48 hours (DNS can be slow)
3. Delete and re-add domain in Resend
4. Contact Resend support if still failing

### "Emails go to spam"

**Check:**
1. Verify all 5 DNS records are present and correct
2. Check email headers for DKIM/SPF/DMARC results
3. Warm up your domain (send gradually increasing volume)
4. Check Resend reputation dashboard
5. Review email content for spam triggers

---

## 📚 Resources

- **Resend Docs:** https://resend.com/docs/dashboard/domains/introduction
- **Vercel DNS Docs:** https://vercel.com/docs/projects/domains/working-with-domains
- **SPF Validator:** https://mxtoolbox.com/spf.aspx
- **DMARC Validator:** https://mxtoolbox.com/dmarc.aspx
- **DKIM Validator:** https://mxtoolbox.com/dkim.aspx
- **Email Header Analyzer:** https://mxtoolbox.com/EmailHeaders.aspx

---

**⏱️ Total Setup Time:**
- Adding records in Vercel: ~10 minutes
- DNS propagation: 1-48 hours (average 6-12h)
- Verification in Resend: Automatic after DNS propagates

**✅ Once complete, all NODDO emails will have:**
- Perfect deliverability score
- 0 spam score
- Full authentication (SPF/DKIM/DMARC)
- Professional sender reputation
