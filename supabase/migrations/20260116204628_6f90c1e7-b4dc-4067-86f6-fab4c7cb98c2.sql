-- Drop the duplicate/conflicting constraints
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS valid_car_status;

-- Update purchase price constraint to allow zero (for incoming cars)
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS positive_purchase_price;
ALTER TABLE public.cars ADD CONSTRAINT non_negative_purchase_price CHECK (purchase_price >= 0);