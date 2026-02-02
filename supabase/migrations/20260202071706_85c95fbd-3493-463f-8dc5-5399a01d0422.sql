
-- =====================================================
-- STRICT MULTI-COMPANY ISOLATION SECURITY ENHANCEMENT
-- =====================================================

-- Enable pgcrypto for field-level encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. ENCRYPTION KEY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, key_name)
);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encryption_keys_super_admin_only" ON public.encryption_keys
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND permission = 'super_admin'
        )
    );

-- =====================================================
-- 2. FIELD-LEVEL ENCRYPTION FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
    plain_text TEXT,
    encryption_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF plain_text IS NULL OR plain_text = '' THEN
        RETURN NULL;
    END IF;
    RETURN encode(
        pgp_sym_encrypt(
            plain_text,
            encryption_key,
            'cipher-algo=aes256'
        ),
        'base64'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(
    encrypted_text TEXT,
    encryption_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF encrypted_text IS NULL OR encrypted_text = '' THEN
        RETURN NULL;
    END IF;
    RETURN pgp_sym_decrypt(
        decode(encrypted_text, 'base64'),
        encryption_key
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN '[DECRYPTION_FAILED]';
END;
$$;

-- =====================================================
-- 3. STRICT COMPANY ISOLATION FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.strict_company_check(
    _company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_company_id UUID;
    company_active BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT p.company_id INTO user_company_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid();

    IF user_company_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF user_company_id != _company_id THEN
        RETURN FALSE;
    END IF;

    SELECT is_active INTO company_active
    FROM public.companies
    WHERE id = _company_id;

    IF company_active IS NOT TRUE THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_strict_company_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_company_id UUID;
BEGIN
    SELECT p.company_id INTO result_company_id
    FROM public.profiles p
    INNER JOIN public.companies c ON c.id = p.company_id
    WHERE p.user_id = auth.uid()
    AND c.is_active = true;

    RETURN result_company_id;
END;
$$;

-- =====================================================
-- 4. RBAC WITH DENY-BY-DEFAULT
-- =====================================================

CREATE OR REPLACE FUNCTION public.rbac_check(
    required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND permission = 'super_admin'
    ) INTO has_perm;

    IF has_perm THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND permission = required_permission
    ) INTO has_perm;

    RETURN has_perm;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_with_permission(
    _company_id UUID,
    required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.strict_company_check(_company_id) THEN
        RETURN FALSE;
    END IF;

    IF NOT public.rbac_check(required_permission) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- =====================================================
-- 5. IMMUTABLE AUDIT LOGGING SYSTEM
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'integrity_hash'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN integrity_hash TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'previous_hash'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN previous_hash TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'sequence_number'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN sequence_number BIGINT;
    END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS audit_log_sequence;

CREATE OR REPLACE FUNCTION public.create_immutable_audit_log(
    _user_id UUID,
    _company_id UUID,
    _action TEXT,
    _entity_type TEXT,
    _entity_id TEXT DEFAULT NULL,
    _old_data JSONB DEFAULT NULL,
    _new_data JSONB DEFAULT NULL,
    _ip_address TEXT DEFAULT NULL,
    _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
    prev_hash TEXT;
    new_hash TEXT;
    seq_num BIGINT;
BEGIN
    SELECT integrity_hash, sequence_number INTO prev_hash, seq_num
    FROM public.audit_logs
    WHERE company_id = _company_id
    ORDER BY created_at DESC, sequence_number DESC
    LIMIT 1;

    seq_num := COALESCE(seq_num, 0) + 1;
    new_id := gen_random_uuid();

    new_hash := encode(
        digest(
            COALESCE(_user_id::TEXT, '') || 
            COALESCE(_company_id::TEXT, '') || 
            COALESCE(_action, '') || 
            COALESCE(_entity_type, '') || 
            COALESCE(_entity_id, '') || 
            COALESCE(_old_data::TEXT, '') || 
            COALESCE(_new_data::TEXT, '') || 
            COALESCE(prev_hash, 'GENESIS') ||
            seq_num::TEXT ||
            now()::TEXT,
            'sha256'
        ),
        'hex'
    );

    INSERT INTO public.audit_logs (
        id, user_id, company_id, action, entity_type, entity_id,
        old_data, new_data, ip_address, user_agent,
        integrity_hash, previous_hash, sequence_number, created_at
    ) VALUES (
        new_id, _user_id, _company_id, _action, _entity_type, _entity_id,
        _old_data, _new_data, _ip_address, _user_agent,
        new_hash, prev_hash, seq_num, now()
    );

    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_audit_log_integrity(_company_id UUID)
RETURNS TABLE (
    is_valid BOOLEAN,
    broken_at_id UUID,
    broken_at_sequence BIGINT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    prev_hash TEXT := 'GENESIS';
    log_record RECORD;
BEGIN
    FOR log_record IN 
        SELECT * FROM public.audit_logs 
        WHERE company_id = _company_id 
        ORDER BY sequence_number ASC
    LOOP
        IF log_record.previous_hash IS DISTINCT FROM prev_hash THEN
            RETURN QUERY SELECT 
                FALSE, 
                log_record.id, 
                log_record.sequence_number,
                'Previous hash mismatch - chain broken'::TEXT;
            RETURN;
        END IF;
        prev_hash := log_record.integrity_hash;
    END LOOP;

    RETURN QUERY SELECT TRUE, NULL::UUID, NULL::BIGINT, 'Audit log integrity verified'::TEXT;
END;
$$;

-- =====================================================
-- 6. AUTOMATIC AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _company_id UUID;
    _old_data JSONB;
    _new_data JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        _company_id := (OLD).company_id;
        _old_data := to_jsonb(OLD);
        _new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        _company_id := (NEW).company_id;
        _old_data := NULL;
        _new_data := to_jsonb(NEW);
    ELSE
        _company_id := (NEW).company_id;
        _old_data := to_jsonb(OLD);
        _new_data := to_jsonb(NEW);
    END IF;

    IF _company_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    PERFORM public.create_immutable_audit_log(
        auth.uid(),
        _company_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN (OLD).id::TEXT
            ELSE (NEW).id::TEXT
        END,
        _old_data,
        _new_data
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- =====================================================
-- 7. APPLY AUDIT TRIGGERS TO EXISTING TABLES
-- =====================================================

DO $$
DECLARE
    tbl TEXT;
    sensitive_tables TEXT[] := ARRAY[
        'customers', 'suppliers', 'sales', 'cars', 'expenses',
        'employees', 'payroll_records', 'bank_accounts', 'bank_transactions',
        'journal_entries', 'financing_contracts', 'quotations',
        'fixed_assets', 'vouchers', 'installment_sales', 'installment_payments'
    ];
BEGIN
    FOREACH tbl IN ARRAY sensitive_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', tbl, tbl);
            EXECUTE format(
                'CREATE TRIGGER audit_%I 
                AFTER INSERT OR UPDATE OR DELETE ON public.%I 
                FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger()',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 8. STRICT RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "customers_strict_isolation" ON public.customers;
CREATE POLICY "customers_strict_isolation" ON public.customers
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "suppliers_strict_isolation" ON public.suppliers;
CREATE POLICY "suppliers_strict_isolation" ON public.suppliers
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "cars_strict_isolation" ON public.cars;
CREATE POLICY "cars_strict_isolation" ON public.cars
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "sales_strict_isolation" ON public.sales;
CREATE POLICY "sales_strict_isolation" ON public.sales
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "expenses_strict_isolation" ON public.expenses;
CREATE POLICY "expenses_strict_isolation" ON public.expenses
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "employees_strict_isolation" ON public.employees;
CREATE POLICY "employees_strict_isolation" ON public.employees
    FOR ALL TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'))
    WITH CHECK (public.can_access_with_permission(company_id, 'admin'));

DROP POLICY IF EXISTS "payroll_strict_isolation" ON public.payroll_records;
CREATE POLICY "payroll_strict_isolation" ON public.payroll_records
    FOR ALL TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'))
    WITH CHECK (public.can_access_with_permission(company_id, 'admin'));

DROP POLICY IF EXISTS "bank_accounts_strict_isolation" ON public.bank_accounts;
CREATE POLICY "bank_accounts_strict_isolation" ON public.bank_accounts
    FOR ALL TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'))
    WITH CHECK (public.can_access_with_permission(company_id, 'admin'));

DROP POLICY IF EXISTS "journal_entries_strict_isolation" ON public.journal_entries;
CREATE POLICY "journal_entries_strict_isolation" ON public.journal_entries
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "account_categories_strict_isolation" ON public.account_categories;
CREATE POLICY "account_categories_strict_isolation" ON public.account_categories
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "fiscal_years_strict_isolation" ON public.fiscal_years;
CREATE POLICY "fiscal_years_strict_isolation" ON public.fiscal_years
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "financing_contracts_strict_isolation" ON public.financing_contracts;
CREATE POLICY "financing_contracts_strict_isolation" ON public.financing_contracts
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "quotations_strict_isolation" ON public.quotations;
CREATE POLICY "quotations_strict_isolation" ON public.quotations
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "vouchers_strict_isolation" ON public.vouchers;
CREATE POLICY "vouchers_strict_isolation" ON public.vouchers
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "fixed_assets_strict_isolation" ON public.fixed_assets;
CREATE POLICY "fixed_assets_strict_isolation" ON public.fixed_assets
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "installment_sales_strict_isolation" ON public.installment_sales;
CREATE POLICY "installment_sales_strict_isolation" ON public.installment_sales
    FOR ALL TO authenticated
    USING (public.strict_company_check(company_id))
    WITH CHECK (public.strict_company_check(company_id));

DROP POLICY IF EXISTS "backups_strict_isolation" ON public.backups;
CREATE POLICY "backups_strict_isolation" ON public.backups
    FOR ALL TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'))
    WITH CHECK (public.can_access_with_permission(company_id, 'admin'));

DROP POLICY IF EXISTS "tax_settings_strict_isolation" ON public.tax_settings;
CREATE POLICY "tax_settings_strict_isolation" ON public.tax_settings
    FOR ALL TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'))
    WITH CHECK (public.can_access_with_permission(company_id, 'admin'));

-- AUDIT_LOGS - Immutable
DROP POLICY IF EXISTS "audit_logs_immutable_read" ON public.audit_logs;
CREATE POLICY "audit_logs_immutable_read" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.can_access_with_permission(company_id, 'admin'));

DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
CREATE POLICY "audit_logs_no_update" ON public.audit_logs
    FOR UPDATE TO authenticated
    USING (FALSE);

DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
    FOR DELETE TO authenticated
    USING (FALSE);

DROP POLICY IF EXISTS "profiles_strict_isolation" ON public.profiles;
CREATE POLICY "profiles_strict_isolation" ON public.profiles
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.can_access_with_permission(company_id, 'admin')
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR public.can_access_with_permission(company_id, 'admin')
    );

DROP POLICY IF EXISTS "user_roles_strict_isolation" ON public.user_roles;
CREATE POLICY "user_roles_strict_isolation" ON public.user_roles
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = user_roles.user_id
            AND public.can_access_with_permission(p.company_id, 'users')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = user_roles.user_id
            AND public.can_access_with_permission(p.company_id, 'users')
        )
    );

-- =====================================================
-- 9. PREVENT CROSS-COMPANY DATA LEAKAGE
-- =====================================================

CREATE OR REPLACE FUNCTION public.enforce_company_binding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_company UUID;
BEGIN
    SELECT company_id INTO user_company
    FROM public.profiles
    WHERE user_id = auth.uid();

    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND permission = 'super_admin'
    ) THEN
        RETURN NEW;
    END IF;

    IF NEW.company_id IS NULL THEN
        NEW.company_id := user_company;
    ELSIF NEW.company_id != user_company THEN
        RAISE EXCEPTION 'Cross-company access denied. You can only access data within your company.';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
DECLARE
    tbl TEXT;
    tables_with_company TEXT[] := ARRAY[
        'customers', 'suppliers', 'cars', 'sales', 'expenses',
        'employees', 'journal_entries', 'vouchers', 'quotations',
        'financing_contracts', 'fixed_assets', 'installment_sales'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_with_company
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS enforce_company_%I ON public.%I', tbl, tbl);
            EXECUTE format(
                'CREATE TRIGGER enforce_company_%I 
                BEFORE INSERT OR UPDATE ON public.%I 
                FOR EACH ROW EXECUTE FUNCTION public.enforce_company_binding()',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 10. ENCRYPTED COLUMNS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'id_number_encrypted'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN id_number_encrypted TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'id_number_encrypted'
    ) THEN
        ALTER TABLE public.employees ADD COLUMN id_number_encrypted TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'iban_encrypted'
    ) THEN
        ALTER TABLE public.employees ADD COLUMN iban_encrypted TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bank_accounts' AND column_name = 'account_number_encrypted'
    ) THEN
        ALTER TABLE public.bank_accounts ADD COLUMN account_number_encrypted TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bank_accounts' AND column_name = 'iban_encrypted'
    ) THEN
        ALTER TABLE public.bank_accounts ADD COLUMN iban_encrypted TEXT;
    END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.strict_company_check(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strict_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbac_check(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_with_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_sensitive_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_audit_log_integrity(UUID) TO authenticated;
