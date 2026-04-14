
CREATE OR REPLACE FUNCTION protect_posted_journal_lines()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' OR current_setting('app.force_deleting_invoice', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = OLD.journal_entry_id AND is_posted = true) THEN
      RAISE EXCEPTION 'Cannot delete lines from posted journal entry';
    END IF;
    RETURN OLD;
  END IF;
  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = OLD.journal_entry_id AND is_posted = true) THEN
    RAISE EXCEPTION 'Cannot modify lines of posted journal entry';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION protect_approved_invoice_items()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' OR current_setting('app.force_deleting_invoice', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.invoices WHERE id = OLD.invoice_id AND status IN ('issued','approved','posted')) THEN
      RAISE EXCEPTION 'Cannot delete items from approved invoice';
    END IF;
    RETURN OLD;
  END IF;
  IF EXISTS (SELECT 1 FROM public.invoices WHERE id = OLD.invoice_id AND status IN ('issued','approved','posted')) THEN
    RAISE EXCEPTION 'Cannot modify items of approved invoice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION protect_approved_invoices()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.resetting_company_data', true) = 'on' OR current_setting('app.force_deleting_invoice', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('issued','approved','posted') THEN RAISE EXCEPTION 'Cannot delete approved invoice'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.status IN ('issued','approved','posted') THEN
    IF (OLD.subtotal IS NOT DISTINCT FROM NEW.subtotal AND OLD.taxable_amount IS NOT DISTINCT FROM NEW.taxable_amount AND OLD.vat_amount IS NOT DISTINCT FROM NEW.vat_amount AND OLD.total IS NOT DISTINCT FROM NEW.total AND OLD.discount_amount IS NOT DISTINCT FROM NEW.discount_amount AND OLD.vat_rate IS NOT DISTINCT FROM NEW.vat_rate AND OLD.invoice_type IS NOT DISTINCT FROM NEW.invoice_type AND OLD.status IS NOT DISTINCT FROM NEW.status) THEN RETURN NEW; END IF;
    IF OLD.status IS DISTINCT FROM NEW.status AND OLD.subtotal IS NOT DISTINCT FROM NEW.subtotal AND OLD.taxable_amount IS NOT DISTINCT FROM NEW.taxable_amount AND OLD.vat_amount IS NOT DISTINCT FROM NEW.vat_amount AND OLD.total IS NOT DISTINCT FROM NEW.total AND OLD.discount_amount IS NOT DISTINCT FROM NEW.discount_amount AND OLD.vat_rate IS NOT DISTINCT FROM NEW.vat_rate THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Cannot modify financial data of approved invoice';
  END IF;
  IF pg_trigger_depth() > 1 THEN
    IF (OLD.subtotal IS DISTINCT FROM NEW.subtotal OR OLD.vat_amount IS DISTINCT FROM NEW.vat_amount OR OLD.total IS DISTINCT FROM NEW.total) THEN
      NEW.subtotal := OLD.subtotal; NEW.taxable_amount := OLD.taxable_amount; NEW.vat_amount := OLD.vat_amount; NEW.total := OLD.total; NEW.discount_amount := OLD.discount_amount; NEW.vat_rate := OLD.vat_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION force_delete_invoice(p_invoice_id uuid)
RETURNS void AS $$
DECLARE v_entry_id uuid;
BEGIN
  PERFORM set_config('app.force_deleting_invoice', 'on', true);
  UPDATE invoices SET journal_entry_id = NULL WHERE id = p_invoice_id;
  FOR v_entry_id IN SELECT id FROM journal_entries WHERE reference_id = p_invoice_id
  LOOP
    UPDATE journal_entries SET is_posted = false WHERE id = v_entry_id;
    DELETE FROM journal_entry_lines WHERE journal_entry_id = v_entry_id;
    DELETE FROM journal_entries WHERE id = v_entry_id;
  END LOOP;
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;
  DELETE FROM invoices WHERE id = p_invoice_id;
  PERFORM set_config('app.force_deleting_invoice', 'off', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
