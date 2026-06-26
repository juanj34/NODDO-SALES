-- Per-account theme preference (cross-device sync). Cookie remains the SSR source of truth.
alter table public.user_profiles
  add column if not exists theme text
  check (theme in ('light', 'dark'));
