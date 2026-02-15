-- Add customer_email to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add passenger email to trip_passengers table  
ALTER TABLE public.trip_passengers ADD COLUMN IF NOT EXISTS passenger_email TEXT;