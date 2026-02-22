
-- Temporarily disable the trigger, update data, then re-enable
ALTER TABLE public.sales DISABLE TRIGGER prevent_approved_sale_update;

UPDATE public.sales SET company_id = '3b6672f6-8639-4bab-ae4a-7a359528e03b' WHERE company_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.sales ENABLE TRIGGER prevent_approved_sale_update;
