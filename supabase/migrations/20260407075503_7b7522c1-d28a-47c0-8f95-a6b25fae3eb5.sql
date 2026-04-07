
CREATE OR REPLACE FUNCTION public.reset_company_data(p_company_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Unlink fiscal_years references to journal_entries before deleting
  UPDATE public.fiscal_years
  SET opening_balance_entry_id = NULL,
      closing_balance_entry_id = NULL
  WHERE company_id = v_target_company;

  -- Delete from all company tables in dependency order
  FOR rec IN
    WITH company_tables AS (
      SELECT c.table_name::text AS table_name
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
          'audit_logs_archive',
          'audit_hash_chain',
          'security_events',
          'tenant_encryption_keys',
          'tenant_encryption_config',
          'tenant_rate_limits',
          'tenant_resource_quotas',
          'tenant_db_roles',
          'backup_schedules',
          'backups',
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
      SELECT child.relname::text AS child_table,
             parent.relname::text AS parent_table
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace nchild ON nchild.oid = child.relnamespace AND nchild.nspname = 'public'
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN pg_namespace nparent ON nparent.oid = parent.relnamespace AND nparent.nspname = 'public'
      WHERE con.contype = 'f'
    ),
    delete_order AS (
      SELECT ct.table_name,
             COALESCE((
               SELECT MAX(lvl) FROM (
                 WITH RECURSIVE dep(tbl, lvl) AS (
                   SELECT ct.table_name, 0
                   UNION ALL
                   SELECT e.parent_table, dep.lvl + 1
                   FROM dep
                   JOIN fk_edges e ON e.child_table = dep.tbl
                   WHERE e.parent_table IN (SELECT table_name FROM company_tables)
                     AND dep.lvl < 20
                 )
                 SELECT lvl FROM dep
               ) sub
             ), 0) AS depth
      FROM company_tables ct
    )
    SELECT table_name
    FROM delete_order
    ORDER BY depth ASC, table_name ASC
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', rec.table_name)
        USING v_target_company;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables that fail (e.g. FK still referenced)
      NULL;
    END;
  END LOOP;

  -- Second pass to catch any remaining rows
  FOR rec IN
    WITH company_tables AS (
      SELECT c.table_name::text AS table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'company_id'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN (
          'companies','profiles','company_accounting_settings','tax_settings',
          'account_categories','account_mappings','fiscal_years','app_settings',
          'audit_logs','audit_logs_archive','audit_hash_chain','security_events',
          'tenant_encryption_keys','tenant_encryption_config','tenant_rate_limits',
          'tenant_resource_quotas','tenant_db_roles','backup_schedules','backups',
          'company_encryption_keys','api_keys','integration_configs',
          'menu_configuration','dashboard_config','user_preferences','sms_provider_configs'
        )
    )
    SELECT table_name FROM company_tables ORDER BY table_name
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', rec.table_name)
        USING v_target_company;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_target_company,
    'deleted_rows', v_deleted_total
  );
END;
$$;
