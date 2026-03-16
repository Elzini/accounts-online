
CREATE OR REPLACE FUNCTION protect_approved_invoices()
RETURNS TRIGGER AS $$
BEGIN
  -- Only block if the invoice is in a protected status
  IF OLD.status IN ('issued', 'approved', 'posted') THEN
    -- Allow updates to non-financial metadata fields only
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
      -- Non-financial fields changed only (payment_status, notes, amount_paid, etc.) - allow
      RETURN NEW;
    END IF;
    
    -- Financial fields or status changed - block
    RAISE EXCEPTION 'Cannot modify financial data of approved invoice %. Use Credit Note for corrections.', OLD.id;
  END IF;
  
  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('issued', 'approved', 'posted') THEN
      RAISE EXCEPTION 'Cannot delete approved invoice %. Use Credit Note for corrections.', OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
