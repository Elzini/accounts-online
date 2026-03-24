
-- 1. تعطيل/حذف دوال DB القديمة التي تتعارض مع InvoicePostingEngine
DROP FUNCTION IF EXISTS public.create_invoice_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_purchase_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_sale_journal_entry CASCADE;
DROP FUNCTION IF EXISTS public.create_expense_journal_entry CASCADE;

-- 2. حذف الجداول اليتيمة غير المستخدمة
DROP TABLE IF EXISTS public.cms_pages CASCADE;
DROP TABLE IF EXISTS public.loyalty_points CASCADE;
DROP TABLE IF EXISTS public.loyalty_programs CASCADE;
DROP TABLE IF EXISTS public.sms_provider_configs CASCADE;
