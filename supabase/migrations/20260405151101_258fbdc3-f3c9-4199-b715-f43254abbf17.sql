
ALTER TABLE public.purchase_batches
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS supplier_invoice_number text,
  ADD COLUMN IF NOT EXISTS payment_account_id uuid REFERENCES public.account_categories(id),
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.advanced_projects(id),
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);
