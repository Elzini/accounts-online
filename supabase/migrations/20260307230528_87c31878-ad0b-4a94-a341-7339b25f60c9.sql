-- Fix: Change chassis_number from global unique to per-company unique
ALTER TABLE public.cars DROP CONSTRAINT cars_chassis_number_key;
ALTER TABLE public.cars ADD CONSTRAINT cars_company_chassis_unique UNIQUE (company_id, chassis_number);

-- Also fix status check to include 'returned' status
ALTER TABLE public.cars DROP CONSTRAINT cars_status_check;
ALTER TABLE public.cars ADD CONSTRAINT cars_status_check CHECK (status = ANY (ARRAY['available', 'sold', 'transferred', 'returned']));

-- Clean orphan batches (batches without any cars)
DELETE FROM public.purchase_batches WHERE id NOT IN (SELECT DISTINCT batch_id FROM public.cars WHERE batch_id IS NOT NULL);