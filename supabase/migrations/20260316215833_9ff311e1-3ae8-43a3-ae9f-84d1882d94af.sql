
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES public.account_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invoices.payment_account_id IS 'حساب الدفع المختار (المورد/البنك/جاري الشريك) يحدد الطرف الدائن في القيد التلقائي';
