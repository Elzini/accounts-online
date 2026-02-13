
-- ============================================================
-- Fix 34 overly permissive RLS policies (USING(true)/WITH CHECK(true))
-- Replace with proper company isolation using strict_company_check()
-- ============================================================

-- ===================== TABLES WITH company_id =====================

-- 1. bookings
DROP POLICY IF EXISTS "Users can manage bookings" ON public.bookings;
CREATE POLICY "Company users can manage bookings" ON public.bookings FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 2. bookkeeping_clients
DROP POLICY IF EXISTS "Users can manage bookkeeping clients" ON public.bookkeeping_clients;
CREATE POLICY "Company users can manage bookkeeping clients" ON public.bookkeeping_clients FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 3. bookkeeping_tasks
DROP POLICY IF EXISTS "Users can manage bookkeeping tasks" ON public.bookkeeping_tasks;
CREATE POLICY "Company users can manage bookkeeping tasks" ON public.bookkeeping_tasks FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 4. cms_categories
DROP POLICY IF EXISTS "Users can manage cms categories" ON public.cms_categories;
CREATE POLICY "Company users can manage cms categories" ON public.cms_categories FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 5. cms_pages
DROP POLICY IF EXISTS "Users can manage cms pages" ON public.cms_pages;
CREATE POLICY "Company users can manage cms pages" ON public.cms_pages FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 6. credit_debit_notes
DROP POLICY IF EXISTS "Users can manage credit debit notes" ON public.credit_debit_notes;
CREATE POLICY "Company users can manage credit debit notes" ON public.credit_debit_notes FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 7. crm_leads
DROP POLICY IF EXISTS "Users can manage crm leads" ON public.crm_leads;
CREATE POLICY "Company users can manage crm leads" ON public.crm_leads FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 8. departments
DROP POLICY IF EXISTS "Users can manage departments" ON public.departments;
CREATE POLICY "Company users can manage departments" ON public.departments FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 9. email_campaigns
DROP POLICY IF EXISTS "Users can manage email campaigns" ON public.email_campaigns;
CREATE POLICY "Company users can manage email campaigns" ON public.email_campaigns FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 10. email_contacts
DROP POLICY IF EXISTS "Users can manage email contacts" ON public.email_contacts;
CREATE POLICY "Company users can manage email contacts" ON public.email_contacts FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 11. employee_contracts
DROP POLICY IF EXISTS "Users can manage employee contracts" ON public.employee_contracts;
CREATE POLICY "Company users can manage employee contracts" ON public.employee_contracts FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 12. goods_receipts
DROP POLICY IF EXISTS "Users can manage goods receipts" ON public.goods_receipts;
CREATE POLICY "Company users can manage goods receipts" ON public.goods_receipts FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 13. loyalty_points
DROP POLICY IF EXISTS "Users can manage loyalty points" ON public.loyalty_points;
CREATE POLICY "Company users can manage loyalty points" ON public.loyalty_points FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 14. loyalty_programs
DROP POLICY IF EXISTS "Users can manage loyalty programs" ON public.loyalty_programs;
CREATE POLICY "Company users can manage loyalty programs" ON public.loyalty_programs FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 15. payment_transactions
DROP POLICY IF EXISTS "Users can manage payment transactions" ON public.payment_transactions;
CREATE POLICY "Company users can manage payment transactions" ON public.payment_transactions FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 16. positions
DROP POLICY IF EXISTS "Users can manage positions" ON public.positions;
CREATE POLICY "Company users can manage positions" ON public.positions FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 17. purchase_orders
DROP POLICY IF EXISTS "Users can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Company users can manage purchase orders" ON public.purchase_orders FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 18. rental_contracts
DROP POLICY IF EXISTS "Users can manage rental contracts" ON public.rental_contracts;
CREATE POLICY "Company users can manage rental contracts" ON public.rental_contracts FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 19. rental_units
DROP POLICY IF EXISTS "Users can manage rental units" ON public.rental_units;
CREATE POLICY "Company users can manage rental units" ON public.rental_units FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 20. sales_targets
DROP POLICY IF EXISTS "Users can manage sales targets" ON public.sales_targets;
CREATE POLICY "Company users can manage sales targets" ON public.sales_targets FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 21. stock_vouchers
DROP POLICY IF EXISTS "Users can manage stock vouchers" ON public.stock_vouchers;
CREATE POLICY "Company users can manage stock vouchers" ON public.stock_vouchers FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 22. stocktaking_sessions
DROP POLICY IF EXISTS "Users can manage stocktaking" ON public.stocktaking_sessions;
CREATE POLICY "Company users can manage stocktaking" ON public.stocktaking_sessions FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 23. subscriptions
DROP POLICY IF EXISTS "Users can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Company users can manage subscriptions" ON public.subscriptions FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 24. support_tickets
DROP POLICY IF EXISTS "Users can manage support tickets" ON public.support_tickets;
CREATE POLICY "Company users can manage support tickets" ON public.support_tickets FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 25. time_entries
DROP POLICY IF EXISTS "Users can manage time entries" ON public.time_entries;
CREATE POLICY "Company users can manage time entries" ON public.time_entries FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 26. work_orders
DROP POLICY IF EXISTS "Users can manage work orders" ON public.work_orders;
CREATE POLICY "Company users can manage work orders" ON public.work_orders FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- 27. zatca_sandbox_tests
DROP POLICY IF EXISTS "Users can manage zatca sandbox" ON public.zatca_sandbox_tests;
CREATE POLICY "Company users can manage zatca sandbox" ON public.zatca_sandbox_tests FOR ALL
  USING (auth.uid() IS NOT NULL AND strict_company_check(company_id))
  WITH CHECK (auth.uid() IS NOT NULL AND strict_company_check(company_id));

-- ===================== CHILD TABLES (no company_id, use parent join) =====================

-- 28. credit_debit_note_lines (parent: credit_debit_notes via note_id)
DROP POLICY IF EXISTS "Users can manage credit debit note lines" ON public.credit_debit_note_lines;
CREATE POLICY "Company users can manage credit debit note lines" ON public.credit_debit_note_lines FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.credit_debit_notes n WHERE n.id = note_id AND strict_company_check(n.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.credit_debit_notes n WHERE n.id = note_id AND strict_company_check(n.company_id)
  ));

-- 29. crm_activities (parent: crm_leads via lead_id)
DROP POLICY IF EXISTS "Users can manage crm activities" ON public.crm_activities;
CREATE POLICY "Company users can manage crm activities" ON public.crm_activities FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id AND strict_company_check(l.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id AND strict_company_check(l.company_id)
  ));

-- 30. goods_receipt_lines (parent: goods_receipts via goods_receipt_id)
DROP POLICY IF EXISTS "Users can manage goods receipt lines" ON public.goods_receipt_lines;
CREATE POLICY "Company users can manage goods receipt lines" ON public.goods_receipt_lines FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.goods_receipts g WHERE g.id = goods_receipt_id AND strict_company_check(g.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.goods_receipts g WHERE g.id = goods_receipt_id AND strict_company_check(g.company_id)
  ));

-- 31. purchase_order_lines (parent: purchase_orders via purchase_order_id)
DROP POLICY IF EXISTS "Users can manage purchase order lines" ON public.purchase_order_lines;
CREATE POLICY "Company users can manage purchase order lines" ON public.purchase_order_lines FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND strict_company_check(po.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND strict_company_check(po.company_id)
  ));

-- 32. stock_voucher_lines (parent: stock_vouchers via stock_voucher_id)
DROP POLICY IF EXISTS "Users can manage stock voucher lines" ON public.stock_voucher_lines;
CREATE POLICY "Company users can manage stock voucher lines" ON public.stock_voucher_lines FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stock_vouchers sv WHERE sv.id = stock_voucher_id AND strict_company_check(sv.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stock_vouchers sv WHERE sv.id = stock_voucher_id AND strict_company_check(sv.company_id)
  ));

-- 33. stocktaking_lines (parent: stocktaking_sessions via session_id)
DROP POLICY IF EXISTS "Users can manage stocktaking lines" ON public.stocktaking_lines;
CREATE POLICY "Company users can manage stocktaking lines" ON public.stocktaking_lines FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stocktaking_sessions ss WHERE ss.id = session_id AND strict_company_check(ss.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.stocktaking_sessions ss WHERE ss.id = session_id AND strict_company_check(ss.company_id)
  ));

-- 34. ticket_replies (parent: support_tickets via ticket_id)
DROP POLICY IF EXISTS "Users can manage ticket replies" ON public.ticket_replies;
CREATE POLICY "Company users can manage ticket replies" ON public.ticket_replies FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND strict_company_check(st.company_id)
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND strict_company_check(st.company_id)
  ));
