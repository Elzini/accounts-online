-- Add car_id column to expenses table to link expenses to specific cars
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_car_id ON public.expenses(car_id);

-- Create a function to calculate car expenses
CREATE OR REPLACE FUNCTION public.get_car_expenses(p_car_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM public.expenses WHERE car_id = p_car_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to calculate car net profit (sale_price - purchase_price - car_expenses)
CREATE OR REPLACE FUNCTION public.calculate_car_net_profit(
  p_sale_price NUMERIC,
  p_purchase_price NUMERIC,
  p_car_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_car_expenses NUMERIC;
BEGIN
  v_car_expenses := public.get_car_expenses(p_car_id);
  RETURN p_sale_price - p_purchase_price - v_car_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;