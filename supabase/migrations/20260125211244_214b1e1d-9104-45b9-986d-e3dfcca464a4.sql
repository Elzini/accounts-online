
-- Create prepaid_expenses table for tracking prepaid expenses with amortization
CREATE TABLE IF NOT EXISTS public.prepaid_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_months INTEGER NOT NULL DEFAULT 12,
  monthly_amount NUMERIC NOT NULL,
  amortized_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prepaid_expense_amortizations table for tracking monthly amortization entries
CREATE TABLE IF NOT EXISTS public.prepaid_expense_amortizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prepaid_expense_id UUID NOT NULL REFERENCES public.prepaid_expenses(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id),
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  amortization_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  month_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prepaid_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepaid_expense_amortizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prepaid_expenses
CREATE POLICY "Users can view prepaid expenses of their company" 
ON public.prepaid_expenses FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert prepaid expenses for their company" 
ON public.prepaid_expenses FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update prepaid expenses of their company" 
ON public.prepaid_expenses FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete prepaid expenses of their company" 
ON public.prepaid_expenses FOR DELETE 
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for prepaid_expense_amortizations
CREATE POLICY "Users can view amortizations of their company" 
ON public.prepaid_expense_amortizations FOR SELECT 
USING (
  prepaid_expense_id IN (
    SELECT id FROM public.prepaid_expenses 
    WHERE company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert amortizations for their company" 
ON public.prepaid_expense_amortizations FOR INSERT 
WITH CHECK (
  prepaid_expense_id IN (
    SELECT id FROM public.prepaid_expenses 
    WHERE company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update amortizations of their company" 
ON public.prepaid_expense_amortizations FOR UPDATE 
USING (
  prepaid_expense_id IN (
    SELECT id FROM public.prepaid_expenses 
    WHERE company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add prepaid expenses account to chart of accounts for new companies
-- Update initialize_company_defaults function to include prepaid expenses account
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  setting_record RECORD;
  expense_cat_record RECORD;
  cash_account_id UUID;
  revenue_account_id UUID;
  inventory_account_id UUID;
  cogs_account_id UUID;
  suppliers_account_id UUID;
  expense_account_id UUID;
  vat_payable_id UUID;
  vat_recoverable_id UUID;
  vat_settlement_id UUID;
  prepaid_expenses_account_id UUID;
BEGIN
  -- Create standard chart of accounts from defaults or standard template
  
  -- Assets (1xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '1000', 'الأصول', 'assets', 'الأصول الرئيسية', true),
    (NEW.id, '1100', 'النقدية والبنوك', 'assets', 'الحسابات النقدية والبنكية', true),
    (NEW.id, '1101', 'الصندوق الرئيسي', 'assets', 'النقدية في الصندوق', true),
    (NEW.id, '1102', 'البنك', 'assets', 'الحساب البنكي', true),
    (NEW.id, '1200', 'الذمم المدينة', 'assets', 'المبالغ المستحقة من العملاء', true),
    (NEW.id, '1201', 'ذمم العملاء', 'assets', 'حسابات العملاء المدينة', true),
    (NEW.id, '1300', 'الأصول المتداولة', 'assets', 'الأصول المتداولة الأخرى', true),
    (NEW.id, '1301', 'مخزون السيارات', 'assets', 'قيمة السيارات في المخزون', true),
    (NEW.id, '1302', 'المصروفات المقدمة', 'assets', 'مصروفات مدفوعة مقدماً', true)
  RETURNING id INTO cash_account_id;
  
  -- Get specific account IDs
  SELECT id INTO cash_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1101';
  SELECT id INTO inventory_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1301';
  SELECT id INTO prepaid_expenses_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '1302';
  
  -- Liabilities (2xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '2000', 'الخصوم', 'liabilities', 'الخصوم الرئيسية', true),
    (NEW.id, '2100', 'الذمم الدائنة', 'liabilities', 'المبالغ المستحقة للموردين', true),
    (NEW.id, '2101', 'ذمم الموردين', 'liabilities', 'حسابات الموردين الدائنة', true),
    (NEW.id, '2200', 'ضريبة القيمة المضافة', 'liabilities', 'حسابات الضريبة', true),
    (NEW.id, '2201', 'ضريبة المخرجات', 'liabilities', 'ضريبة القيمة المضافة على المبيعات', true),
    (NEW.id, '2202', 'ضريبة المدخلات', 'liabilities', 'ضريبة القيمة المضافة على المشتريات', true),
    (NEW.id, '2203', 'تسوية ضريبة القيمة المضافة', 'liabilities', 'حساب تسوية الضريبة', true);
  
  SELECT id INTO suppliers_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2101';
  SELECT id INTO vat_payable_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2201';
  SELECT id INTO vat_recoverable_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2202';
  SELECT id INTO vat_settlement_id FROM public.account_categories WHERE company_id = NEW.id AND code = '2203';
  
  -- Equity (3xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '3000', 'حقوق الملكية', 'equity', 'حقوق الملكية', true),
    (NEW.id, '3100', 'رأس المال', 'equity', 'رأس مال الشركة', true),
    (NEW.id, '3200', 'الأرباح المحتجزة', 'equity', 'الأرباح المتراكمة', true);
  
  -- Revenue (4xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '4000', 'الإيرادات', 'revenue', 'إيرادات الشركة', true),
    (NEW.id, '4100', 'إيرادات المبيعات', 'revenue', 'إيرادات بيع السيارات', true),
    (NEW.id, '4101', 'مبيعات السيارات', 'revenue', 'إيرادات مبيعات السيارات', true);
  
  SELECT id INTO revenue_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '4101';
  
  -- Expenses (5xxx)
  INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
  VALUES 
    (NEW.id, '5000', 'المصروفات', 'expenses', 'مصروفات الشركة', true),
    (NEW.id, '5100', 'تكلفة البضاعة المباعة', 'expenses', 'تكلفة السيارات المباعة', true),
    (NEW.id, '5101', 'تكلفة المبيعات', 'expenses', 'تكلفة شراء السيارات المباعة', true),
    (NEW.id, '5200', 'المصروفات التشغيلية', 'expenses', 'المصروفات التشغيلية العامة', true),
    (NEW.id, '5201', 'الإيجارات', 'expenses', 'مصروفات الإيجار', true),
    (NEW.id, '5202', 'الرواتب', 'expenses', 'مصروفات الرواتب والأجور', true),
    (NEW.id, '5203', 'الصيانة', 'expenses', 'مصروفات الصيانة', true),
    (NEW.id, '5204', 'المرافق', 'expenses', 'مصروفات الكهرباء والماء', true),
    (NEW.id, '5205', 'مصروفات أخرى', 'expenses', 'مصروفات متنوعة أخرى', true);
  
  SELECT id INTO cogs_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5101';
  SELECT id INTO expense_account_id FROM public.account_categories WHERE company_id = NEW.id AND code = '5200';
  
  -- Create company accounting settings with linked accounts
  INSERT INTO public.company_accounting_settings (
    company_id,
    auto_journal_entries_enabled,
    auto_sales_entries,
    auto_purchase_entries,
    auto_expense_entries,
    sales_cash_account_id,
    sales_revenue_account_id,
    purchase_cash_account_id,
    purchase_inventory_account_id,
    inventory_account_id,
    cogs_account_id,
    suppliers_account_id,
    expense_account_id,
    expense_cash_account_id,
    vat_payable_account_id,
    vat_recoverable_account_id,
    vat_settlement_account_id
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    cash_account_id,
    revenue_account_id,
    cash_account_id,
    inventory_account_id,
    inventory_account_id,
    cogs_account_id,
    suppliers_account_id,
    expense_account_id,
    cash_account_id,
    vat_payable_id,
    vat_recoverable_id,
    vat_settlement_id
  );
  
  -- Create default expense categories
  INSERT INTO public.expense_categories (company_id, name, description, is_active)
  VALUES 
    (NEW.id, 'الإيجارات', 'مصروفات إيجار المعرض والمكاتب', true),
    (NEW.id, 'الرواتب والأجور', 'رواتب الموظفين والعمال', true),
    (NEW.id, 'الصيانة والإصلاحات', 'مصروفات صيانة السيارات والمعدات', true),
    (NEW.id, 'المرافق', 'الكهرباء والماء والهاتف', true),
    (NEW.id, 'التسويق والإعلان', 'مصروفات الدعاية والإعلان', true),
    (NEW.id, 'النقل والمواصلات', 'مصروفات نقل السيارات', true),
    (NEW.id, 'اللوازم المكتبية', 'مستلزمات المكتب', true),
    (NEW.id, 'التأمين', 'مصروفات التأمين', true),
    (NEW.id, 'الرسوم الحكومية', 'رسوم الترخيص والتسجيل', true),
    (NEW.id, 'مصروفات أخرى', 'مصروفات متنوعة', true);
  
  -- Apply default app settings from default_company_settings
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM public.default_company_settings 
    WHERE setting_type = 'app_settings'
  LOOP
    INSERT INTO public.app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Apply default invoice settings
  SELECT setting_value INTO setting_record 
  FROM public.default_company_settings 
  WHERE setting_key = 'invoice_settings' AND setting_type = 'invoice';
  
  IF setting_record IS NOT NULL THEN
    UPDATE public.companies 
    SET invoice_settings = setting_record.setting_value::jsonb 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process pending amortizations (can be called manually or via cron)
CREATE OR REPLACE FUNCTION public.process_prepaid_expense_amortizations()
RETURNS INTEGER AS $$
DECLARE
  amort_record RECORD;
  new_expense_id UUID;
  processed_count INTEGER := 0;
BEGIN
  -- Find all pending amortizations that are due
  FOR amort_record IN 
    SELECT 
      a.*,
      p.company_id,
      p.description as expense_description,
      p.category_id
    FROM public.prepaid_expense_amortizations a
    JOIN public.prepaid_expenses p ON a.prepaid_expense_id = p.id
    WHERE a.status = 'pending' 
      AND a.amortization_date <= CURRENT_DATE
      AND p.status = 'active'
  LOOP
    -- Create expense entry
    INSERT INTO public.expenses (
      company_id,
      description,
      amount,
      expense_date,
      category_id,
      notes,
      payment_method
    )
    VALUES (
      amort_record.company_id,
      'إطفاء: ' || amort_record.expense_description || ' (شهر ' || amort_record.month_number || ')',
      amort_record.amount,
      amort_record.amortization_date,
      amort_record.category_id,
      'قيد إطفاء تلقائي للمصروف المقدم',
      'prepaid'
    )
    RETURNING id INTO new_expense_id;
    
    -- Update amortization record
    UPDATE public.prepaid_expense_amortizations
    SET 
      status = 'processed',
      expense_id = new_expense_id,
      processed_at = now()
    WHERE id = amort_record.id;
    
    -- Update prepaid expense totals
    UPDATE public.prepaid_expenses
    SET 
      amortized_amount = amortized_amount + amort_record.amount,
      remaining_amount = remaining_amount - amort_record.amount,
      status = CASE 
        WHEN remaining_amount - amort_record.amount <= 0 THEN 'completed'
        ELSE status
      END,
      updated_at = now()
    WHERE id = amort_record.prepaid_expense_id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create amortization schedule when prepaid expense is created
CREATE OR REPLACE FUNCTION public.create_amortization_schedule()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
  amort_date DATE;
BEGIN
  -- Create amortization entries for each month
  FOR i IN 1..NEW.number_of_months LOOP
    amort_date := NEW.start_date + ((i - 1) * INTERVAL '1 month');
    
    INSERT INTO public.prepaid_expense_amortizations (
      prepaid_expense_id,
      amortization_date,
      amount,
      month_number,
      status
    )
    VALUES (
      NEW.id,
      amort_date,
      NEW.monthly_amount,
      i,
      'pending'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic amortization schedule creation
DROP TRIGGER IF EXISTS create_amortization_schedule_trigger ON public.prepaid_expenses;
CREATE TRIGGER create_amortization_schedule_trigger
AFTER INSERT ON public.prepaid_expenses
FOR EACH ROW
EXECUTE FUNCTION public.create_amortization_schedule();

-- Add prepaid expenses account to existing companies that don't have it
INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
SELECT c.id, '1302', 'المصروفات المقدمة', 'assets', 'مصروفات مدفوعة مقدماً', true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_categories ac 
  WHERE ac.company_id = c.id AND ac.code = '1302'
);

-- Add rent expense account to existing companies that don't have it
INSERT INTO public.account_categories (company_id, code, name, type, description, is_system)
SELECT c.id, '5201', 'الإيجارات', 'expenses', 'مصروفات الإيجار', true
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_categories ac 
  WHERE ac.company_id = c.id AND ac.code = '5201'
);
