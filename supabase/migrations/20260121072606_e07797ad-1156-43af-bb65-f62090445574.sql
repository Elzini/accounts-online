-- جدول شركات التمويل
CREATE TABLE public.financing_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  api_endpoint TEXT, -- للربط المستقبلي مع APIs
  api_key_encrypted TEXT, -- مفتاح API مشفر
  commission_rate NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عقود التمويل
CREATE TABLE public.financing_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  contract_number TEXT NOT NULL,
  financing_company_id UUID NOT NULL REFERENCES public.financing_companies(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.customers(id),
  sale_id UUID REFERENCES public.sales(id),
  car_id UUID REFERENCES public.cars(id),
  
  -- تفاصيل التمويل
  total_amount NUMERIC NOT NULL,
  down_payment NUMERIC NOT NULL DEFAULT 0,
  financed_amount NUMERIC NOT NULL,
  profit_rate NUMERIC NOT NULL DEFAULT 0, -- معدل الربح السنوي
  number_of_months INTEGER NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  
  -- التواريخ
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_payment_date DATE NOT NULL,
  last_payment_date DATE,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'defaulted', 'cancelled')),
  
  -- المبالغ المحولة
  amount_received_from_bank NUMERIC DEFAULT 0,
  bank_transfer_date DATE,
  bank_reference TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أقساط التمويل
CREATE TABLE public.financing_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.financing_contracts(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  
  -- تفاصيل السداد
  paid_amount NUMERIC DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  bank_reference TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'waived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الحسابات البنكية
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  account_category_id UUID REFERENCES public.account_categories(id), -- ربط مع دليل الحسابات
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول كشوفات البنك المستوردة
CREATE TABLE public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  file_name TEXT,
  import_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id),
  total_transactions INTEGER DEFAULT 0,
  matched_transactions INTEGER DEFAULT 0,
  unmatched_transactions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول معاملات كشف البنك
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT,
  reference TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,
  
  -- المطابقة
  is_matched BOOLEAN DEFAULT false,
  matched_type TEXT, -- 'sale', 'purchase', 'expense', 'voucher', 'journal', 'financing'
  matched_id UUID,
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تسوية البنك
CREATE TABLE public.bank_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  statement_ending_balance NUMERIC NOT NULL,
  book_balance NUMERIC NOT NULL,
  adjusted_book_balance NUMERIC,
  difference NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved')),
  prepared_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financing_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Policies for financing_companies
CREATE POLICY "View financing_companies in company" ON public.financing_companies
  FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()))));

CREATE POLICY "Manage financing_companies in company" ON public.financing_companies
  FOR ALL USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Policies for financing_contracts
CREATE POLICY "View financing_contracts in company" ON public.financing_contracts
  FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'reports'::user_permission) OR is_admin(auth.uid()))));

CREATE POLICY "Insert financing_contracts in company" ON public.financing_contracts
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid())));

CREATE POLICY "Update financing_contracts in company" ON public.financing_contracts
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid())));

CREATE POLICY "Delete financing_contracts in company" ON public.financing_contracts
  FOR DELETE USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Policies for financing_payments
CREATE POLICY "View financing_payments via contract" ON public.financing_payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM financing_contracts c WHERE c.id = financing_payments.contract_id AND (is_super_admin(auth.uid()) OR (c.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR has_permission(auth.uid(), 'reports'::user_permission) OR is_admin(auth.uid()))))));

CREATE POLICY "Manage financing_payments via contract" ON public.financing_payments
  FOR ALL USING (EXISTS (SELECT 1 FROM financing_contracts c WHERE c.id = financing_payments.contract_id AND (is_super_admin(auth.uid()) OR (c.company_id = get_user_company_id(auth.uid()) AND (has_permission(auth.uid(), 'sales'::user_permission) OR is_admin(auth.uid()))))));

-- Policies for bank_accounts
CREATE POLICY "View bank_accounts in company" ON public.bank_accounts
  FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

CREATE POLICY "Manage bank_accounts in company" ON public.bank_accounts
  FOR ALL USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Policies for bank_statements
CREATE POLICY "View bank_statements in company" ON public.bank_statements
  FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

CREATE POLICY "Manage bank_statements in company" ON public.bank_statements
  FOR ALL USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Policies for bank_transactions
CREATE POLICY "View bank_transactions via statement" ON public.bank_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM bank_statements s WHERE s.id = bank_transactions.statement_id AND (is_super_admin(auth.uid()) OR (s.company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())))));

CREATE POLICY "Manage bank_transactions via statement" ON public.bank_transactions
  FOR ALL USING (EXISTS (SELECT 1 FROM bank_statements s WHERE s.id = bank_transactions.statement_id AND (is_super_admin(auth.uid()) OR (s.company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())))));

-- Policies for bank_reconciliations
CREATE POLICY "View bank_reconciliations in company" ON public.bank_reconciliations
  FOR SELECT USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

CREATE POLICY "Manage bank_reconciliations in company" ON public.bank_reconciliations
  FOR ALL USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER update_financing_companies_updated_at BEFORE UPDATE ON public.financing_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financing_contracts_updated_at BEFORE UPDATE ON public.financing_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financing_payments_updated_at BEFORE UPDATE ON public.financing_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_reconciliations_updated_at BEFORE UPDATE ON public.bank_reconciliations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add financing to journal entry reference types
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_reference_type_check;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_reference_type_check 
  CHECK (reference_type = ANY (ARRAY['sale'::text, 'purchase'::text, 'manual'::text, 'adjustment'::text, 'opening'::text, 'expense'::text, 'voucher'::text, 'financing'::text, 'bank_reconciliation'::text]));