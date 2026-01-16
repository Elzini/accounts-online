-- Drop the existing constraint and add new one with 'transferred' status
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_status_check;

ALTER TABLE public.cars ADD CONSTRAINT cars_status_check 
CHECK (status = ANY (ARRAY['available'::text, 'sold'::text, 'transferred'::text]));