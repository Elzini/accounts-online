-- Secure reset function: clears business data for one company while preserving core setup/config
CREATE OR REPLACE FUNCTION public.reset_company_data(p_company_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_is_super boolean := false;
  v_is_admin boolean := false;
  v_target_company uuid;
  v_deleted_total bigint := 0;
  v_rows bigint;
  rec record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT public.is_super_admin(v_actor) INTO v_is_super;
  SELECT public.is_admin(v_actor) INTO v_is_admin;

  IF NOT v_is_super AND NOT v_is_admin THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_company_id IS NOT NULL THEN
    IF v_is_super THEN
      v_target_company := p_company_id;
    ELSE
      SELECT company_id INTO v_target_company
      FROM public.profiles
      WHERE user_id = v_actor;

      IF v_target_company IS NULL OR v_target_company <> p_company_id THEN
        RAISE EXCEPTION 'FORBIDDEN';
      END IF;
    END IF;
  ELSE
    SELECT company_id INTO v_target_company
    FROM public.profiles
    WHERE user_id = v_actor;
  END IF;

  IF v_target_company IS NULL THEN
    RAISE EXCEPTION 'COMPANY_NOT_FOUND';
  END IF;

  FOR rec IN
    WITH company_tables AS (
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'company_id'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN (
          'companies',
          'profiles',
          'company_accounting_settings',
          'tax_settings',
          'account_categories',
          'account_mappings',
          'fiscal_years',
          'app_settings',
          'audit_logs',
          'audit_hash_chain',
          'security_events',
          'tenant_encryption_keys',
          'tenant_encryption_config',
          'tenant_rate_limits',
          'tenant_resource_quotas',
          'backup_schedules',
          'company_encryption_keys',
          'api_keys',
          'integration_configs',
          'menu_configuration',
          'dashboard_config',
          'user_preferences',
          'sms_provider_configs'
        )
    ),
    fk_edges AS (
      SELECT child.relname AS child_table,
             parent.relname AS parent_table
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace nchild ON nchild.oid = child.relnamespace AND nchild.nspname = 'public'
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN pg_namespace nparent ON nparent.oid = parent.relnamespace AND nparent.nspname = 'public'
      WHERE con.contype = 'f'
    ),
    rel AS (
      SELECT ct.table_name, 0::int AS depth
      FROM company_tables ct
      UNION ALL
      SELECT e.parent_table, rel.depth + 1
      FROM rel
      JOIN fk_edges e ON e.child_table = rel.table_name
      WHERE e.parent_table IN (SELECT table_name FROM company_tables)
        AND rel.depth < 50
    ),
    ordered AS (
      SELECT ct.table_name, COALESCE(MAX(rel.depth), 0) AS depth
      FROM company_tables ct
      LEFT JOIN rel ON rel.table_name = ct.table_name
      GROUP BY ct.table_name
    )
    SELECT table_name
    FROM ordered
    ORDER BY depth ASC, table_name ASC
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', rec.table_name)
      USING v_target_company;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_target_company,
    'deleted_rows', v_deleted_total
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_company_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_company_data(uuid) TO authenticated;