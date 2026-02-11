
-- Units of measure
CREATE TABLE public.units_of_measure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abbreviation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_strict_isolation" ON public.units_of_measure FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Item categories (tree structure)
CREATE TABLE public.item_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_categories_strict_isolation" ON public.item_categories FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

-- Items (products)
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_number SERIAL,
  name TEXT NOT NULL,
  barcode TEXT,
  category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units_of_measure(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'product',
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price_1 NUMERIC NOT NULL DEFAULT 0,
  sale_price_2 NUMERIC DEFAULT 0,
  sale_price_3 NUMERIC DEFAULT 0,
  wholesale_price NUMERIC DEFAULT 0,
  min_quantity NUMERIC DEFAULT 0,
  max_quantity NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  opening_quantity NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  purchase_discount NUMERIC DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_strict_isolation" ON public.items FOR ALL USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
