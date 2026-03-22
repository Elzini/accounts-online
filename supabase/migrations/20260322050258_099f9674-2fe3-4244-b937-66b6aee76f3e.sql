-- Fix tenant schema: add missing reference_type and reference_id columns to journal_entries
-- Also update create_tenant_schema to include these columns for future companies

-- 1. Fix ALL existing tenant schemas that are missing these columns
DO $$
DECLARE
  schema_rec RECORD;
BEGIN
  FOR schema_rec IN 
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Add reference_type if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = schema_rec.schema_name 
      AND table_name = 'journal_entries' 
      AND column_name = 'reference_type'
    ) THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN reference_type TEXT', schema_rec.schema_name);
    END IF;
    
    -- Add reference_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = schema_rec.schema_name 
      AND table_name = 'journal_entries' 
      AND column_name = 'reference_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN reference_id UUID', schema_rec.schema_name);
    END IF;

    -- Add synced_at if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = schema_rec.schema_name 
      AND table_name = 'journal_entries' 
      AND column_name = 'synced_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I.journal_entries ADD COLUMN synced_at TIMESTAMPTZ', schema_rec.schema_name);
    END IF;
  END LOOP;
END $$;

-- 2. Update create_tenant_schema function to include reference_type, reference_id, synced_at for future tenants
CREATE OR REPLACE FUNCTION create_tenant_schema(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema TEXT := 'tenant_' || replace(p_company_id::text, '-', '_');
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entries (id UUID PRIMARY KEY, entry_number TEXT, entry_date DATE, description TEXT, total_debit NUMERIC DEFAULT 0, total_credit NUMERIC DEFAULT 0, status TEXT DEFAULT ''draft'', reference_type TEXT, reference_id UUID, synced_at TIMESTAMPTZ, fiscal_year_id UUID, created_by UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.journal_entry_lines (id UUID PRIMARY KEY, journal_entry_id UUID, account_id UUID, description TEXT, debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, cost_center_id UUID, created_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.account_categories (id UUID PRIMARY KEY, code TEXT, name TEXT, type TEXT, parent_id UUID, description TEXT, is_system BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.vouchers (id UUID PRIMARY KEY, voucher_number TEXT, voucher_type TEXT, amount NUMERIC DEFAULT 0, description TEXT, beneficiary TEXT, status TEXT DEFAULT ''draft'', voucher_date DATE, journal_entry_id UUID, fiscal_year_id UUID, account_id UUID, created_by UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.sales (id UUID PRIMARY KEY, car_id UUID, customer_id UUID, sale_price NUMERIC DEFAULT 0, sale_date DATE, payment_method TEXT, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.suppliers (id UUID PRIMARY KEY, name TEXT, phone TEXT, id_number_encrypted TEXT, address TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.expenses (id UUID PRIMARY KEY, description TEXT, amount NUMERIC DEFAULT 0, expense_date DATE, category TEXT, account_id UUID, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.checks (id UUID PRIMARY KEY, check_number TEXT, check_type TEXT, amount NUMERIC DEFAULT 0, issue_date DATE, due_date DATE, status TEXT DEFAULT ''pending'', bank_name TEXT, drawer_name TEXT, payee_name TEXT, bank_account_id UUID, customer_id UUID, supplier_id UUID, journal_entry_id UUID, fiscal_year_id UUID, notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.cars (id UUID PRIMARY KEY, name TEXT, chassis_number TEXT, model TEXT, color TEXT, purchase_price NUMERIC DEFAULT 0, purchase_date DATE, status TEXT DEFAULT ''available'', inventory_number INT, supplier_id UUID, fiscal_year_id UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.installments (id UUID PRIMARY KEY, sale_id UUID, customer_id UUID, installment_number INT, amount NUMERIC DEFAULT 0, due_date DATE, paid_date DATE, status TEXT DEFAULT ''pending'', notes TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())', v_schema);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.access_audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT, entity_type TEXT, entity_id UUID, details JSONB, ip_address TEXT, created_at TIMESTAMPTZ DEFAULT now())', v_schema);

  -- Security chain
  PERFORM apply_tenant_schema_rls(v_schema);
  PERFORM create_tenant_db_role(p_company_id);
  PERFORM configure_tenant_encryption(p_company_id);
  PERFORM log_security_event('tenant_provisioned', 'info', p_company_id, NULL, v_schema, NULL, NULL, NULL,
    jsonb_build_object('schema', v_schema, 'security_chain', 'complete'));
  RAISE NOTICE 'Tenant % fully provisioned', v_schema;
END;
$$;