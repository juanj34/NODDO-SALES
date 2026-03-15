# Email Sequence Testing Guide (E1-E6)

> **System:** Pre-Call Email Nurture Sequence for Demo Bookings
> **File:** [supabase/functions/booking-handler/index.ts](../supabase/functions/booking-handler/index.ts)
> **Status:** ✅ Fully Implemented | ⚠️ Needs E2E Testing
> **Last Updated:** 2026-03-15

---

## Overview

When a user books a demo call via the marketing site, NODDO sends a **6-email nurture sequence** designed to increase show rates and reduce no-shows. The sequence uses behavioral psychology principles to address objections and build anticipation.

**Goal:** Increase demo show rate from industry average ~40% to 65%+

---

## Sequence Architecture

### Email Triggers

| Email | Name | Timing | Skip Condition |
|-------|------|--------|----------------|
| **E1** | Confirmation | Immediately (T+0) | Never skipped |
| **E2** | Pre-call video | T+2h | Skip if call < 4h away |
| **E3** | External beliefs | T+12h | Skip if call < 16h away |
| **E4** | Internal beliefs | T+24h | Skip if call < 30h away |
| **E5** | Method beliefs | T+36h | Skip if call < 42h away |
| **E6** | Final anticipation | T-3h (before call) | Skip if call < 5h away |

### Behavioral Psychology Framework

Each email addresses a specific belief barrier:

1. **E1 (Confirmation)** — Authority & commitment (social proof via confirmation)
2. **E2 (Video)** — Preparation & anticipation (reduce uncertainty)
3. **E3 (External beliefs)** — Address market objections ("not for me")
4. **E4 (Internal beliefs)** — Build confidence ("I can do this")
5. **E5 (Method beliefs)** — Justify the choice ("why NODDO vs alternatives")
6. **E6 (Anticipation)** — Urgency & readiness (final reminder)

---

## Implementation Details

### 1. Sequence Plan Generation

**Function:** `computeSequencePlan(scheduledFor: string)`

**Logic:**
```typescript
const hoursUntilCall = (callTime - now) / (1000 * 60 * 60);

// E1: Always sent
plan.push({ email: 1, send_at: now, sent: true });

// E2: Only if call > 4h away
if (hoursUntilCall > 4) {
  plan.push({ email: 2, send_at: now + 2h });
}

// E3: Only if call > 16h away
if (hoursUntilCall > 16) {
  plan.push({ email: 3, send_at: now + 12h });
}

// E4: Only if call > 30h away
if (hoursUntilCall > 30) {
  plan.push({ email: 4, send_at: now + 24h });
}

// E5: Only if call > 42h away
if (hoursUntilCall > 42) {
  plan.push({ email: 5, send_at: now + 36h });
}

// E6: Only if call > 5h away
if (hoursUntilCall > 5) {
  plan.push({ email: 6, send_at: callTime - 3h });
}
```

**Stored in DB:**
```json
// appointments.sequence_plan (JSONB)
[
  { "email": 1, "send_at": "2026-03-15T10:00:00Z", "sent": true, "sent_at": "2026-03-15T10:00:00Z" },
  { "email": 2, "send_at": "2026-03-15T12:00:00Z", "sent": false, "sent_at": null },
  { "email": 3, "send_at": "2026-03-15T22:00:00Z", "sent": false, "sent_at": null },
  ...
]
```

### 2. Sequence Execution

**Function:** `handleSequence(supabase)`

**Runs:** Every time booking-handler is invoked (cron or manual trigger)

**Query:**
```sql
SELECT * FROM appointments
WHERE status = 'confirmed'
  AND sequence_emails_sent < 6
  AND scheduled_for >= now()
```

**For each appointment:**
1. Load `sequence_plan` array
2. Check each entry:
   - Skip if `entry.sent === true`
   - Skip if `entry.send_at > now` (not time yet)
3. Build email content via `buildSequenceEmail(emailNum, ...)`
4. Send via Resend
5. Mark `entry.sent = true`, `entry.sent_at = now`
6. Update `sequence_emails_sent` count
7. Update `sequence_plan` in DB

---

## Email Content

### E1: Confirmation ✅

**Subject:** "¡Demo confirmada! — NODDO"

**Content:**
- Gold header with "✓ Demo confirmada"
- Date, time, timezone
- Calendar add link (.ics)
- Meeting link (Google Meet / Zoom)
- WhatsApp opt-in checkbox result
- What to expect bullet list
- Support contact

**CTA:** "Agregar a mi calendario"

**Sent:** Immediately when booking is confirmed

---

### E2: Pre-Call Video (T+2h)

**Subject:** "Antes de tu demo, mira esto (2 min) — NODDO"

**Goal:** Reduce uncertainty, build anticipation

**Content:**
- Reminder of demo date/time
- "We prepared a 2-minute video so you can arrive prepared"
- What you'll see:
  - How a NODDO showroom works inside
  - How fast you can publish
  - Why constructoras are migrating from generic websites

**CTA:** "Ver video de 2 min" → Links to `/demo-confirmada` thank-you page

**Timing:** 2 hours after booking (skip if call < 4h away)

---

### E3: External Beliefs (T+12h)

**Subject:** "Lo que otros directores nos dicen antes de la demo — NODDO"

**Goal:** Address market objections preemptively

**Content:**
Three most common objections from directors:

1. **"I don't have time for another tool"**
   - NODDO isn't a tool to manage, it's a sales page that publishes in 1 day
   - Upload renders, floor plans, data — showroom builds itself
   - No agency meetings, no design iterations, no 3-month wait

2. **"We already have a marketing agency"**
   - Perfect. NODDO doesn't replace your agency — it complements it
   - Agency generates traffic, NODDO converts it
   - Digital showroom captures qualified leads, shows real-time inventory

3. **"Our project is different"**
   - We've worked with apartments, country houses, offices, lots, mixed-use
   - The format adapts
   - In the demo we show you how it looks with your specific project type

**CTA:** "Ver más preguntas frecuentes"

**Timing:** 12 hours after booking (skip if call < 16h away)

---

### E4: Internal Beliefs + Testimonials (T+24h)

**Subject:** 'De "no soy tech" a publicar en 1 día — NODDO'

**Goal:** Build confidence, overcome imposter syndrome

**Content:**
- Most common concern: "What if my team isn't technical?"
- If you can upload a photo to WhatsApp, you can use NODDO
- Editor works with drag-and-drop, no code, no complex configs

**Testimonials:**
1. Carlos Mendoza (Director Comercial — Constructora Habitat):
   > "En la primera semana recibimos más leads cualificados que en los últimos 3 meses con nuestro sitio anterior."

2. Andrés Velásquez (CEO — AV Desarrollos):
   > "Lo publicamos en un día. Sin agencia, sin reuniones interminables. Simplemente funciona."

**CTA:** "Ver más historias"

**Timing:** 24 hours after booking (skip if call < 30h away)

---

### E5: Method Beliefs (T+36h)

**Subject:** "Por qué NODDO y no un sitio web normal — NODDO"

**Goal:** Justify the choice, address alternatives

**Content:**
- You could make a website in Wix
- You could pay an agency
- You could do nothing and keep selling with WhatsApp and PDF

**But there's a reason constructoras are switching to digital showrooms:**

- **Interactive facade** — Buyer explores the building clicking each unit. Not a static render, it's an experience.
- **Live inventory** — Availability, prices, and statuses update instantly. Zero outdated spreadsheets.
- **Qualified leads** — You know exactly which tipología interested the buyer, where they came from, how long they browsed.
- **Published in 1 day** — Not 3 months. Not 15 meetings. One day.

**CTA:** "Ver la diferencia"

**Timing:** 36 hours after booking (skip if call < 42h away)

---

### E6: Final Anticipation (T-3h)

**Subject:** "Nos vemos en 3 horas — NODDO"

**Goal:** Final reminder, increase urgency, reduce no-show

**Content:**
- "Your demo is **today at [TIME]**. We're excited to show you the platform."

**To make the most of it:**
- Have your project name and number of units ready
- If you have renders or floor plans, perfect — we'll show you how they'd look
- Prepare your questions — the session is 100% personalized

**CTA:** "Unirme a la videollamada" → Direct link to meeting

**Secondary link:** "¿Necesitas cambiar la hora? Reagenda aquí"

**Timing:** 3 hours before call (skip if call < 5h away)

---

## Testing Procedures

### 1. Manual Testing (Development)

**Prerequisites:**
- Supabase Edge Functions running locally OR deployed to staging
- Resend API key configured
- Test email address you control

**Test Case 1: Book Far Future (7 Days Ahead)**

```bash
# Book a demo 7 days in the future
curl -X POST https://[your-edge-function-url]/booking-handler \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Test",
    "email": "your-test-email@example.com",
    "empresa": "Test Corp",
    "telefono": "+573001234567",
    "selectedDate": "2026-03-22",
    "selectedTime": "10:00",
    "timezone": "America/Bogota",
    "whatsapp_optin": true
  }'
```

**Expected Result:**
- ✅ E1 sent immediately (confirmation)
- ✅ `sequence_plan` has 6 entries (all emails scheduled)
- ✅ `sequence_emails_sent = 1`
- Check DB: `SELECT sequence_plan FROM appointments WHERE email = 'your-test-email@example.com';`

**Test Case 2: Book 3 Hours Ahead**

```bash
# Book a demo 3 hours in the future
curl -X POST https://[your-edge-function-url]/booking-handler \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Test Short",
    "email": "your-test-email@example.com",
    "empresa": "Test Corp",
    "selectedDate": "2026-03-15",
    "selectedTime": "13:00",
    "timezone": "America/Bogota",
    "whatsapp_optin": false
  }'
```

**Expected Result:**
- ✅ E1 sent immediately (confirmation)
- ✅ `sequence_plan` has ONLY 1 entry (E1 only, all others skipped)
- ✅ `sequence_emails_sent = 1`
- ✅ No follow-up emails scheduled

**Test Case 3: Book 25 Hours Ahead**

```bash
# Book a demo tomorrow at same time
curl -X POST ...
  "selectedDate": "2026-03-16",
  "selectedTime": "10:00"
```

**Expected Result:**
- ✅ E1 sent immediately
- ✅ `sequence_plan` has 4 entries: E1, E2, E3, E6
- ❌ E4 skipped (needs > 30h)
- ❌ E5 skipped (needs > 42h)

---

### 2. Sequence Execution Testing

**Trigger the cron handler manually:**

```bash
# Invoke booking-handler to process pending sequence emails
curl -X POST https://[your-edge-function-url]/booking-handler \
  -H "Content-Type: application/json" \
  -d '{ "action": "sequence" }'
```

**What it does:**
- Queries all confirmed appointments with `sequence_emails_sent < 6`
- For each appointment, checks if any sequence emails are due
- Sends emails and updates `sequence_plan`

**To test:**
1. Create appointment with future date (e.g., 7 days ahead)
2. Manually update `sequence_plan[1].send_at` in DB to current time:
   ```sql
   UPDATE appointments
   SET sequence_plan = jsonb_set(
     sequence_plan,
     '{1,send_at}',
     to_jsonb(now()::text)
   )
   WHERE email = 'your-test-email@example.com';
   ```
3. Trigger handler via curl
4. Check email inbox — should receive E2
5. Check DB — `sequence_plan[1].sent` should be `true`

---

### 3. Production Testing Checklist

**Before launching to real customers:**

- [ ] **E1 (Confirmation) sends immediately**
  - [ ] Contains correct date/time/timezone
  - [ ] Calendar .ics file works
  - [ ] Meeting link is valid
  - [ ] WhatsApp opt-in checkbox reflects user choice
  - [ ] Support link works

- [ ] **E2 (Video) sends at T+2h**
  - [ ] Only sent if booking > 4h away
  - [ ] Thank-you URL works
  - [ ] Video link loads

- [ ] **E3 (Objections) sends at T+12h**
  - [ ] Only sent if booking > 16h away
  - [ ] Content is in Spanish
  - [ ] Links work

- [ ] **E4 (Testimonials) sends at T+24h**
  - [ ] Only sent if booking > 30h away
  - [ ] Testimonials render correctly
  - [ ] Glass card styling works in Gmail/Outlook

- [ ] **E5 (Method) sends at T+36h**
  - [ ] Only sent if booking > 42h away
  - [ ] Bullet points render correctly

- [ ] **E6 (Anticipation) sends at T-3h**
  - [ ] Only sent if booking > 5h away
  - [ ] Sent 3 hours before call (not 3 hours after booking)
  - [ ] Meeting link is correct
  - [ ] Reschedule link works

- [ ] **Sequence tracking**
  - [ ] `sequence_emails_sent` increments correctly
  - [ ] `sequence_plan[].sent` updates when email is sent
  - [ ] `sequence_plan[].sent_at` has correct timestamp

- [ ] **Edge cases**
  - [ ] No duplicate emails sent
  - [ ] Sequence stops if appointment is cancelled
  - [ ] Sequence stops if appointment is marked no-show
  - [ ] Emails not sent after call has passed

---

### 4. Email Rendering Testing

**Test in multiple clients:**

- [ ] Gmail web
- [ ] Gmail mobile (iOS/Android)
- [ ] Outlook web
- [ ] Outlook desktop (Windows)
- [ ] Apple Mail (macOS/iOS)
- [ ] Yahoo Mail

**Check for:**
- Gold accent color (`#b8973a`) renders correctly
- Dark background (`#141414`) shows (or white fallback in light mode clients)
- Testimonial cards (glassmorphism) display properly
- Bullet lists are formatted correctly
- CTA buttons are clickable and styled
- Responsive layout on mobile

---

### 5. Monitoring & Debugging

**Check email send logs:**
```sql
-- If using Resend, check via their dashboard
-- Or query Supabase logs
SELECT * FROM appointments
WHERE email = 'customer@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check sequence plan
SELECT
  id,
  nombre,
  email,
  scheduled_for,
  sequence_emails_sent,
  sequence_plan
FROM appointments
WHERE status = 'confirmed'
  AND scheduled_for >= now()
ORDER BY created_at DESC;
```

**Check for stuck sequences:**
```sql
-- Find appointments where emails are overdue
SELECT
  id,
  nombre,
  email,
  sequence_emails_sent,
  (sequence_plan->0->>'send_at')::timestamptz AS next_email_due
FROM appointments
WHERE status = 'confirmed'
  AND sequence_emails_sent < 6
  AND (sequence_plan->0->>'sent')::boolean = false
  AND (sequence_plan->0->>'send_at')::timestamptz < now()
ORDER BY next_email_due;
```

---

### 6. Cron Setup Verification

**The sequence handler must run periodically.** Recommended: every 15 minutes.

**Supabase Edge Function cron:**
```bash
# Check if cron is configured
supabase functions list

# Should show booking-handler with cron: */15 * * * *
```

**Manual cron config (supabase/functions/booking-handler/supabase.yml):**
```yaml
functions:
  booking-handler:
    verify_jwt: false
    import_map: ./import_map.json
    cron:
      - */15 * * * *  # Every 15 minutes
```

**Test cron execution:**
1. Deploy function: `supabase functions deploy booking-handler`
2. Check logs: `supabase functions logs booking-handler`
3. Wait 15 minutes
4. Check logs again — should see cron execution

---

## Known Issues & Fixes

### Issue 1: WhatsApp No-Show URL Has Placeholder Number

**Problem:** No-show follow-up email uses hardcoded WhatsApp number `+1234567890`

**Location:** Line ~262 in booking-handler

**Fix:** Set `WHATSAPP_SUPPORT_NUMBER` env var (already documented in `.env.example`)

```bash
# Vercel env var
WHATSAPP_SUPPORT_NUMBER=+573001234567
```

---

### Issue 2: Admin Email Hardcoded to hola@noddo.io

**Problem:** All admin notifications go to `hola@noddo.io` instead of booking owner

**Location:** Confirmation email admin notification

**Fix:** Fetch admin user from `users` table or use `ADMIN_EMAIL` env var

---

### Issue 3: Thank-You Page Link

**Problem:** E2-E6 CTAs link to `/demo-confirmada` which might not have the video embedded

**Fix:** Either:
1. Add video to `/demo-confirmada` page
2. Update CTAs to link to a dedicated video page or YouTube

---

## Success Metrics

**Track these KPIs:**

| Metric | Formula | Target |
|--------|---------|--------|
| **Open Rate** | Opens / Sent | 60%+ |
| **Click Rate** | Clicks / Sent | 20%+ |
| **Show Rate** | Attended / Confirmed | 65%+ |
| **Sequence Completion** | E6 sent / E1 sent | 30%+ |

**A/B Test Ideas:**
- Subject line variations
- Send timing (T+2h vs T+4h for E2)
- Testimonial placement (E4 vs E3)
- CTA copy ("Ver video" vs "Preparar mi demo")

---

## Quick Reference: Email Timing Matrix

| Booking Window | E1 | E2 | E3 | E4 | E5 | E6 |
|----------------|:--:|:--:|:--:|:--:|:--:|:--:|
| < 4h           | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4h - 16h       | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 16h - 30h      | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| 30h - 42h      | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| > 42h          | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Summary

✅ **Sequence fully implemented**
✅ **All 6 emails have content**
✅ **Timing logic is correct**
✅ **Skip conditions work**
⚠️ **Needs end-to-end testing with real bookings**
⚠️ **Cron must be enabled for production**
⚠️ **Minor fixes needed (WhatsApp number, admin email)**

**Next Steps:**
1. Deploy booking-handler with cron enabled
2. Set `WHATSAPP_SUPPORT_NUMBER` env var
3. Book test demo 7 days ahead
4. Verify E1 arrives immediately
5. Wait for E2-E6 or manually trigger sequence handler
6. Check email rendering in Gmail/Outlook
7. Monitor show rate improvement
