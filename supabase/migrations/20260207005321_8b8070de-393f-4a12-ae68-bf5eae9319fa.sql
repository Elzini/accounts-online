
-- ============================================================
-- إصلاحات النظام المحاسبي الشاملة
-- ============================================================

-- 1. إصلاح دقة الحقول المالية (precision) لمنع أخطاء التقريب
ALTER TABLE public.journal_entry_lines 
  ALTER COLUMN debit TYPE numeric(18, 2),
  ALTER COLUMN credit TYPE numeric(18, 2);

ALTER TABLE public.vouchers 
  ALTER COLUMN amount TYPE numeric(18, 2);

ALTER TABLE public.expenses 
  ALTER COLUMN amount TYPE numeric(18, 2);

-- 2. إضافة قيود CHECK لمنع القيم السالبة
ALTER TABLE public.journal_entry_lines
  ADD CONSTRAINT journal_entry_lines_debit_non_negative CHECK (debit >= 0),
  ADD CONSTRAINT journal_entry_lines_credit_non_negative CHECK (credit >= 0);

ALTER TABLE public.vouchers
  ADD CONSTRAINT vouchers_amount_positive CHECK (amount > 0);

-- 3. Trigger لمنع تعديل القيود في السنة المالية المغلقة
CREATE OR REPLACE FUNCTION public.prevent_closed_fiscal_year_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_date DATE;
  v_company_id UUID;
  v_fiscal_year RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entry_date := OLD.entry_date;
    v_company_id := OLD.company_id;
  ELSE
    v_entry_date := NEW.entry_date;
    v_company_id := NEW.company_id;
  END IF;

  SELECT * INTO v_fiscal_year FROM public.fiscal_years
  WHERE company_id = v_company_id
    AND v_entry_date BETWEEN start_date AND end_date
    AND status = 'closed'
  LIMIT 1;

  IF v_fiscal_year.id IS NOT NULL THEN
    RAISE EXCEPTION 'لا يمكن تعديل أو حذف القيود في سنة مالية مغلقة (%)', v_fiscal_year.name;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE TRIGGER prevent_journal_entry_closed_fy
  BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_closed_fiscal_year_changes();

-- 4. Trigger لمزامنة مجاميع القيد تلقائياً من السطور
CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit NUMERIC(18,2);
  v_total_credit NUMERIC(18,2);
  v_entry_id UUID;
BEGIN
  v_entry_id := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO v_total_debit, v_total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_id = v_entry_id;

  UPDATE public.journal_entries
  SET total_debit = v_total_debit,
      total_credit = v_total_credit
  WHERE id = v_entry_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE TRIGGER sync_journal_entry_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_journal_entry_balance();

-- 5. إصلاح القيد الافتتاحي الفارغ (#221) - فصل المرجع ثم تصفير
UPDATE public.fiscal_years 
SET opening_balance_entry_id = NULL
WHERE opening_balance_entry_id = '19d24710-4aeb-4747-b98f-1f282e364a69';

UPDATE public.fiscal_years 
SET closing_balance_entry_id = NULL
WHERE closing_balance_entry_id = '19d24710-4aeb-4747-b98f-1f282e364a69';

DELETE FROM public.journal_entries 
WHERE id = '19d24710-4aeb-4747-b98f-1f282e364a69';

-- 6. فهارس أداء التقارير المحاسبية
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date 
  ON public.journal_entries (company_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference 
  ON public.journal_entries (reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account 
  ON public.journal_entry_lines (account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry 
  ON public.journal_entry_lines (journal_entry_id);

CREATE INDEX IF NOT EXISTS idx_vouchers_company_date 
  ON public.vouchers (company_id, voucher_date);

CREATE INDEX IF NOT EXISTS idx_account_categories_company_code 
  ON public.account_categories (company_id, code);
