
-- Add specific reminder datetime column to trips table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS reminder_datetime TIMESTAMPTZ;

-- Add column to track if reminder is enabled
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true;

-- Create function to calculate reminder datetime from trip date/time and hours before
CREATE OR REPLACE FUNCTION public.calculate_reminder_datetime()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If reminder_datetime is not explicitly set, calculate from trip date/time
  IF NEW.reminder_datetime IS NULL AND NEW.trip_date IS NOT NULL AND NEW.trip_time IS NOT NULL THEN
    NEW.reminder_datetime := (NEW.trip_date || ' ' || NEW.trip_time)::TIMESTAMP 
      - (COALESCE(NEW.reminder_hours_before, 24) || ' hours')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate reminder datetime
DROP TRIGGER IF EXISTS trigger_calculate_reminder_datetime ON public.trips;
CREATE TRIGGER trigger_calculate_reminder_datetime
BEFORE INSERT OR UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.calculate_reminder_datetime();
