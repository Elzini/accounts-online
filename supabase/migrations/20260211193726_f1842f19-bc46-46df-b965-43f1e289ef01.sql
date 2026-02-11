
-- 1. دالة التحقق من انتماء المستخدم للشركة
CREATE OR REPLACE FUNCTION public.verify_user_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND company_id = _company_id
  );
$$;

-- 2. جلب شركات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id;
$$;

-- 3. دالة العزل التلقائي
CREATE OR REPLACE FUNCTION public.enforce_company_isolation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NOT NULL AND auth.uid() IS NOT NULL THEN
    IF NOT public.verify_user_company_access(auth.uid(), NEW.company_id::uuid) THEN
      BEGIN
        INSERT INTO public.audit_logs (
          user_id, company_id, entity_type, action, new_data
        ) VALUES (
          auth.uid()::text, NEW.company_id::text, 'security_violation',
          'unauthorized_company_access',
          jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      RAISE EXCEPTION 'Access denied: unauthorized company access attempt logged';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. دالة التحقق من الصلاحية في شركة
CREATE OR REPLACE FUNCTION public.verify_company_permission(_user_id uuid, _company_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND p.company_id = _company_id
      AND ur.permission::text = _permission
  );
$$;

-- 5. تطبيق triggers على الجداول
DO $$
DECLARE
  tbl text;
  tables_to_protect text[] := ARRAY[
    'cars', 'sales', 'customers', 'suppliers', 'expenses',
    'journal_entries', 'journal_entry_lines', 'account_categories', 
    'bank_accounts', 'bank_reconciliations', 'bank_statements', 'bank_transactions',
    'checks', 'custodies', 'contracts', 'employees',
    'fixed_assets', 'inventory_items', 'vouchers',
    'quotations', 'budgets', 'cost_centers', 'currencies',
    'custom_reports', 'backups'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_protect
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS enforce_company_isolation_trigger ON public.%I', tbl);
      EXECUTE format('
        CREATE TRIGGER enforce_company_isolation_trigger
        BEFORE INSERT OR UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.enforce_company_isolation()
      ', tbl);
    END IF;
  END LOOP;
END;
$$;
