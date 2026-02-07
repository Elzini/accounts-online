-- Drop old cron jobs for auto-backup (cleanup)
SELECT cron.unschedule('daily-auto-backup');

-- Recreate with longer timeout (60 seconds instead of default 5)
SELECT cron.schedule(
  'daily-auto-backup',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://qbtkhiotvhcpmuzawkhi.supabase.co/functions/v1/auto-backup',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidGtoaW90dmhjcG11emF3a2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE2ODUyMywiZXhwIjoyMDgzNzQ0NTIzfQ.3KJqy_r1nExcZPj4a91amLZhklKx_E88w_2hC5h_lN0"}'::jsonb,
    body:='{}'::jsonb,
    timeout_milliseconds:=60000
  ) as request_id;
  $$
);
