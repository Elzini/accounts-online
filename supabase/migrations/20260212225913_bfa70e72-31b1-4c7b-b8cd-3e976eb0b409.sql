
-- ============================================================
-- PART 1: Additional Mirror Tables in Tenant Schemas
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_company_id UUID)
RETURNS void AS $$
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

  RAISE NOTICE 'Tenant schema % created/updated with all tables', schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- PART 2: Sync Triggers for NEW tables
-- ============================================================

-- Sales
CREATE OR REPLACE FUNCTION public.sync_sale_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.sales WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.sales (id,car_id,customer_id,sale_price,sale_date,payment_method,fiscal_year_id,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET car_id=$2,customer_id=$3,sale_price=$4,sale_date=$5,payment_method=$6,fiscal_year_id=$7,notes=$8,updated_at=$10', schema_name)
    USING NEW.id, NEW.car_id, NEW.customer_id, NEW.sale_price, NEW.sale_date, NEW.payment_method, NEW.fiscal_year_id, NEW.notes, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for sales %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_sale_to_tenant ON public.sales;
CREATE TRIGGER trg_sync_sale_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.sync_sale_to_tenant();

-- Customers
CREATE OR REPLACE FUNCTION public.sync_customer_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.customers WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.customers (id,name,phone,id_number_encrypted,address,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET name=$2,phone=$3,id_number_encrypted=$4,address=$5,notes=$6,updated_at=$8', schema_name)
    USING NEW.id, NEW.name, NEW.phone, NEW.id_number, NEW.address, NEW.notes, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for customers %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_customer_to_tenant ON public.customers;
CREATE TRIGGER trg_sync_customer_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.sync_customer_to_tenant();

-- Suppliers
CREATE OR REPLACE FUNCTION public.sync_supplier_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.suppliers WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.suppliers (id,name,phone,id_number_encrypted,address,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET name=$2,phone=$3,id_number_encrypted=$4,address=$5,notes=$6,updated_at=$8', schema_name)
    USING NEW.id, NEW.name, NEW.phone, NEW.id_number, NEW.address, NEW.notes, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for suppliers %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_supplier_to_tenant ON public.suppliers;
CREATE TRIGGER trg_sync_supplier_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.sync_supplier_to_tenant();

-- Expenses
CREATE OR REPLACE FUNCTION public.sync_expense_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.expenses WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.expenses (id,description,amount,expense_date,category,account_id,fiscal_year_id,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET description=$2,amount=$3,expense_date=$4,category=$5,account_id=$6,fiscal_year_id=$7,notes=$8,updated_at=$10', schema_name)
    USING NEW.id, NEW.description, NEW.amount, NEW.expense_date, NEW.category, NEW.account_id, NEW.fiscal_year_id, NEW.notes, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for expenses %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_expense_to_tenant ON public.expenses;
CREATE TRIGGER trg_sync_expense_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.sync_expense_to_tenant();

-- Checks
CREATE OR REPLACE FUNCTION public.sync_check_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.checks WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.checks (id,check_number,check_type,amount,issue_date,due_date,status,bank_name,drawer_name,payee_name,bank_account_id,customer_id,supplier_id,journal_entry_id,fiscal_year_id,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO UPDATE SET check_number=$2,check_type=$3,amount=$4,issue_date=$5,due_date=$6,status=$7,bank_name=$8,drawer_name=$9,payee_name=$10,bank_account_id=$11,customer_id=$12,supplier_id=$13,journal_entry_id=$14,fiscal_year_id=$15,notes=$16,updated_at=$18', schema_name)
    USING NEW.id, NEW.check_number, NEW.check_type, NEW.amount, NEW.issue_date, NEW.due_date, NEW.status, NEW.bank_name, NEW.drawer_name, NEW.payee_name, NEW.bank_account_id, NEW.customer_id, NEW.supplier_id, NEW.journal_entry_id, NEW.fiscal_year_id, NEW.notes, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for checks %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_check_to_tenant ON public.checks;
CREATE TRIGGER trg_sync_check_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.checks FOR EACH ROW EXECUTE FUNCTION public.sync_check_to_tenant();

-- Cars
CREATE OR REPLACE FUNCTION public.sync_car_to_tenant()
RETURNS TRIGGER AS $$
DECLARE schema_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      schema_name := 'tenant_' || replace(OLD.company_id::text, '-', '_');
      EXECUTE format('DELETE FROM %I.cars WHERE id = $1', schema_name) USING OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  schema_name := 'tenant_' || replace(NEW.company_id::text, '-', '_');
  BEGIN
    EXECUTE format('INSERT INTO %I.cars (id,name,chassis_number,model,color,purchase_price,purchase_date,status,inventory_number,supplier_id,fiscal_year_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET name=$2,chassis_number=$3,model=$4,color=$5,purchase_price=$6,purchase_date=$7,status=$8,inventory_number=$9,supplier_id=$10,fiscal_year_id=$11,updated_at=$13', schema_name)
    USING NEW.id, NEW.name, NEW.chassis_number, NEW.model, NEW.color, NEW.purchase_price, NEW.purchase_date, NEW.status, NEW.inventory_number, NEW.supplier_id, NEW.fiscal_year_id, NEW.created_at, NEW.updated_at;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Tenant sync failed for cars %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_car_to_tenant ON public.cars;
CREATE TRIGGER trg_sync_car_to_tenant AFTER INSERT OR UPDATE OR DELETE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.sync_car_to_tenant();

-- ============================================================
-- PART 3: Per-Tenant Encryption (BYOK - AES-256)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  key_encrypted TEXT NOT NULL,
  key_version INT DEFAULT 1,
  algorithm TEXT DEFAULT 'aes-256-gcm',
  is_active BOOLEAN DEFAULT true,
  rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to encryption keys"
  ON public.tenant_encryption_keys FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.generate_tenant_encryption_key(p_company_id UUID)
RETURNS void AS $$
DECLARE
  raw_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
BEGIN
  raw_key := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.tenant_encryption_keys (company_id, key_encrypted)
  VALUES (p_company_id, encode(encrypt(raw_key::bytea, master_key::bytea, 'aes'), 'base64'))
  ON CONFLICT (company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.tenant_encrypt(p_company_id UUID, p_data TEXT)
RETURNS TEXT AS $$
DECLARE
  enc_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  raw_key TEXT;
BEGIN
  SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  IF enc_key IS NULL THEN
    PERFORM public.generate_tenant_encryption_key(p_company_id);
    SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  END IF;
  raw_key := convert_from(decrypt(decode(enc_key, 'base64'), master_key::bytea, 'aes'), 'utf8');
  RETURN encode(encrypt(p_data::bytea, decode(raw_key, 'hex'), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.tenant_decrypt(p_company_id UUID, p_encrypted TEXT)
RETURNS TEXT AS $$
DECLARE
  enc_key TEXT;
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  raw_key TEXT;
BEGIN
  IF p_encrypted IS NULL THEN RETURN NULL; END IF;
  SELECT key_encrypted INTO enc_key FROM public.tenant_encryption_keys WHERE company_id = p_company_id AND is_active = true;
  IF enc_key IS NULL THEN RETURN NULL; END IF;
  raw_key := convert_from(decrypt(decode(enc_key, 'base64'), master_key::bytea, 'aes'), 'utf8');
  RETURN convert_from(decrypt(decode(p_encrypted, 'base64'), decode(raw_key, 'hex'), 'aes'), 'utf8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.rotate_tenant_encryption_key(p_company_id UUID)
RETURNS void AS $$
DECLARE
  master_key TEXT := coalesce(current_setting('app.master_encryption_key', true), 'default-master-key-change-in-production');
  new_raw_key TEXT;
BEGIN
  new_raw_key := encode(gen_random_bytes(32), 'hex');
  UPDATE public.tenant_encryption_keys
  SET key_encrypted = encode(encrypt(new_raw_key::bytea, master_key::bytea, 'aes'), 'base64'),
      key_version = key_version + 1, rotated_at = now(), updated_at = now()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- PART 4: Resource Quotas & Rate Limiting
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_resource_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  max_requests_per_minute INT DEFAULT 100,
  max_storage_mb INT DEFAULT 500,
  max_users INT DEFAULT 50,
  max_records_per_table INT DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_resource_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own company quotas"
  ON public.tenant_resource_quotas FOR SELECT USING (
    company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.tenant_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INT DEFAULT 1,
  endpoint TEXT,
  UNIQUE(company_id, window_start)
);

ALTER TABLE public.tenant_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to rate limits"
  ON public.tenant_rate_limits FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_company_id UUID, p_endpoint TEXT DEFAULT 'general')
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
  max_rpm INT;
  time_window TIMESTAMPTZ;
BEGIN
  SELECT max_requests_per_minute INTO max_rpm FROM public.tenant_resource_quotas WHERE company_id = p_company_id AND is_active = true;
  IF max_rpm IS NULL THEN max_rpm := 100; END IF;
  time_window := date_trunc('minute', now());
  INSERT INTO public.tenant_rate_limits (company_id, window_start, request_count, endpoint)
  VALUES (p_company_id, time_window, 1, p_endpoint)
  ON CONFLICT (company_id, window_start) DO UPDATE SET request_count = public.tenant_rate_limits.request_count + 1
  RETURNING request_count INTO current_count;
  DELETE FROM public.tenant_rate_limits WHERE window_start < now() - interval '5 minutes';
  RETURN current_count <= max_rpm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cross-tenant access blocking
CREATE OR REPLACE FUNCTION public.block_cross_tenant_access()
RETURNS TRIGGER AS $$
DECLARE user_company_id UUID;
BEGIN
  SELECT company_id INTO user_company_id FROM public.profiles WHERE user_id = auth.uid();
  IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.company_id IS NOT NULL AND user_company_id IS NOT NULL AND NEW.company_id != user_company_id THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, company_id, old_data)
    VALUES (auth.uid(), 'CROSS_TENANT_ACCESS_BLOCKED', TG_TABLE_NAME, NEW.id, user_company_id,
      jsonb_build_object('attempted_company', NEW.company_id, 'user_company', user_company_id));
    RAISE EXCEPTION 'Cross-tenant access denied';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['sales','customers','suppliers','expenses','checks','cars','journal_entries','vouchers','account_categories']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_block_cross_tenant_%s ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_block_cross_tenant_%s BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.block_cross_tenant_access()', tbl, tbl);
  END LOOP;
END $$;

-- Auto-provision for new companies
CREATE OR REPLACE FUNCTION public.provision_new_company_isolation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_tenant_schema(NEW.id);
  PERFORM public.generate_tenant_encryption_key(NEW.id);
  INSERT INTO public.tenant_resource_quotas (company_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_provision_company_isolation ON public.companies;
CREATE TRIGGER trg_provision_company_isolation AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.provision_new_company_isolation();
