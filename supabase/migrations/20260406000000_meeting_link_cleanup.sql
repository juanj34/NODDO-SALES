-- Add meeting_link column to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Remove booking-reminders cron job (migrated to GHL native calendar reminders)
SELECT cron.unschedule('booking-reminders');
