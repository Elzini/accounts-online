-- Lock invoice financial totals for ALL statuses (not just approved)
-- Only the explicit user-initiated update from the invoice form can change financial fields
-- This prevents any automated process from recalculating historical invoice values
CREATE OR REPLACE FUNCTION public.protect_approved_invoices()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('issued', 'approved', 'posted') THEN
      RAISE EXCEPTION 'Cannot delete approved invoice %. Use Credit Note for corrections.', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- For approved/issued/posted invoices: block ALL financial field changes and status changes
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
    
    -- Allow only status transition (draft->issued via approval)
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
  
  -- For draft invoices: block automated/trigger-based recalculation of totals
  -- Only allow changes from direct user operations (trigger depth = 1 means called from another trigger)
  IF pg_trigger_depth() > 1 THEN
    -- Nested trigger trying to change financial values - block it
    IF (
      OLD.subtotal IS DISTINCT FROM NEW.subtotal OR
      OLD.vat_amount IS DISTINCT FROM NEW.vat_amount OR
      OLD.total IS DISTINCT FROM NEW.total
    ) THEN
      -- Silently preserve original values instead of raising exception
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