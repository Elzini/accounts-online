
-- =====================================================
-- Phase 1A: Add company_id to 14 critical child tables
-- Step 1: Add columns only (no backfill yet)
-- =====================================================

ALTER TABLE public.bank_transactions ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.installment_payments ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.financing_payments ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.credit_debit_note_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.purchase_order_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.pos_order_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.goods_receipt_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.stock_voucher_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.stocktaking_lines ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.prepaid_expense_amortizations ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.restaurant_order_items ADD COLUMN IF NOT EXISTS company_id TEXT;

-- =====================================================
-- Auto-populate trigger function (generic, reusable)
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_set_child_company_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create auto-populate triggers for all 14 tables
CREATE OR REPLACE TRIGGER trg_auto_bank_tx_company BEFORE INSERT ON public.bank_transactions FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('bank_accounts', 'bank_account_id');
CREATE OR REPLACE TRIGGER trg_auto_sale_items_company BEFORE INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('sales', 'sale_id');
CREATE OR REPLACE TRIGGER trg_auto_payroll_items_company BEFORE INSERT ON public.payroll_items FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('payroll_records', 'payroll_id');
CREATE OR REPLACE TRIGGER trg_auto_installment_pay_company BEFORE INSERT ON public.installment_payments FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('installment_sales', 'installment_sale_id');
CREATE OR REPLACE TRIGGER trg_auto_financing_pay_company BEFORE INSERT ON public.financing_payments FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('financing_contracts', 'contract_id');
CREATE OR REPLACE TRIGGER trg_auto_cdn_lines_company BEFORE INSERT ON public.credit_debit_note_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('credit_debit_notes', 'note_id');
CREATE OR REPLACE TRIGGER trg_auto_po_lines_company BEFORE INSERT ON public.purchase_order_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('purchase_orders', 'purchase_order_id');
CREATE OR REPLACE TRIGGER trg_auto_quotation_items_company BEFORE INSERT ON public.quotation_items FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('quotations', 'quotation_id');
CREATE OR REPLACE TRIGGER trg_auto_pos_lines_company BEFORE INSERT ON public.pos_order_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('pos_orders', 'order_id');
CREATE OR REPLACE TRIGGER trg_auto_gr_lines_company BEFORE INSERT ON public.goods_receipt_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('goods_receipts', 'goods_receipt_id');
CREATE OR REPLACE TRIGGER trg_auto_sv_lines_company BEFORE INSERT ON public.stock_voucher_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('stock_vouchers', 'stock_voucher_id');
CREATE OR REPLACE TRIGGER trg_auto_stocktaking_lines_company BEFORE INSERT ON public.stocktaking_lines FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('stocktaking_sessions', 'session_id');
CREATE OR REPLACE TRIGGER trg_auto_prepaid_amort_company BEFORE INSERT ON public.prepaid_expense_amortizations FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('prepaid_expenses', 'prepaid_expense_id');
CREATE OR REPLACE TRIGGER trg_auto_rest_order_items_company BEFORE INSERT ON public.restaurant_order_items FOR EACH ROW EXECUTE FUNCTION public.auto_set_child_company_id('restaurant_orders', 'order_id');
