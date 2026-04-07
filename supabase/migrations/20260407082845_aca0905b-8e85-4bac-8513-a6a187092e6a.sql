
-- Fix trg_protect_approved_invoices to bypass during reset
CREATE OR REPLACE FUNCTION public.protect_approved_invoices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass during company data reset
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('issued', 'approved', 'posted') THEN
      RAISE EXCEPTION 'Cannot delete approved invoice %. Use Credit Note for corrections.', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status IN ('issued', 'approved', 'posted') THEN
    IF (
      OLD.subtotal IS NOT DISTINCT FROM NEW.subtotal AND
      OLD.taxable_amount IS NOT DISTINCT FROM NEW.taxable_amount AND
      OLD.vat_amount IS NOT DISTINCT FROM NEW.vat_amount AND
      OLD.total IS NOT DISTINCT FROM NEW.total AND
      OLD.discount_amount IS NOT DISTINCT FROM NEW.discount_amount AND
      OLD.vat_rate IS NOT DISTINCT FROM NEW.vat_rate AND
      OLD.invoice_type IS NOT DISTINCT FROM NEW.invoice_type AND
      OLD.status IS NOT DISTINCT FROM NEW.status
    ) THEN
      RETURN NEW;
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status AND
       OLD.subtotal IS NOT DISTINCT FROM NEW.subtotal AND
       OLD.taxable_amount IS NOT DISTINCT FROM NEW.taxable_amount AND
       OLD.vat_amount IS NOT DISTINCT FROM NEW.vat_amount AND
       OLD.total IS NOT DISTINCT FROM NEW.total AND
       OLD.discount_amount IS NOT DISTINCT FROM NEW.discount_amount AND
       OLD.vat_rate IS NOT DISTINCT FROM NEW.vat_rate THEN
      RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Cannot modify financial data of approved invoice %. Use Credit Note for corrections.', OLD.id;
  END IF;
  
  IF pg_trigger_depth() > 1 THEN
    IF (
      OLD.subtotal IS DISTINCT FROM NEW.subtotal OR
      OLD.vat_amount IS DISTINCT FROM NEW.vat_amount OR
      OLD.total IS DISTINCT FROM NEW.total
    ) THEN
      NEW.subtotal := OLD.subtotal;
      NEW.taxable_amount := OLD.taxable_amount;
      NEW.vat_amount := OLD.vat_amount;
      NEW.total := OLD.total;
      NEW.discount_amount := OLD.discount_amount;
      NEW.vat_rate := OLD.vat_rate;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix trg_protect_approved_invoice_items
CREATE OR REPLACE FUNCTION public.protect_approved_invoice_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.invoices WHERE id = OLD.invoice_id AND status IN ('issued', 'approved', 'posted')) THEN
      RAISE EXCEPTION 'Cannot delete items from approved invoice';
    END IF;
    RETURN OLD;
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE id = OLD.invoice_id AND status IN ('issued', 'approved', 'posted')) THEN
    RAISE EXCEPTION 'Cannot modify items of approved invoice';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix enforce_reconciliation_immutability
CREATE OR REPLACE FUNCTION public.enforce_reconciliation_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('approved', 'completed') THEN
      RAISE EXCEPTION 'Cannot modify an approved/completed bank reconciliation.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('approved', 'completed') THEN
      RAISE EXCEPTION 'Cannot delete an approved/completed bank reconciliation.';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix enforce_transaction_immutability
CREATE OR REPLACE FUNCTION public.enforce_transaction_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_matched = true THEN
      RAISE EXCEPTION 'Cannot modify a matched bank transaction.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_matched = true THEN
      RAISE EXCEPTION 'Cannot delete a matched bank transaction.';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix enforce_company_* triggers to allow DELETE during reset
-- These triggers only handle INSERT (RETURN NEW) so they block DELETE implicitly
-- We need to check all enforce_company_* functions

CREATE OR REPLACE FUNCTION public.enforce_company_invoices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_company UUID;
BEGIN
    IF current_setting('app.resetting_company_data', true) = 'on' THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;

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
        RAISE EXCEPTION 'Cross-company access denied.';
    END IF;

    RETURN NEW;
END;
$$;

-- Fix trg_protect_posted_journal_lines  
CREATE OR REPLACE FUNCTION public.protect_posted_journal_lines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = OLD.journal_entry_id AND status = 'posted') THEN
      RAISE EXCEPTION 'Cannot delete lines from posted journal entry';
    END IF;
    RETURN OLD;
  END IF;

  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = OLD.journal_entry_id AND status = 'posted') THEN
    RAISE EXCEPTION 'Cannot modify lines of posted journal entry';
  END IF;

  RETURN NEW;
END;
$$;
