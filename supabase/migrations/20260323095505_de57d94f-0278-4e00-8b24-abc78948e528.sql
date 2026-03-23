
-- Add company_id to invoice_items - with trigger disable for backfill
ALTER TABLE public.invoice_items 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

ALTER TABLE public.invoice_items DISABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoice_items DISABLE TRIGGER trg_update_inventory_on_invoice_item;

UPDATE public.invoice_items ii
SET company_id = inv.company_id
FROM public.invoices inv
WHERE ii.invoice_id = inv.id AND ii.company_id IS NULL;

ALTER TABLE public.invoice_items ENABLE TRIGGER trg_protect_approved_invoice_items;
ALTER TABLE public.invoice_items ENABLE TRIGGER trg_update_inventory_on_invoice_item;

CREATE INDEX IF NOT EXISTS idx_invoice_items_company ON public.invoice_items(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_company_invoice ON public.invoice_items(company_id, invoice_id);

CREATE OR REPLACE FUNCTION public.auto_set_invoice_items_company_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.invoices WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_invoice_items_company_id ON public.invoice_items;
CREATE TRIGGER trg_auto_invoice_items_company_id
  BEFORE INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_invoice_items_company_id();
