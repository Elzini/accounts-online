-- =============================================
-- النظام المحاسبي المتكامل
-- =============================================

-- 1. إعدادات الضريبة لكل شركة
CREATE TABLE public.tax_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tax_name TEXT NOT NULL DEFAULT 'ضريبة القيمة المضافة',
  tax_rate NUMERIC NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  apply_to_sales BOOLEAN NOT NULL DEFAULT true,
  apply_to_purchases BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- 2. شجرة الحسابات (Chart of Accounts)
CREATE TABLE public.account_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assets', 'liabilities', 'equity', 'revenue', 'expenses')),
  parent_id UUID REFERENCES public.account_categories(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 3. دفتر اليومية (Journal Entries)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entry_number SERIAL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase', 'manual', 'adjustment', 'opening')),
  reference_id UUID,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. تفاصيل القيود (Journal Entry Lines)
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.account_categories(id) ON DELETE RESTRICT,
  description TEXT,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_settings
CREATE POLICY "View tax settings in company" ON public.tax_settings
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Manage tax settings in company" ON public.tax_settings
  FOR ALL USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
  );

-- RLS Policies for account_categories
CREATE POLICY "View accounts in company" ON public.account_categories
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Manage accounts in company" ON public.account_categories
  FOR ALL USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
  );

-- RLS Policies for journal_entries
CREATE POLICY "View journal entries in company" ON public.journal_entries
  FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND 
     (has_permission(auth.uid(), 'reports') OR is_admin(auth.uid())))
  );

CREATE POLICY "Insert journal entries in company" ON public.journal_entries
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id(auth.uid()) AND 
    (has_permission(auth.uid(), 'sales') OR has_permission(auth.uid(), 'purchases') OR is_admin(auth.uid()))
  );

CREATE POLICY "Update journal entries in company" ON public.journal_entries
  FOR UPDATE USING (
    company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())
  );

CREATE POLICY "Delete journal entries in company" ON public.journal_entries
  FOR DELETE USING (
    is_super_admin(auth.uid()) OR 
    (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()))
  );

-- RLS Policies for journal_entry_lines
CREATE POLICY "View entry lines via journal" ON public.journal_entry_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
      AND (is_super_admin(auth.uid()) OR 
           (je.company_id = get_user_company_id(auth.uid()) AND 
            (has_permission(auth.uid(), 'reports') OR is_admin(auth.uid()))))
    )
  );

CREATE POLICY "Manage entry lines via journal" ON public.journal_entry_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
      AND (is_super_admin(auth.uid()) OR 
           (je.company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())))
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_categories_updated_at
  BEFORE UPDATE ON public.account_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default accounts for a new company
CREATE OR REPLACE FUNCTION public.create_default_accounts(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assets (الأصول)
  INSERT INTO account_categories (company_id, code, name, type, is_system, description) VALUES
  (p_company_id, '1000', 'الأصول', 'assets', true, 'الحساب الرئيسي للأصول'),
  (p_company_id, '1100', 'النقدية والبنوك', 'assets', true, 'الأرصدة النقدية والحسابات البنكية'),
  (p_company_id, '1200', 'المخزون', 'assets', true, 'مخزون السيارات'),
  (p_company_id, '1300', 'العملاء (المدينون)', 'assets', true, 'المبالغ المستحقة من العملاء');

  -- Liabilities (الخصوم)
  INSERT INTO account_categories (company_id, code, name, type, is_system, description) VALUES
  (p_company_id, '2000', 'الخصوم', 'liabilities', true, 'الحساب الرئيسي للخصوم'),
  (p_company_id, '2100', 'الموردون (الدائنون)', 'liabilities', true, 'المبالغ المستحقة للموردين'),
  (p_company_id, '2200', 'ضريبة القيمة المضافة المستحقة', 'liabilities', true, 'ضريبة المبيعات المستحقة للدفع'),
  (p_company_id, '2300', 'ضريبة القيمة المضافة القابلة للاسترداد', 'liabilities', true, 'ضريبة المشتريات القابلة للاسترداد');

  -- Equity (حقوق الملكية)
  INSERT INTO account_categories (company_id, code, name, type, is_system, description) VALUES
  (p_company_id, '3000', 'حقوق الملكية', 'equity', true, 'رأس المال وحقوق الملكية'),
  (p_company_id, '3100', 'رأس المال', 'equity', true, 'رأس مال الشركة'),
  (p_company_id, '3200', 'الأرباح المحتجزة', 'equity', true, 'الأرباح المتراكمة');

  -- Revenue (الإيرادات)
  INSERT INTO account_categories (company_id, code, name, type, is_system, description) VALUES
  (p_company_id, '4000', 'الإيرادات', 'revenue', true, 'الحساب الرئيسي للإيرادات'),
  (p_company_id, '4100', 'إيرادات المبيعات', 'revenue', true, 'إيرادات بيع السيارات'),
  (p_company_id, '4200', 'إيرادات العمولات', 'revenue', true, 'إيرادات العمولات من المعارض الشريكة');

  -- Expenses (المصروفات)
  INSERT INTO account_categories (company_id, code, name, type, is_system, description) VALUES
  (p_company_id, '5000', 'المصروفات', 'expenses', true, 'الحساب الرئيسي للمصروفات'),
  (p_company_id, '5100', 'تكلفة البضاعة المباعة', 'expenses', true, 'تكلفة شراء السيارات المباعة'),
  (p_company_id, '5200', 'المصروفات الإدارية', 'expenses', true, 'المصروفات الإدارية والعمومية'),
  (p_company_id, '5300', 'مصروفات العمولات', 'expenses', true, 'عمولات المبيعات');
END;
$$;

-- Function to create journal entry for a sale (auto-triggered)
CREATE OR REPLACE FUNCTION public.create_sale_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_tax_rate NUMERIC;
  v_tax_amount NUMERIC;
  v_net_amount NUMERIC;
  v_purchase_price NUMERIC;
  v_revenue_account UUID;
  v_cash_account UUID;
  v_cogs_account UUID;
  v_inventory_account UUID;
  v_tax_account UUID;
BEGIN
  -- Get tax rate for company
  SELECT COALESCE(tax_rate, 0) INTO v_tax_rate
  FROM tax_settings
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_sales = true;
  
  IF v_tax_rate IS NULL THEN
    v_tax_rate := 0;
  END IF;
  
  -- Calculate tax and net amounts
  v_tax_amount := ROUND(NEW.sale_price * (v_tax_rate / (100 + v_tax_rate)), 2);
  v_net_amount := NEW.sale_price - v_tax_amount;
  
  -- Get purchase price for COGS
  SELECT purchase_price INTO v_purchase_price
  FROM cars WHERE id = NEW.car_id;
  
  -- Get account IDs
  SELECT id INTO v_revenue_account FROM account_categories WHERE company_id = NEW.company_id AND code = '4100';
  SELECT id INTO v_cash_account FROM account_categories WHERE company_id = NEW.company_id AND code = '1100';
  SELECT id INTO v_cogs_account FROM account_categories WHERE company_id = NEW.company_id AND code = '5100';
  SELECT id INTO v_inventory_account FROM account_categories WHERE company_id = NEW.company_id AND code = '1200';
  SELECT id INTO v_tax_account FROM account_categories WHERE company_id = NEW.company_id AND code = '2200';
  
  -- Create journal entry
  INSERT INTO journal_entries (company_id, entry_date, description, reference_type, reference_id, total_debit, total_credit, is_posted, created_by)
  VALUES (
    NEW.company_id,
    NEW.sale_date,
    'قيد بيع سيارة - فاتورة رقم ' || NEW.sale_number,
    'sale',
    NEW.id,
    NEW.sale_price + v_purchase_price,
    NEW.sale_price + v_purchase_price,
    true,
    auth.uid()
  )
  RETURNING id INTO v_entry_id;
  
  -- Entry lines
  -- Debit: Cash/Receivables
  IF v_cash_account IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account, 'استلام مبلغ المبيعات', NEW.sale_price, 0);
  END IF;
  
  -- Credit: Revenue
  IF v_revenue_account IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_revenue_account, 'إيراد مبيعات', 0, v_net_amount);
  END IF;
  
  -- Credit: VAT Payable
  IF v_tax_account IS NOT NULL AND v_tax_amount > 0 THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account, 'ضريبة القيمة المضافة المستحقة', 0, v_tax_amount);
  END IF;
  
  -- Debit: COGS
  IF v_cogs_account IS NOT NULL AND v_purchase_price IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cogs_account, 'تكلفة البضاعة المباعة', v_purchase_price, 0);
  END IF;
  
  -- Credit: Inventory
  IF v_inventory_account IS NOT NULL AND v_purchase_price IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account, 'تخفيض المخزون', 0, v_purchase_price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for automatic sale journal entry
CREATE TRIGGER create_sale_journal_entry_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sale_journal_entry();

-- Function to create journal entry for a purchase (auto-triggered)
CREATE OR REPLACE FUNCTION public.create_purchase_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_tax_rate NUMERIC;
  v_tax_amount NUMERIC;
  v_net_amount NUMERIC;
  v_inventory_account UUID;
  v_cash_account UUID;
  v_tax_account UUID;
BEGIN
  -- Get tax rate for company
  SELECT COALESCE(tax_rate, 0) INTO v_tax_rate
  FROM tax_settings
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_purchases = true;
  
  IF v_tax_rate IS NULL THEN
    v_tax_rate := 0;
  END IF;
  
  -- Calculate tax and net amounts
  v_tax_amount := ROUND(NEW.purchase_price * (v_tax_rate / (100 + v_tax_rate)), 2);
  v_net_amount := NEW.purchase_price - v_tax_amount;
  
  -- Get account IDs
  SELECT id INTO v_inventory_account FROM account_categories WHERE company_id = NEW.company_id AND code = '1200';
  SELECT id INTO v_cash_account FROM account_categories WHERE company_id = NEW.company_id AND code = '1100';
  SELECT id INTO v_tax_account FROM account_categories WHERE company_id = NEW.company_id AND code = '2300';
  
  -- Create journal entry
  INSERT INTO journal_entries (company_id, entry_date, description, reference_type, reference_id, total_debit, total_credit, is_posted, created_by)
  VALUES (
    NEW.company_id,
    NEW.purchase_date,
    'قيد شراء سيارة - ' || NEW.name || ' - شاسيه: ' || NEW.chassis_number,
    'purchase',
    NEW.id,
    NEW.purchase_price,
    NEW.purchase_price,
    true,
    auth.uid()
  )
  RETURNING id INTO v_entry_id;
  
  -- Entry lines
  -- Debit: Inventory
  IF v_inventory_account IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account, 'إضافة للمخزون', v_net_amount, 0);
  END IF;
  
  -- Debit: VAT Recoverable
  IF v_tax_account IS NOT NULL AND v_tax_amount > 0 THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account, 'ضريبة مشتريات قابلة للاسترداد', v_tax_amount, 0);
  END IF;
  
  -- Credit: Cash/Payables
  IF v_cash_account IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account, 'دفع مبلغ الشراء', 0, NEW.purchase_price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for automatic purchase journal entry
CREATE TRIGGER create_purchase_journal_entry_trigger
  AFTER INSERT ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.create_purchase_journal_entry();