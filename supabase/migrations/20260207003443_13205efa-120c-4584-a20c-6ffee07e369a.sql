
-- ============================================================
-- Step 1: Fix company_id column type from TEXT to UUID
-- ============================================================

-- restaurant_menu_items
ALTER TABLE public.restaurant_menu_items 
  ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- restaurant_orders
ALTER TABLE public.restaurant_orders 
  ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- restaurant_tables
ALTER TABLE public.restaurant_tables 
  ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- shipments
ALTER TABLE public.shipments 
  ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- letters_of_credit
ALTER TABLE public.letters_of_credit 
  ALTER COLUMN company_id TYPE uuid USING company_id::uuid;

-- Add proper foreign key constraints to companies table
ALTER TABLE public.restaurant_menu_items 
  ADD CONSTRAINT restaurant_menu_items_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.restaurant_orders 
  ADD CONSTRAINT restaurant_orders_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.restaurant_tables 
  ADD CONSTRAINT restaurant_tables_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.shipments 
  ADD CONSTRAINT shipments_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.letters_of_credit 
  ADD CONSTRAINT letters_of_credit_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================================
-- Step 2: Replace weak RLS policies with strict_company_check
-- ============================================================

-- restaurant_menu_items
DROP POLICY IF EXISTS "Users can manage restaurant menu items" ON public.restaurant_menu_items;
CREATE POLICY "restaurant_menu_items_select" ON public.restaurant_menu_items
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_menu_items_insert" ON public.restaurant_menu_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_menu_items_update" ON public.restaurant_menu_items
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_menu_items_delete" ON public.restaurant_menu_items
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- restaurant_orders
DROP POLICY IF EXISTS "Users can manage restaurant orders" ON public.restaurant_orders;
CREATE POLICY "restaurant_orders_select" ON public.restaurant_orders
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_orders_insert" ON public.restaurant_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_orders_update" ON public.restaurant_orders
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_orders_delete" ON public.restaurant_orders
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- restaurant_order_items (check through parent order)
DROP POLICY IF EXISTS "Users can manage restaurant order items" ON public.restaurant_order_items;
CREATE POLICY "restaurant_order_items_select" ON public.restaurant_order_items
  FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.restaurant_orders ro WHERE ro.id = order_id AND strict_company_check(ro.company_id)
  ));
CREATE POLICY "restaurant_order_items_insert" ON public.restaurant_order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.restaurant_orders ro WHERE ro.id = order_id AND strict_company_check(ro.company_id)
  ));
CREATE POLICY "restaurant_order_items_update" ON public.restaurant_order_items
  FOR UPDATE USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.restaurant_orders ro WHERE ro.id = order_id AND strict_company_check(ro.company_id)
  ));
CREATE POLICY "restaurant_order_items_delete" ON public.restaurant_order_items
  FOR DELETE USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.restaurant_orders ro WHERE ro.id = order_id AND strict_company_check(ro.company_id)
  ));

-- restaurant_tables
DROP POLICY IF EXISTS "Users can manage restaurant tables" ON public.restaurant_tables;
CREATE POLICY "restaurant_tables_select" ON public.restaurant_tables
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_tables_insert" ON public.restaurant_tables
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_tables_update" ON public.restaurant_tables
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "restaurant_tables_delete" ON public.restaurant_tables
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- shipments
DROP POLICY IF EXISTS "Users can manage shipments" ON public.shipments;
CREATE POLICY "shipments_select" ON public.shipments
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "shipments_insert" ON public.shipments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "shipments_update" ON public.shipments
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "shipments_delete" ON public.shipments
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- shipment_items (check through parent shipment)
DROP POLICY IF EXISTS "Users can manage shipment items" ON public.shipment_items;
CREATE POLICY "shipment_items_select" ON public.shipment_items
  FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND strict_company_check(s.company_id)
  ));
CREATE POLICY "shipment_items_insert" ON public.shipment_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND strict_company_check(s.company_id)
  ));
CREATE POLICY "shipment_items_update" ON public.shipment_items
  FOR UPDATE USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND strict_company_check(s.company_id)
  ));
CREATE POLICY "shipment_items_delete" ON public.shipment_items
  FOR DELETE USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shipments s WHERE s.id = shipment_id AND strict_company_check(s.company_id)
  ));

-- letters_of_credit
DROP POLICY IF EXISTS "Users can manage letters of credit" ON public.letters_of_credit;
CREATE POLICY "letters_of_credit_select" ON public.letters_of_credit
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "letters_of_credit_insert" ON public.letters_of_credit
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "letters_of_credit_update" ON public.letters_of_credit
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "letters_of_credit_delete" ON public.letters_of_credit
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- ============================================================
-- Step 3: Also upgrade contracts/projects to strict_company_check
-- ============================================================

DROP POLICY IF EXISTS "Users can view contracts in their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts in their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts in their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts in their company" ON public.contracts;

CREATE POLICY "contracts_select" ON public.contracts
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "contracts_delete" ON public.contracts
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));

DROP POLICY IF EXISTS "Users can view projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their company" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (auth.uid() IS NOT NULL AND strict_company_check(company_id));
