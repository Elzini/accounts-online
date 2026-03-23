
-- Fix search_path warning + backfill company_id + add indexes
-- =====================================================

-- Fix search_path on the trigger function
CREATE OR REPLACE FUNCTION public.auto_set_child_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parent_company_id TEXT;
  fk_value TEXT;
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  EXECUTE format('SELECT ($1).%I', TG_ARGV[1]) INTO fk_value USING NEW;
  
  IF fk_value IS NOT NULL THEN
    EXECUTE format('SELECT company_id FROM public.%I WHERE id = $1', TG_ARGV[0])
      INTO parent_company_id USING fk_value;
    NEW.company_id := parent_company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Backfill existing data (disable bank_transactions trigger)
-- =====================================================
ALTER TABLE public.bank_transactions DISABLE TRIGGER USER;

UPDATE public.bank_transactions bt SET company_id = ba.company_id
FROM public.bank_accounts ba WHERE bt.bank_account_id = ba.id AND bt.company_id IS NULL;

ALTER TABLE public.bank_transactions ENABLE TRIGGER USER;

UPDATE public.sale_items si SET company_id = s.company_id
FROM public.sales s WHERE si.sale_id = s.id AND si.company_id IS NULL;

UPDATE public.payroll_items pi SET company_id = pr.company_id
FROM public.payroll_records pr WHERE pi.payroll_id = pr.id AND pi.company_id IS NULL;

UPDATE public.installment_payments ip SET company_id = ins.company_id
FROM public.installment_sales ins WHERE ip.installment_sale_id = ins.id AND ip.company_id IS NULL;

UPDATE public.financing_payments fp SET company_id = fc.company_id
FROM public.financing_contracts fc WHERE fp.contract_id = fc.id AND fp.company_id IS NULL;

UPDATE public.credit_debit_note_lines cl SET company_id = cdn.company_id
FROM public.credit_debit_notes cdn WHERE cl.note_id = cdn.id AND cl.company_id IS NULL;

UPDATE public.purchase_order_lines pol SET company_id = po.company_id
FROM public.purchase_orders po WHERE pol.purchase_order_id = po.id AND pol.company_id IS NULL;

UPDATE public.quotation_items qi SET company_id = q.company_id
FROM public.quotations q WHERE qi.quotation_id = q.id AND qi.company_id IS NULL;

UPDATE public.pos_order_lines pol SET company_id = po.company_id
FROM public.pos_orders po WHERE pol.order_id = po.id AND pol.company_id IS NULL;

UPDATE public.goods_receipt_lines grl SET company_id = gr.company_id
FROM public.goods_receipts gr WHERE grl.goods_receipt_id = gr.id AND grl.company_id IS NULL;

UPDATE public.stock_voucher_lines svl SET company_id = sv.company_id
FROM public.stock_vouchers sv WHERE svl.stock_voucher_id = sv.id AND svl.company_id IS NULL;

UPDATE public.stocktaking_lines sl SET company_id = ss.company_id
FROM public.stocktaking_sessions ss WHERE sl.session_id = ss.id AND sl.company_id IS NULL;

UPDATE public.prepaid_expense_amortizations pea SET company_id = pe.company_id
FROM public.prepaid_expenses pe WHERE pea.prepaid_expense_id = pe.id AND pea.company_id IS NULL;

UPDATE public.restaurant_order_items roi SET company_id = ro.company_id
FROM public.restaurant_orders ro WHERE roi.order_id = ro.id AND roi.company_id IS NULL;

-- =====================================================
-- Phase 1B: Add indexes on company_id (126 tables)
-- Only the most critical ones for performance
-- =====================================================

-- Child tables just updated
CREATE INDEX IF NOT EXISTS idx_bank_transactions_company ON public.bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_company ON public.sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_company ON public.payroll_items(company_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_company ON public.installment_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_financing_payments_company ON public.financing_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_debit_note_lines_company ON public.credit_debit_note_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_company ON public.purchase_order_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_company ON public.quotation_items(company_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_lines_company ON public.pos_order_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_company ON public.goods_receipt_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_voucher_lines_company ON public.stock_voucher_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_lines_company ON public.stocktaking_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_prepaid_amort_company ON public.prepaid_expense_amortizations(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_company ON public.restaurant_order_items(company_id);

-- High-traffic parent tables missing indexes
CREATE INDEX IF NOT EXISTS idx_items_company ON public.items(company_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_company ON public.item_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_company ON public.fixed_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_company ON public.quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_company ON public.hr_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_zatca_invoices_company ON public.zatca_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_company ON public.payment_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_attachments_company ON public.journal_attachments(company_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_company ON public.rental_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_company ON public.pos_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_company ON public.pos_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_prepaid_expenses_company ON public.prepaid_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_company ON public.production_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_products_company ON public.manufacturing_products(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_dealerships_company ON public.partner_dealerships(company_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_company ON public.exchange_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_company ON public.expense_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_entries_company ON public.depreciation_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_company ON public.custom_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_company ON public.quality_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON public.work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_company ON public.recurring_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON public.shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_vouchers_company ON public.stock_vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_sessions_company ON public.stocktaking_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON public.time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_trial_balance_imports_company ON public.trial_balance_imports(company_id);
CREATE INDEX IF NOT EXISTS idx_units_of_measure_company ON public.units_of_measure(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_company ON public.sales_targets(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_company ON public.restaurant_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_company ON public.restaurant_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_company ON public.restaurant_menu_items(company_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_company ON public.goods_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_financing_contracts_company ON public.financing_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_installment_sales_company ON public.installment_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_debit_notes_company ON public.credit_debit_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_company ON public.fleet_vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_company ON public.maintenance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON public.support_tickets(company_id);
