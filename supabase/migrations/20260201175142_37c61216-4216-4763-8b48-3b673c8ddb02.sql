-- Table for custom report definitions
CREATE TABLE public.custom_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  report_type text NOT NULL DEFAULT 'table', -- 'table', 'chart', 'summary'
  source_table text NOT NULL, -- e.g., 'sales', 'expenses', 'journal_entries'
  columns jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{field, label, visible, order, width}]
  filters jsonb DEFAULT '[]'::jsonb, -- [{field, operator, value}]
  grouping jsonb DEFAULT '[]'::jsonb, -- [{field, aggregate}]
  sorting jsonb DEFAULT '[]'::jsonb, -- [{field, direction}]
  styling jsonb DEFAULT '{}'::jsonb, -- {headerColor, fontSize, orientation}
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for menu/sidebar configuration
CREATE TABLE public.menu_configuration (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  menu_items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{id, label, icon, path, children, visible, order, isCollapsible}]
  theme_settings jsonb NOT NULL DEFAULT '{}'::jsonb, -- {primaryColor, sidebarColor, fontFamily, fontSize}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Table for account mappings (which account links to which transaction type)
CREATE TABLE public.account_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mapping_type text NOT NULL, -- 'sales', 'purchases', 'expenses', 'payroll', 'vouchers', 'vat'
  mapping_key text NOT NULL, -- specific key within type, e.g., 'cash_account', 'revenue_account'
  account_id uuid REFERENCES public.account_categories(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, mapping_type, mapping_key)
);

-- Table for financial statement configurations
CREATE TABLE public.financial_statement_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  statement_type text NOT NULL, -- 'balance_sheet', 'income_statement', 'cash_flow', 'vat_return', 'zakat', 'trial_balance'
  sections jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{name, accountCodes, type, order}]
  display_options jsonb DEFAULT '{}'::jsonb, -- {showSubtotals, showPercentages, comparePeriods}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, statement_type)
);

-- Table for automatic journal entry rules
CREATE TABLE public.journal_entry_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'sale', 'purchase', 'expense', 'voucher', 'payroll', 'prepaid_expense'
  is_enabled boolean NOT NULL DEFAULT true,
  conditions jsonb DEFAULT '[]'::jsonb, -- [{field, operator, value}]
  debit_account_id uuid REFERENCES public.account_categories(id),
  credit_account_id uuid REFERENCES public.account_categories(id),
  amount_field text, -- field to use for amount, e.g., 'sale_price', 'amount'
  description_template text, -- e.g., 'مبيعات سيارة {car_name}'
  priority integer DEFAULT 0, -- higher priority rules run first
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statement_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_reports
CREATE POLICY "View custom reports in company" ON public.custom_reports
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage custom reports in company" ON public.custom_reports
  FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- RLS Policies for menu_configuration
CREATE POLICY "View menu configuration in company" ON public.menu_configuration
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage menu configuration in company" ON public.menu_configuration
  FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- RLS Policies for account_mappings
CREATE POLICY "View account mappings in company" ON public.account_mappings
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage account mappings in company" ON public.account_mappings
  FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- RLS Policies for financial_statement_config
CREATE POLICY "View financial statement config in company" ON public.financial_statement_config
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage financial statement config in company" ON public.financial_statement_config
  FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- RLS Policies for journal_entry_rules
CREATE POLICY "View journal entry rules in company" ON public.journal_entry_rules
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Manage journal entry rules in company" ON public.journal_entry_rules
  FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));