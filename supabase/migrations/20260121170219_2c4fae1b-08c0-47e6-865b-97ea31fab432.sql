
-- Create trigger function to auto-set next_backup_at on insert
CREATE OR REPLACE FUNCTION public.set_next_backup_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set if next_backup_at is null
  IF NEW.next_backup_at IS NULL THEN
    IF NEW.frequency = 'daily' THEN
      -- Set to tomorrow at 3:00 AM
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '3 hours');
    ELSE
      -- Weekly: set to next week at 3:00 AM
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '3 hours');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on backup_schedules table
DROP TRIGGER IF EXISTS set_next_backup_at_trigger ON backup_schedules;

CREATE TRIGGER set_next_backup_at_trigger
  BEFORE INSERT ON backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION set_next_backup_at();

-- Also handle updates when frequency changes
CREATE OR REPLACE FUNCTION public.update_next_backup_on_frequency_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If frequency changed, recalculate next_backup_at
  IF OLD.frequency IS DISTINCT FROM NEW.frequency THEN
    IF NEW.frequency = 'daily' THEN
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '3 hours');
    ELSE
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '3 hours');
    END IF;
  END IF;
  
  -- If schedule was re-enabled, set next backup if null
  IF OLD.is_enabled = false AND NEW.is_enabled = true AND NEW.next_backup_at IS NULL THEN
    IF NEW.frequency = 'daily' THEN
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '3 hours');
    ELSE
      NEW.next_backup_at := (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '3 hours');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_next_backup_trigger ON backup_schedules;

CREATE TRIGGER update_next_backup_trigger
  BEFORE UPDATE ON backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_backup_on_frequency_change();
