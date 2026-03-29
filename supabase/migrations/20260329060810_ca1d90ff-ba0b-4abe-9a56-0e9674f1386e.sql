
-- Create car warehouse stocktaking table
CREATE TABLE public.warehouse_car_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  car_type TEXT NOT NULL,
  car_color TEXT,
  chassis_number TEXT NOT NULL,
  chassis_image_url TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_car_inventory ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company warehouse car inventory"
  ON public.warehouse_car_inventory FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their company warehouse car inventory"
  ON public.warehouse_car_inventory FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their company warehouse car inventory"
  ON public.warehouse_car_inventory FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their company warehouse car inventory"
  ON public.warehouse_car_inventory FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Index
CREATE INDEX idx_warehouse_car_inventory_company ON public.warehouse_car_inventory(company_id);

-- Storage bucket for chassis images
INSERT INTO storage.buckets (id, name, public) VALUES ('chassis-images', 'chassis-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload chassis images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chassis-images');

CREATE POLICY "Anyone can view chassis images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chassis-images');

CREATE POLICY "Authenticated users can delete chassis images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chassis-images');
