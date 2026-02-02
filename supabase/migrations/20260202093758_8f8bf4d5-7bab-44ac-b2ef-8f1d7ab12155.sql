-- Create formula_definitions table for storing user-defined formulas
CREATE TABLE public.formula_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  formula_category TEXT NOT NULL, -- 'profit', 'income_statement', 'balance_sheet', 'cash_flow', 'zakat', 'trial_balance'
  formula_key TEXT NOT NULL, -- unique key like 'net_profit', 'gross_profit', 'total_assets'
  formula_name TEXT NOT NULL, -- Arabic display name
  formula_expression JSONB NOT NULL, -- Array of formula nodes with operators and variables
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, formula_category, formula_key)
);

-- Create formula_variables table for available variables/data sources
CREATE TABLE public.formula_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  variable_key TEXT NOT NULL, -- e.g., 'total_sales', 'car_expenses', 'payroll_total'
  variable_name TEXT NOT NULL, -- Arabic display name
  variable_category TEXT NOT NULL, -- 'revenue', 'expense', 'asset', 'liability', 'equity', 'custom'
  data_source TEXT NOT NULL, -- 'sales', 'expenses', 'payroll', 'cars', 'bank_accounts', 'account_categories', 'custom'
  query_definition JSONB, -- Optional: custom query or filter criteria
  is_system BOOLEAN DEFAULT false, -- System variables cannot be deleted
  icon TEXT, -- Icon name for UI
  color TEXT, -- Color for UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formula_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for formula_definitions
CREATE POLICY "Users can view their company formulas"
  ON public.formula_definitions FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create formulas for their company"
  ON public.formula_definitions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company formulas"
  ON public.formula_definitions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company formulas"
  ON public.formula_definitions FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for formula_variables (system variables are viewable by all, company-specific by company)
CREATE POLICY "Users can view system and company variables"
  ON public.formula_variables FOR SELECT
  USING (is_system = true OR company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create variables for their company"
  ON public.formula_variables FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company variables"
  ON public.formula_variables FOR UPDATE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()) AND is_system = false);

CREATE POLICY "Users can delete their company variables"
  ON public.formula_variables FOR DELETE
  USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()) AND is_system = false);

-- Insert default system variables
INSERT INTO public.formula_variables (variable_key, variable_name, variable_category, data_source, is_system, icon, color) VALUES
-- Revenue variables
('total_sales', 'إجمالي المبيعات', 'revenue', 'sales', true, 'DollarSign', 'green'),
('gross_profit_from_sales', 'إجمالي الربح من المبيعات', 'revenue', 'sales', true, 'TrendingUp', 'green'),
('commissions_earned', 'العمولات المكتسبة', 'revenue', 'sales', true, 'Percent', 'green'),

-- Expense variables
('car_expenses', 'مصاريف السيارات', 'expense', 'expenses', true, 'Car', 'red'),
('payroll_total', 'إجمالي الرواتب والبدلات', 'expense', 'payroll', true, 'Users', 'red'),
('rent_expenses', 'مصاريف الإيجار', 'expense', 'prepaid_expenses', true, 'Home', 'red'),
('general_expenses', 'مصاريف عمومية وإدارية', 'expense', 'expenses', true, 'FileText', 'red'),
('vat_expenses', 'ضريبة القيمة المضافة', 'expense', 'expenses', true, 'Receipt', 'orange'),
('financing_costs', 'تكاليف التمويل', 'expense', 'financing', true, 'CreditCard', 'red'),

-- Asset variables
('cash_and_banks', 'النقد والبنوك', 'asset', 'bank_accounts', true, 'Wallet', 'blue'),
('car_inventory', 'مخزون السيارات', 'asset', 'cars', true, 'Car', 'blue'),
('accounts_receivable', 'الذمم المدينة', 'asset', 'installments', true, 'Users', 'blue'),
('fixed_assets_net', 'صافي الأصول الثابتة', 'asset', 'fixed_assets', true, 'Building', 'blue'),
('prepaid_expenses_total', 'المصروفات المقدمة', 'asset', 'prepaid_expenses', true, 'Clock', 'blue'),

-- Liability variables
('accounts_payable', 'الذمم الدائنة', 'liability', 'suppliers', true, 'FileText', 'purple'),
('vat_payable', 'ضريبة القيمة المضافة المستحقة', 'liability', 'account_categories', true, 'Receipt', 'purple'),
('employee_benefits', 'مخصص مكافأة نهاية الخدمة', 'liability', 'payroll', true, 'Users', 'purple'),
('finance_lease_liability', 'التزامات الإيجار التمويلي', 'liability', 'financing', true, 'FileText', 'purple'),

-- Equity variables
('capital', 'رأس المال', 'equity', 'account_categories', true, 'Landmark', 'indigo'),
('retained_earnings', 'الأرباح المبقاة', 'equity', 'account_categories', true, 'PiggyBank', 'indigo'),
('statutory_reserve', 'الاحتياطي النظامي', 'equity', 'account_categories', true, 'Shield', 'indigo'),

-- Zakat specific
('zakat_base', 'الوعاء الزكوي', 'zakat', 'custom', true, 'Calculator', 'amber'),
('zakat_provision', 'مخصص الزكاة', 'zakat', 'custom', true, 'Scale', 'amber'),

-- Custom/Calculated
('profit_before_zakat', 'الربح قبل الزكاة', 'calculated', 'custom', true, 'TrendingUp', 'emerald'),
('net_profit', 'صافي الربح', 'calculated', 'custom', true, 'Award', 'emerald');

-- Trigger for updated_at
CREATE TRIGGER update_formula_definitions_updated_at
  BEFORE UPDATE ON public.formula_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();