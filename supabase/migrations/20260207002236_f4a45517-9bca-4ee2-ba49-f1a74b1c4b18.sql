-- Restaurant tables
CREATE TABLE public.restaurant_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'أطباق رئيسية',
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  order_number SERIAL,
  order_type TEXT NOT NULL DEFAULT 'dine_in',
  status TEXT NOT NULL DEFAULT 'new',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT,
  table_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.restaurant_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.restaurant_menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Export/Import tables
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  shipment_number SERIAL,
  shipment_type TEXT NOT NULL DEFAULT 'import',
  status TEXT NOT NULL DEFAULT 'pending',
  origin_country TEXT,
  destination_country TEXT,
  supplier_name TEXT,
  customer_name TEXT,
  total_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  shipping_cost NUMERIC DEFAULT 0,
  customs_fees NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  clearance_fees NUMERIC DEFAULT 0,
  bill_of_lading TEXT,
  container_number TEXT,
  shipping_method TEXT DEFAULT 'sea',
  departure_date DATE,
  arrival_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  hs_code TEXT,
  weight NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.letters_of_credit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  lc_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'import',
  status TEXT NOT NULL DEFAULT 'draft',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  issuing_bank TEXT,
  beneficiary_name TEXT,
  beneficiary_bank TEXT,
  issue_date DATE,
  expiry_date DATE,
  shipment_id UUID REFERENCES public.shipments(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters_of_credit ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurant tables
CREATE POLICY "Users can manage restaurant menu items" ON public.restaurant_menu_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage restaurant orders" ON public.restaurant_orders FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage restaurant order items" ON public.restaurant_order_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage restaurant tables" ON public.restaurant_tables FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS policies for export/import tables
CREATE POLICY "Users can manage shipments" ON public.shipments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage shipment items" ON public.shipment_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage letters of credit" ON public.letters_of_credit FOR ALL USING (auth.uid() IS NOT NULL);
