
-- 1. bom_lines (linked via manufacturing_products.company_id)
DROP POLICY IF EXISTS "Users can manage bom" ON public.bom_lines;

CREATE POLICY "Admins can manage bom" ON public.bom_lines
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.manufacturing_products mp
    WHERE mp.id = bom_lines.product_id
      AND mp.company_id = get_user_company_id(auth.uid())
  )
  AND is_admin(auth.uid())
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.manufacturing_products mp
    WHERE mp.id = bom_lines.product_id
      AND mp.company_id = get_user_company_id(auth.uid())
  )
  AND is_admin(auth.uid())
);

-- 2. branches
DROP POLICY IF EXISTS "Users can manage branches" ON public.branches;

CREATE POLICY "Admins can manage branches" ON public.branches
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 3. currencies
DROP POLICY IF EXISTS "Users can manage currencies" ON public.currencies;

CREATE POLICY "Admins can manage currencies" ON public.currencies
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 4. employee_attendance
DROP POLICY IF EXISTS "Users can manage attendance" ON public.employee_attendance;

CREATE POLICY "Admins can manage attendance" ON public.employee_attendance
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 5. employee_insurance
DROP POLICY IF EXISTS "Users can manage insurance" ON public.employee_insurance;

CREATE POLICY "Admins can manage insurance" ON public.employee_insurance
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 6. employee_leaves
DROP POLICY IF EXISTS "Users can manage leaves" ON public.employee_leaves;

CREATE POLICY "Admins can manage leaves" ON public.employee_leaves
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 7. employee_rewards
DROP POLICY IF EXISTS "Users can manage rewards" ON public.employee_rewards;

CREATE POLICY "Admins can manage rewards" ON public.employee_rewards
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 8. exchange_rates
DROP POLICY IF EXISTS "Users can manage exchange rates" ON public.exchange_rates;

CREATE POLICY "Admins can manage exchange rates" ON public.exchange_rates
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 9. journal_attachments
DROP POLICY IF EXISTS "Users can manage journal attachments" ON public.journal_attachments;

CREATE POLICY "Admins can manage journal attachments" ON public.journal_attachments
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 10. manufacturing_products
DROP POLICY IF EXISTS "Users can manage mfg products" ON public.manufacturing_products;

CREATE POLICY "Admins can manage mfg products" ON public.manufacturing_products
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 11. production_orders
DROP POLICY IF EXISTS "Users can manage production orders" ON public.production_orders;

CREATE POLICY "Admins can manage production orders" ON public.production_orders
FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
) WITH CHECK (
  company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
);

-- 12. production_stages (linked via production_orders.company_id)
DROP POLICY IF EXISTS "Users can manage production stages" ON public.production_stages;

CREATE POLICY "Admins can manage production stages" ON public.production_stages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.production_orders po
    WHERE po.id = production_stages.production_order_id
      AND po.company_id = get_user_company_id(auth.uid())
  )
  AND is_admin(auth.uid())
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.production_orders po
    WHERE po.id = production_stages.production_order_id
      AND po.company_id = get_user_company_id(auth.uid())
  )
  AND is_admin(auth.uid())
);
