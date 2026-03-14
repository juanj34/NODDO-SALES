-- Fix cron jobs: use hardcoded URL+key instead of app.settings (requires superuser)

-- Drop existing jobs that reference app.settings
SELECT cron.unschedule('booking-reminders');
SELECT cron.unschedule('booking-noshow');
SELECT cron.unschedule('booking-sequence');

-- Recreate with hardcoded values
SELECT cron.schedule(
  'booking-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://enmtlrrfvwuzxfqjnton.supabase.co/functions/v1/booking-handler?action=reminders',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubXRscnJmdnd1enhmcWpudG9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYwMzcyOSwiZXhwIjoyMDg4MTc5NzI5fQ.AnRZKiiedmsaPczmBmE4YIpLJslBGVdb7FZdltTuzp8","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'booking-noshow',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://enmtlrrfvwuzxfqjnton.supabase.co/functions/v1/booking-handler?action=noshow',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubXRscnJmdnd1enhmcWpudG9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYwMzcyOSwiZXhwIjoyMDg4MTc5NzI5fQ.AnRZKiiedmsaPczmBmE4YIpLJslBGVdb7FZdltTuzp8","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'booking-sequence',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://enmtlrrfvwuzxfqjnton.supabase.co/functions/v1/booking-handler?action=sequence',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubXRscnJmdnd1enhmcWpudG9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYwMzcyOSwiZXhwIjoyMDg4MTc5NzI5fQ.AnRZKiiedmsaPczmBmE4YIpLJslBGVdb7FZdltTuzp8","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
