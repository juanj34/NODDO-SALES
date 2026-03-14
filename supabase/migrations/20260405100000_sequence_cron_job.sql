-- Pre-call email sequence cron job
-- Checks every 15 minutes for pending sequence emails and sends them

SELECT cron.schedule(
  'booking-sequence',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/booking-handler?action=sequence',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
