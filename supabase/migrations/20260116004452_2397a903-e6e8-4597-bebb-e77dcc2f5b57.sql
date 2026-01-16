
-- Create partner_dealerships table
CREATE TABLE public.partner_dealerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfer_type enum
CREATE TYPE public.transfer_type AS ENUM ('outgoing', 'incoming');

-- Create transfer_status enum  
CREATE TYPE public.transfer_status AS ENUM ('pending', 'sold', 'returned');

-- Create car_transfers table
CREATE TABLE public.car_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  partner_dealership_id UUID NOT NULL REFERENCES public.partner_dealerships(id) ON DELETE CASCADE,
  transfer_type transfer_type NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  agreed_commission NUMERIC DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  status transfer_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partner_dealerships
ALTER TABLE public.partner_dealerships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on car_transfers
ALTER TABLE public.car_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_dealerships
CREATE POLICY "Users with sales or purchases or admin can view partner_dealerships"
ON public.partner_dealerships
FOR SELECT
USING (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Users with sales or purchases or admin can insert partner_dealerships"
ON public.partner_dealerships
FOR INSERT
WITH CHECK (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Users with sales or purchases or admin can update partner_dealerships"
ON public.partner_dealerships
FOR UPDATE
USING (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete partner_dealerships"
ON public.partner_dealerships
FOR DELETE
USING (is_admin(auth.uid()));

-- RLS policies for car_transfers
CREATE POLICY "Users with sales or purchases or admin can view car_transfers"
ON public.car_transfers
FOR SELECT
USING (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Users with sales or purchases or admin can insert car_transfers"
ON public.car_transfers
FOR INSERT
WITH CHECK (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Users with sales or purchases or admin can update car_transfers"
ON public.car_transfers
FOR UPDATE
USING (
  has_permission(auth.uid(), 'sales'::user_permission) OR 
  has_permission(auth.uid(), 'purchases'::user_permission) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete car_transfers"
ON public.car_transfers
FOR DELETE
USING (is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_partner_dealerships_updated_at
BEFORE UPDATE ON public.partner_dealerships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_transfers_updated_at
BEFORE UPDATE ON public.car_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
