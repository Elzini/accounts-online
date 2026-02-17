
-- Add new fields to employee_contracts matching ERP reference
ALTER TABLE public.employee_contracts
  ADD COLUMN IF NOT EXISTS contract_code TEXT,
  ADD COLUMN IF NOT EXISTS job_level TEXT,
  ADD COLUMN IF NOT EXISTS main_contract TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'duration',
  ADD COLUMN IF NOT EXISTS duration_value INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'year',
  ADD COLUMN IF NOT EXISTS join_date DATE,
  ADD COLUMN IF NOT EXISTS probation_end_date DATE,
  ADD COLUMN IF NOT EXISTS signing_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS pay_cycle TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_allowances_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deductions_json JSONB DEFAULT '[]'::jsonb;
