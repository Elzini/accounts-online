
-- ============================================================
-- TENANT SCHEMA RLS: Enable RLS + tenant isolation policy
-- on all 12 tables across ALL existing tenant schemas
-- + Update create_tenant_schema to auto-apply for new tenants
-- ============================================================

-- Function to apply RLS to all tables in a specific tenant schema
CREATE OR REPLACE FUNCTION public.apply_tenant_schema_rls(p_schema_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_names TEXT[] := ARRAY[
    'journal_entries', 'journal_entry_lines', 'account_categories',
    'vouchers', 'sales', 'customers', 'suppliers', 'expenses',
    'checks', 'cars', 'installments', 'access_audit_log'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY table_names
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I ENABLE ROW LEVEL SECURITY', p_schema_name, tbl);
    
    -- Force RLS even for table owner
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I FORCE ROW LEVEL SECURITY', p_schema_name, tbl);
    
    -- Drop existing policy if any (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I.%I', p_schema_name, tbl);
    
    -- Create tenant isolation policy
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I.%I FOR ALL USING (
        current_setting(''app.current_tenant'', true) = %L
        OR EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() 
          AND permission = ''super_admin''
        )
      )',
      p_schema_name, tbl,
      replace(replace(p_schema_name, 'tenant_', ''), '_', '-')
    );
    
    RAISE NOTICE 'RLS enabled on %.%', p_schema_name, tbl;
  END LOOP;
END;
$$;

-- Apply RLS to ALL existing tenant schemas
DO $$
DECLARE
  schema_rec RECORD;
BEGIN
  FOR schema_rec IN 
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    PERFORM apply_tenant_schema_rls(schema_rec.schema_name);
  END LOOP;
END;
$$;

-- Update create_tenant_schema to auto-apply RLS after creating tables
CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entries (
    id UUID PRIMARY KEY, entry_number TEXT, entry_date DATE, description TEXT,
    total_debit NUMERIC DEFAULT 0, total_credit NUMERIC DEFAULT 0,
    status TEXT DEFAULT ''draft'', fiscal_year_id UUID, created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (
    id UUID PRIMARY KEY, journal_entry_id UUID, account_id UUID, description TEXT,
    debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, cost_center_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.account_categories (
    id UUID PRIMARY KEY, code TEXT, name TEXT, type TEXT, parent_id UUID,
    description TEXT, is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.vouchers (
    id UUID PRIMARY KEY, voucher_number TEXT, voucher_type TEXT, amount NUMERIC DEFAULT 0,
    description TEXT, beneficiary TEXT, status TEXT DEFAULT ''draft'', voucher_date DATE,
    journal_entry_id UUID, fiscal_year_id UUID, account_id UUID, created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.sales (
    id UUID PRIMARY KEY, car_id UUID, customer_id UUID, sale_price NUMERIC DEFAULT 0,
    sale_date DATE, payment_method TEXT, fiscal_year_id UUID, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (
    id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.suppliers (
    id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.expenses (
    id UUID PRIMARY KEY, description TEXT, amount NUMERIC DEFAULT 0, expense_date DATE,
    category TEXT, account_id UUID, fiscal_year_id UUID, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.checks (
    id UUID PRIMARY KEY, check_number TEXT, check_type TEXT, amount NUMERIC DEFAULT 0,
    issue_date DATE, due_date DATE, status TEXT DEFAULT ''pending'', bank_name TEXT,
    drawer_name TEXT, payee_name TEXT, bank_account_id UUID, customer_id UUID, supplier_id UUID,
    journal_entry_id UUID, fiscal_year_id UUID, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.cars (
    id UUID PRIMARY KEY, name TEXT, chassis_number TEXT, model TEXT, color TEXT,
    purchase_price NUMERIC DEFAULT 0, purchase_date DATE, status TEXT DEFAULT ''available'',
    inventory_number INT, supplier_id UUID, fiscal_year_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.installments (
    id UUID PRIMARY KEY, sale_id UUID, customer_id UUID, installment_number INT,
    amount NUMERIC DEFAULT 0, due_date DATE, paid_date DATE, status TEXT DEFAULT ''pending'', notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.access_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT,
    entity_type TEXT, entity_id UUID, details JSONB, ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )', schema_name);

  -- AUTO-APPLY RLS to all tables
  PERFORM apply_tenant_schema_rls(schema_name);

  RAISE NOTICE 'Tenant schema % created/updated with all tables + RLS', schema_name;
END;
$$;
