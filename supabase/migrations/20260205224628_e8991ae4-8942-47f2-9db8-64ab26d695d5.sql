-- Add managed_by column to track which sales user manages each customer
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_managed_by ON public.customers(managed_by);

-- Drop existing RLS policies on customers
DROP POLICY IF EXISTS "customers_select_authorized" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_authorized" ON public.customers;
DROP POLICY IF EXISTS "customers_update_authorized" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_admin_only" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers in their company" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers in their company" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers in their company" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers in their company" ON public.customers;

-- Create new granular RLS policies

-- SELECT: Sales users can only see customers they manage, Admins see all
CREATE POLICY "customers_select_granular" ON public.customers
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    -- Super admins see all
    is_super_admin(auth.uid())
    -- Admins see all in their company
    OR has_permission('admin'::text)
    -- Sales users only see customers they manage (or unassigned customers)
    OR (has_permission('sales'::text) AND (managed_by = auth.uid() OR managed_by IS NULL))
  )
);

-- INSERT: Sales and Admin can create customers (automatically assigned to creator)
CREATE POLICY "customers_insert_granular" ON public.customers
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    has_permission('sales'::text) 
    OR has_permission('admin'::text) 
    OR is_super_admin(auth.uid())
  )
);

-- UPDATE: Sales can only update their own customers, Admins can update all
CREATE POLICY "customers_update_granular" ON public.customers
FOR UPDATE USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    is_super_admin(auth.uid())
    OR has_permission('admin'::text)
    OR (has_permission('sales'::text) AND managed_by = auth.uid())
  )
) WITH CHECK (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    is_super_admin(auth.uid())
    OR has_permission('admin'::text)
    OR (has_permission('sales'::text) AND managed_by = auth.uid())
  )
);

-- DELETE: Admin and Super Admin only
CREATE POLICY "customers_delete_admin_only" ON public.customers
FOR DELETE USING (
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (has_permission('admin'::text) OR is_super_admin(auth.uid()))
);

-- Create trigger to auto-assign managed_by on insert for sales users
CREATE OR REPLACE FUNCTION public.auto_assign_customer_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- If managed_by is not set, assign to the inserting user if they have sales permission
  IF NEW.managed_by IS NULL AND has_permission('sales'::text) THEN
    NEW.managed_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_auto_assign_customer_manager ON public.customers;
CREATE TRIGGER trigger_auto_assign_customer_manager
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_customer_manager();

-- Update the safe view to include managed_by info
DROP VIEW IF EXISTS public.customers_safe;

CREATE VIEW public.customers_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_id,
  name,
  managed_by,
  -- Mask phone: show only last 4 digits for non-admins
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN phone
    ELSE CONCAT('****', RIGHT(phone, 4))
  END AS phone,
  -- Mask address: show only city/area for non-admins
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN address
    ELSE COALESCE(SPLIT_PART(address, ',', 1), '***')
  END AS address,
  -- Mask ID number: show only last 4 digits for non-admins
  CASE 
    WHEN has_permission('admin'::text) OR is_super_admin(auth.uid()) THEN id_number
    ELSE CONCAT('****', RIGHT(COALESCE(id_number, ''), 4))
  END AS id_number,
  registration_number,
  created_at,
  updated_at
FROM public.customers
WHERE 
  auth.uid() IS NOT NULL 
  AND strict_company_check(company_id)
  AND (
    is_super_admin(auth.uid())
    OR has_permission('admin'::text)
    OR (has_permission('sales'::text) AND (managed_by = auth.uid() OR managed_by IS NULL))
  );