
-- Trigger to auto-update inventory quantities when invoice_items are inserted
-- Sales invoices (invoice_type = 'sale') decrease stock
-- Purchase invoices (invoice_type = 'purchase') increase stock

CREATE OR REPLACE FUNCTION public.update_inventory_on_invoice_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_type TEXT;
  v_qty_change NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only process if linked to an inventory item
    IF NEW.inventory_item_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get invoice type
    SELECT invoice_type INTO v_invoice_type
    FROM invoices WHERE id = NEW.invoice_id;

    IF v_invoice_type = 'sale' THEN
      v_qty_change = -NEW.quantity;
    ELSIF v_invoice_type = 'purchase' THEN
      v_qty_change = NEW.quantity;
    ELSE
      RETURN NEW;
    END IF;

    UPDATE items
    SET current_quantity = COALESCE(current_quantity, 0) + v_qty_change,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.inventory_item_id IS NULL THEN
      RETURN OLD;
    END IF;

    SELECT invoice_type INTO v_invoice_type
    FROM invoices WHERE id = OLD.invoice_id;

    -- Reverse the effect
    IF v_invoice_type = 'sale' THEN
      v_qty_change = OLD.quantity; -- add back
    ELSIF v_invoice_type = 'purchase' THEN
      v_qty_change = -OLD.quantity; -- remove
    ELSE
      RETURN OLD;
    END IF;

    UPDATE items
    SET current_quantity = COALESCE(current_quantity, 0) + v_qty_change,
        updated_at = now()
    WHERE id = OLD.inventory_item_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_inventory_on_invoice_item
AFTER INSERT OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_on_invoice_item();
