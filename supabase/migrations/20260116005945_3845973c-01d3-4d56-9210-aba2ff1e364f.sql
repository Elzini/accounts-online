
-- Add sale_id column to car_transfers to link transfers with sales
ALTER TABLE public.car_transfers 
ADD COLUMN sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;

-- Add actual_commission column to store the final commission after sale
ALTER TABLE public.car_transfers 
ADD COLUMN actual_commission NUMERIC DEFAULT 0;

-- Add sale_price column to track the sale price for commission calculation
ALTER TABLE public.car_transfers 
ADD COLUMN sale_price NUMERIC DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX idx_car_transfers_sale_id ON public.car_transfers(sale_id);
CREATE INDEX idx_car_transfers_car_id ON public.car_transfers(car_id);
CREATE INDEX idx_car_transfers_status ON public.car_transfers(status);
