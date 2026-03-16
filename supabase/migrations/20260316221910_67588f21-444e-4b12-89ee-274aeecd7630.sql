
-- ============================================
-- 1. SYSTEM FREEZE MODE
-- ============================================

INSERT INTO app_settings (key, value, company_id)
VALUES ('system_freeze_mode', 'false', NULL)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_system_frozen()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value::boolean FROM app_settings WHERE key = 'system_freeze_mode' AND company_id IS NULL LIMIT 1),
    false
  );
$$;

-- ============================================
-- 2. FINANCIAL TABLE PROTECTION TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.protect_approved_invoices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('issued', 'approved', 'posted') THEN
      IF NEW.status = OLD.status 
         AND NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
        RETURN NEW;
      END IF;
      IF NEW.status = 'voided' THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cannot modify approved invoice %. Use Credit Note for corrections.', OLD.id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('issued', 'approved', 'posted') THEN
      RAISE EXCEPTION 'Cannot delete approved invoice %. Use Credit Note for corrections.', OLD.id;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_approved_invoices ON invoices;
CREATE TRIGGER trg_protect_approved_invoices
  BEFORE UPDATE OR DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION protect_approved_invoices();

CREATE OR REPLACE FUNCTION public.protect_posted_journal_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('posted', 'approved') THEN
      IF NEW.status = 'reversed' AND OLD.status != 'reversed' THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cannot modify posted journal entry %. Use reversal entry instead.', OLD.entry_number;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('posted', 'approved') THEN
      RAISE EXCEPTION 'Cannot delete posted journal entry %. Use reversal entry instead.', OLD.entry_number;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_posted_journal_entries ON journal_entries;
CREATE TRIGGER trg_protect_posted_journal_entries
  BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION protect_posted_journal_entries();

CREATE OR REPLACE FUNCTION public.protect_approved_invoice_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv_status text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO inv_status FROM invoices WHERE id = OLD.invoice_id;
    IF inv_status IN ('issued', 'approved', 'posted') THEN
      RAISE EXCEPTION 'Cannot modify items of approved invoice. Use Credit Note for corrections.';
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_approved_invoice_items ON invoice_items;
CREATE TRIGGER trg_protect_approved_invoice_items
  BEFORE UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION protect_approved_invoice_items();

CREATE OR REPLACE FUNCTION public.protect_posted_journal_lines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entry_status text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO entry_status FROM journal_entries WHERE id = OLD.journal_entry_id;
    IF entry_status IN ('posted', 'approved') THEN
      RAISE EXCEPTION 'Cannot modify lines of posted journal entry. Use reversal entry instead.';
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_posted_journal_lines ON journal_entry_lines;
CREATE TRIGGER trg_protect_posted_journal_lines
  BEFORE UPDATE OR DELETE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION protect_posted_journal_lines();

-- ============================================
-- 3. SYSTEM CHANGE LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id),
  change_type text NOT NULL,
  module text NOT NULL,
  description text,
  previous_value jsonb,
  new_value jsonb,
  impact_analysis jsonb,
  authorization_method text,
  authorization_code text,
  ip_address text,
  user_agent text,
  status text DEFAULT 'pending',
  simulation_result jsonb,
  backup_id uuid REFERENCES backups(id),
  created_at timestamptz DEFAULT now(),
  applied_at timestamptz
);

ALTER TABLE public.system_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_system_change_log" ON system_change_log
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin')
    OR (company_id IS NOT NULL AND public.strict_company_check(company_id))
  );

-- Immutable change log
CREATE OR REPLACE FUNCTION public.protect_system_change_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'System change log is immutable.';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.change_type != NEW.change_type 
       OR OLD.module != NEW.module 
       OR OLD.description IS DISTINCT FROM NEW.description THEN
      RAISE EXCEPTION 'System change log entries cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_system_change_log ON system_change_log;
CREATE TRIGGER trg_protect_system_change_log
  BEFORE UPDATE OR DELETE ON system_change_log
  FOR EACH ROW
  EXECUTE FUNCTION protect_system_change_log();

-- ============================================
-- 4. FREEZE MODE CHECK
-- ============================================
CREATE OR REPLACE FUNCTION public.check_freeze_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_system_frozen() THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND permission = 'super_admin') THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    RAISE EXCEPTION 'System is in FREEZE MODE. All modifications are blocked.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_check_account_categories ON account_categories;
CREATE TRIGGER trg_freeze_check_account_categories
  BEFORE INSERT OR UPDATE OR DELETE ON account_categories
  FOR EACH ROW
  EXECUTE FUNCTION check_freeze_mode();
