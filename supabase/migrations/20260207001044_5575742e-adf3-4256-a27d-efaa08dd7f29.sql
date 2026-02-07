-- Add backup_hour column to allow users to configure backup time
ALTER TABLE public.backup_schedules 
ADD COLUMN IF NOT EXISTS backup_hour integer NOT NULL DEFAULT 3;

-- Add constraint to ensure valid hour (0-23)
ALTER TABLE public.backup_schedules 
ADD CONSTRAINT backup_hour_range CHECK (backup_hour >= 0 AND backup_hour <= 23);
