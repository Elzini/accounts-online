-- Create a new table for sale items (multiple cars per sale)
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id),
  sale_price NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a new table for purchase batches (multiple cars per purchase)
CREATE TABLE public.purchase_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchase_batches
ALTER TABLE public.purchase_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for sale_items
CREATE POLICY "Users with sales or admin can view sale_items" 
ON public.sale_items 
FOR SELECT 
USING (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'reports'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Users with sales or admin can insert sale_items" 
ON public.sale_items 
FOR INSERT 
WITH CHECK (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Users with sales or admin can update sale_items" 
ON public.sale_items 
FOR UPDATE 
USING (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete sale_items" 
ON public.sale_items 
FOR DELETE 
USING (is_admin(auth.uid()));

-- RLS policies for purchase_batches
CREATE POLICY "Users with purchases or admin can view purchase_batches" 
ON public.purchase_batches 
FOR SELECT 
USING (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Users with purchases or admin can insert purchase_batches" 
ON public.purchase_batches 
FOR INSERT 
WITH CHECK (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Users with purchases or admin can update purchase_batches" 
ON public.purchase_batches 
FOR UPDATE 
USING (has_permission(auth.uid(), 'purchases'::user_permission) OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete purchase_batches" 
ON public.purchase_batches 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add batch_id to cars table for linking to purchase batches
ALTER TABLE public.cars ADD COLUMN batch_id UUID REFERENCES public.purchase_batches(id);

-- Create trigger for updating updated_at on purchase_batches
CREATE TRIGGER update_purchase_batches_updated_at
BEFORE UPDATE ON public.purchase_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();