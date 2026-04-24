-- Global supplier de-duplication.
-- Merge duplicate suppliers for EVERY company so we can enforce the unique index.

DO $$
DECLARE
  rec RECORD;
  canonical_id UUID;
  dup_id UUID;
BEGIN
  -- ========== Pass 1: by (company_id, id_number) ==========
  FOR rec IN
    SELECT company_id, id_number
      FROM public.suppliers
     WHERE id_number IS NOT NULL AND id_number <> ''
     GROUP BY company_id, id_number
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO canonical_id
      FROM public.suppliers
     WHERE company_id = rec.company_id
       AND id_number = rec.id_number
     ORDER BY created_at ASC
     LIMIT 1;

    FOR dup_id IN
      SELECT id FROM public.suppliers
       WHERE company_id = rec.company_id
         AND id_number = rec.id_number
         AND id <> canonical_id
    LOOP
      UPDATE public.invoices            SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.cars                SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.checks              SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.credit_debit_notes  SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.goods_receipts      SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.project_costs       SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.purchase_batches    SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.purchase_orders     SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.recurring_invoices  SET supplier_id = canonical_id WHERE supplier_id = dup_id;

      DELETE FROM public.suppliers WHERE id = dup_id;
    END LOOP;
  END LOOP;

  -- ========== Pass 2: also collapse name-only duplicates (no tax #) per company ==========
  FOR rec IN
    SELECT company_id, name
      FROM public.suppliers
     WHERE (id_number IS NULL OR id_number = '')
     GROUP BY company_id, name
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO canonical_id
      FROM public.suppliers
     WHERE company_id = rec.company_id
       AND (id_number IS NULL OR id_number = '')
       AND name = rec.name
     ORDER BY created_at ASC
     LIMIT 1;

    FOR dup_id IN
      SELECT id FROM public.suppliers
       WHERE company_id = rec.company_id
         AND (id_number IS NULL OR id_number = '')
         AND name = rec.name
         AND id <> canonical_id
    LOOP
      UPDATE public.invoices            SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.cars                SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.checks              SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.credit_debit_notes  SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.goods_receipts      SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.project_costs       SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.purchase_batches    SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.purchase_orders     SET supplier_id = canonical_id WHERE supplier_id = dup_id;
      UPDATE public.recurring_invoices  SET supplier_id = canonical_id WHERE supplier_id = dup_id;

      DELETE FROM public.suppliers WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Final safeguard: one supplier per tax number per company.
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_company_tax_unique
  ON public.suppliers (company_id, lower(trim(id_number)))
  WHERE id_number IS NOT NULL AND id_number <> '';