DO $$
DECLARE
  canonical_id UUID := '4e479ccc-5ca0-434e-b752-f1e9e286e381'; -- بترولنا with tax #
  dup_id UUID       := '6a0e57d0-966f-4d9d-a0e9-26496f87e050'; -- بترولنا without tax #
BEGIN
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
END $$;