
-- Drop the trigger that prevents editing approved sales
DROP TRIGGER IF EXISTS prevent_approved_sale_update ON public.sales;

-- Update the function to allow modifications to approved sales
CREATE OR REPLACE FUNCTION public.prevent_approved_sale_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;
