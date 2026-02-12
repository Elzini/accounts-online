
-- إصلاح دالة backfill لتتوافق مع الأعمدة الفعلية
CREATE OR REPLACE FUNCTION public.backfill_tenant_schema(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
  rec RECORD;
BEGIN
  short_id := replace(p_company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  PERFORM create_tenant_schema(p_company_id);

  -- مزامنة شجرة الحسابات
  FOR rec IN SELECT * FROM public.account_categories WHERE company_id = p_company_id LOOP
    EXECUTE format('
      INSERT INTO %I.account_categories (id, code, name, type, parent_id, description, is_system, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.code, rec.name, rec.type, rec.parent_id, rec.description, rec.is_system, rec.created_at, rec.updated_at;
  END LOOP;

  -- مزامنة القيود (بدون status، نستخدم is_posted كـ status)
  FOR rec IN SELECT * FROM public.journal_entries WHERE company_id = p_company_id LOOP
    EXECUTE format('
      INSERT INTO %I.journal_entries (id, entry_number, entry_date, description, status, total_debit, total_credit, reference_type, reference_id, fiscal_year_id, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.entry_number, rec.entry_date, rec.description, 
          CASE WHEN rec.is_posted THEN 'posted' ELSE 'draft' END,
          rec.total_debit, rec.total_credit, rec.reference_type, rec.reference_id, rec.fiscal_year_id, rec.created_at, rec.updated_at;
  END LOOP;

  -- مزامنة سطور القيود
  FOR rec IN 
    SELECT jel.*, ac.code as account_code, ac.name as account_name
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    LEFT JOIN public.account_categories ac ON jel.account_id = ac.id
    WHERE je.company_id = p_company_id
  LOOP
    EXECUTE format('
      INSERT INTO %I.journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, description, debit, credit, cost_center_id, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      ON CONFLICT (id) DO NOTHING
    ', schema_name)
    USING rec.id, rec.journal_entry_id, rec.account_id, rec.account_code, rec.account_name, rec.description, rec.debit, rec.credit, rec.cost_center_id;
  END LOOP;
END;
$$;

-- إصلاح sync trigger أيضاً لاستخدام is_posted بدل status
CREATE OR REPLACE FUNCTION public.sync_journal_entry_to_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  schema_name TEXT;
  short_id TEXT;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  short_id := replace(NEW.company_id::text, '-', '_');
  schema_name := 'tenant_' || short_id;

  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
    PERFORM create_tenant_schema(NEW.company_id);
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    EXECUTE format('
      INSERT INTO %I.journal_entries (id, entry_number, entry_date, description, status, total_debit, total_credit, reference_type, reference_id, fiscal_year_id, created_at, updated_at, synced_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
      ON CONFLICT (id) DO UPDATE SET
        entry_number = EXCLUDED.entry_number,
        entry_date = EXCLUDED.entry_date,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        total_debit = EXCLUDED.total_debit,
        total_credit = EXCLUDED.total_credit,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        synced_at = now()
    ', schema_name)
    USING NEW.id, NEW.entry_number, NEW.entry_date, NEW.description, 
          CASE WHEN NEW.is_posted THEN 'posted' ELSE 'draft' END,
          NEW.total_debit, NEW.total_credit, NEW.reference_type, NEW.reference_id, NEW.fiscal_year_id, NEW.created_at, NEW.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    EXECUTE format('DELETE FROM %I.journal_entries WHERE id = $1', schema_name) USING OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
