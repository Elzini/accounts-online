-- Part 2: Create companies table and update all tables

-- 2. Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Add company_id to profiles table
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- 4. Add company_id to all data tables
ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.suppliers ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.cars ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.sales ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.purchase_batches ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.partner_dealerships ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.car_transfers ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.app_settings ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- 5. Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND permission = 'super_admin'
  )
$$;

-- 6. Create function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- 7. Create function to check if user belongs to company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- 8. RLS Policies for companies table
CREATE POLICY "Super admins can do everything on companies"
ON public.companies FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their company"
ON public.companies FOR UPDATE
USING (id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- Allow inserting companies during signup
CREATE POLICY "Allow insert companies during signup"
ON public.companies FOR INSERT
WITH CHECK (true);

-- 9. Update RLS policies for profiles to include company check
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their company"
ON public.profiles FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR company_id = get_user_company_id(auth.uid())
  OR auth.uid() = user_id
);

-- 10. Drop and recreate RLS policies for customers
DROP POLICY IF EXISTS "Users with sales or admin can view customers" ON public.customers;
DROP POLICY IF EXISTS "Users with sales or admin can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users with sales or admin can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

CREATE POLICY "View customers in company"
ON public.customers FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert customers in company"
ON public.customers FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
);

CREATE POLICY "Update customers in company"
ON public.customers FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete customers in company"
ON public.customers FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 11. Drop and recreate RLS policies for suppliers
DROP POLICY IF EXISTS "Users with purchases or admin can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users with purchases or admin can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users with purchases or admin can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

CREATE POLICY "View suppliers in company"
ON public.suppliers FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert suppliers in company"
ON public.suppliers FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Update suppliers in company"
ON public.suppliers FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete suppliers in company"
ON public.suppliers FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 12. Drop and recreate RLS policies for cars
DROP POLICY IF EXISTS "Users with purchases or admin can view cars" ON public.cars;
DROP POLICY IF EXISTS "Users with purchases or admin can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Users with purchases or admin can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;

CREATE POLICY "View cars in company"
ON public.cars FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'purchases') OR has_permission(auth.uid(), 'sales') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert cars in company"
ON public.cars FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Update cars in company"
ON public.cars FOR UPDATE
USING (
  (company_id = get_user_company_id(auth.uid()) OR company_id IS NULL)
  AND (has_permission(auth.uid(), 'purchases') OR has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete cars in company"
ON public.cars FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 13. Drop and recreate RLS policies for sales
DROP POLICY IF EXISTS "Users with sales or admin can view sales" ON public.sales;
DROP POLICY IF EXISTS "Users with sales or admin can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Users with sales or admin can update sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;

CREATE POLICY "View sales in company"
ON public.sales FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'reports') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert sales in company"
ON public.sales FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
);

CREATE POLICY "Update sales in company"
ON public.sales FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete sales in company"
ON public.sales FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 14. Drop and recreate RLS policies for purchase_batches
DROP POLICY IF EXISTS "Users with purchases or admin can view purchase_batches" ON public.purchase_batches;
DROP POLICY IF EXISTS "Users with purchases or admin can insert purchase_batches" ON public.purchase_batches;
DROP POLICY IF EXISTS "Users with purchases or admin can update purchase_batches" ON public.purchase_batches;
DROP POLICY IF EXISTS "Admins can delete purchase_batches" ON public.purchase_batches;

CREATE POLICY "View purchase_batches in company"
ON public.purchase_batches FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert purchase_batches in company"
ON public.purchase_batches FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Update purchase_batches in company"
ON public.purchase_batches FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete purchase_batches in company"
ON public.purchase_batches FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 15. Drop and recreate RLS policies for partner_dealerships
DROP POLICY IF EXISTS "Users with sales or purchases or admin can view partner_dealers" ON public.partner_dealerships;
DROP POLICY IF EXISTS "Users with sales or purchases or admin can insert partner_deale" ON public.partner_dealerships;
DROP POLICY IF EXISTS "Users with sales or purchases or admin can update partner_deale" ON public.partner_dealerships;
DROP POLICY IF EXISTS "Admins can delete partner_dealerships" ON public.partner_dealerships;

CREATE POLICY "View partner_dealerships in company"
ON public.partner_dealerships FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert partner_dealerships in company"
ON public.partner_dealerships FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Update partner_dealerships in company"
ON public.partner_dealerships FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete partner_dealerships in company"
ON public.partner_dealerships FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 16. Drop and recreate RLS policies for car_transfers
DROP POLICY IF EXISTS "Users with sales or purchases or admin can view car_transfers" ON public.car_transfers;
DROP POLICY IF EXISTS "Users with sales or purchases or admin can insert car_transfers" ON public.car_transfers;
DROP POLICY IF EXISTS "Users with sales or purchases or admin can update car_transfers" ON public.car_transfers;
DROP POLICY IF EXISTS "Admins can delete car_transfers" ON public.car_transfers;

CREATE POLICY "View car_transfers in company"
ON public.car_transfers FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) 
      AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid())))
);

CREATE POLICY "Insert car_transfers in company"
ON public.car_transfers FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Update car_transfers in company"
ON public.car_transfers FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
);

CREATE POLICY "Delete car_transfers in company"
ON public.car_transfers FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 17. Drop and recreate RLS policies for app_settings
DROP POLICY IF EXISTS "Everyone can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;

CREATE POLICY "View settings in company"
ON public.app_settings FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR company_id = get_user_company_id(auth.uid())
  OR company_id IS NULL
);

CREATE POLICY "Manage settings in company"
ON public.app_settings FOR ALL
USING (
  is_super_admin(auth.uid())
  OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- 18. Drop and recreate RLS policies for sale_items
DROP POLICY IF EXISTS "Users with sales or admin can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users with sales or admin can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users with sales or admin can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Admins can delete sale_items" ON public.sale_items;

CREATE POLICY "View sale_items via sales company"
ON public.sale_items FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_id 
    AND s.company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Insert sale_items via sales company"
ON public.sale_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_id 
    AND s.company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Update sale_items via sales company"
ON public.sale_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_id 
    AND s.company_id = get_user_company_id(auth.uid())
    AND (has_permission(auth.uid(), 'sales') OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Delete sale_items via sales company"
ON public.sale_items FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_id 
    AND s.company_id = get_user_company_id(auth.uid())
    AND is_admin(auth.uid())
  )
);

-- 19. Update user_roles policies to allow super_admin to manage all
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "View roles"
ON public.user_roles FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_super_admin(auth.uid())
  OR (is_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
  ))
);

CREATE POLICY "Insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR (is_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
  ))
);

CREATE POLICY "Update roles"
ON public.user_roles FOR UPDATE
USING (
  is_super_admin(auth.uid())
  OR (is_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
  ))
);

CREATE POLICY "Delete roles"
ON public.user_roles FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (is_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id
    AND p1.company_id = p2.company_id
  ))
);

-- 20. Create trigger to auto-create company on user signup
CREATE OR REPLACE FUNCTION public.create_company_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  user_count INTEGER;
BEGIN
  -- Create a new company for the user
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.username, 'شركتي'))
  RETURNING id INTO new_company_id;
  
  -- Update the profile with the company_id
  UPDATE public.profiles
  SET company_id = new_company_id
  WHERE id = NEW.id;
  
  -- Check if this is the very first user (super admin)
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 1 THEN
    -- First user becomes super_admin
    INSERT INTO public.user_roles (user_id, permission)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (after make_first_user_admin)
DROP TRIGGER IF EXISTS on_profile_created_create_company ON public.profiles;
CREATE TRIGGER on_profile_created_create_company
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- 21. Add updated_at trigger for companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();