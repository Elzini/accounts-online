
ALTER TABLE public.purchase_batches ADD COLUMN IF NOT EXISTS price_includes_tax boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS price_includes_tax boolean NOT NULL DEFAULT false;
