DROP POLICY IF EXISTS "Users can view their company warehouse car inventory" ON public.warehouse_car_inventory;
DROP POLICY IF EXISTS "Users can insert their company warehouse car inventory" ON public.warehouse_car_inventory;
DROP POLICY IF EXISTS "Users can update their company warehouse car inventory" ON public.warehouse_car_inventory;
DROP POLICY IF EXISTS "Users can delete their company warehouse car inventory" ON public.warehouse_car_inventory;

CREATE POLICY "Users can view their company warehouse car inventory"
ON public.warehouse_car_inventory FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their company warehouse car inventory"
ON public.warehouse_car_inventory FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company warehouse car inventory"
ON public.warehouse_car_inventory FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company warehouse car inventory"
ON public.warehouse_car_inventory FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));