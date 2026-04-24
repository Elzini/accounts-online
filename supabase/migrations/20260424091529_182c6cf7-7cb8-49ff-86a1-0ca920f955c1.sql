UPDATE public.invoices
SET invoice_date = '2026-01-16',
    due_date = '2026-01-16',
    updated_at = now()
WHERE id = '139cd51e-a436-47b1-b43e-75d67555a512'
  AND company_id = '08da5618-4da5-411b-b3d9-e22304904dcc'
  AND invoice_number = 'PUR-58';