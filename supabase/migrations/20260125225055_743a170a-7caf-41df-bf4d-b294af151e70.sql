-- جدول السنوات المالية
CREATE TABLE public.fiscal_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- مثل: 2024, 2025
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  is_current BOOLEAN NOT NULL DEFAULT false,
  opening_balance_entry_id UUID REFERENCES public.journal_entries(id),
  closing_balance_entry_id UUID REFERENCES public.journal_entries(id),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- تفعيل RLS
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "View fiscal years in company"
ON public.fiscal_years FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Manage fiscal years - admins only"
ON public.fiscal_years FOR ALL
USING (
  is_super_admin(auth.uid()) OR 
  (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
);

-- إضافة عمود السنة المالية الحالية في الملفات الشخصية
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_fiscal_year_id UUID REFERENCES public.fiscal_years(id);

-- إضافة عمود السنة المالية في القيود
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS fiscal_year_id UUID REFERENCES public.fiscal_years(id);

-- إضافة عمود السنة المالية في المبيعات
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS fiscal_year_id UUID REFERENCES public.fiscal_years(id);

-- إضافة عمود السنة المالية في السيارات
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS fiscal_year_id UUID REFERENCES public.fiscal_years(id);

-- إضافة عمود السنة المالية في المصروفات
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS fiscal_year_id UUID REFERENCES public.fiscal_years(id);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_fiscal_years_updated_at
BEFORE UPDATE ON public.fiscal_years
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- التأكد من وجود سنة حالية واحدة فقط لكل شركة
CREATE OR REPLACE FUNCTION ensure_single_current_fiscal_year()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.fiscal_years 
    SET is_current = false 
    WHERE company_id = NEW.company_id 
      AND id != NEW.id 
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER ensure_single_current_fiscal_year_trigger
BEFORE INSERT OR UPDATE ON public.fiscal_years
FOR EACH ROW
WHEN (NEW.is_current = true)
EXECUTE FUNCTION ensure_single_current_fiscal_year();