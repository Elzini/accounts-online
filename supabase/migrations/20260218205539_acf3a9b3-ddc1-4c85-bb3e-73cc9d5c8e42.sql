
-- Drop old FKs (may already be dropped from previous attempt)
ALTER TABLE public.employee_advances DROP CONSTRAINT IF EXISTS employee_advances_employee_id_fkey;
ALTER TABLE public.custody_transactions DROP CONSTRAINT IF EXISTS custody_transactions_employee_id_fkey;
ALTER TABLE public.custodies DROP CONSTRAINT IF EXISTS custodies_employee_id_fkey;

-- Map all old employees IDs to hr_employees IDs
UPDATE public.employee_advances SET employee_id = 'd32818b7-f52c-467c-bbb0-7c96b2e8376b' WHERE employee_id = '091a2070-ee63-4c87-908b-ce2a9591ba04';
UPDATE public.custody_transactions SET employee_id = 'd32818b7-f52c-467c-bbb0-7c96b2e8376b' WHERE employee_id = '091a2070-ee63-4c87-908b-ce2a9591ba04';

UPDATE public.custodies SET employee_id = '0c859ff3-73cc-4994-b7c6-67488bdbf76c' WHERE employee_id = 'a3246c8a-556a-4e86-905f-3b7bc0742118';
UPDATE public.custodies SET employee_id = 'd32818b7-f52c-467c-bbb0-7c96b2e8376b' WHERE employee_id = '091a2070-ee63-4c87-908b-ce2a9591ba04';

-- Handle any remaining orphans by setting to NULL
UPDATE public.employee_advances ea SET employee_id = NULL WHERE NOT EXISTS (SELECT 1 FROM hr_employees h WHERE h.id = ea.employee_id) AND ea.employee_id IS NOT NULL;
UPDATE public.custody_transactions ct SET employee_id = NULL WHERE NOT EXISTS (SELECT 1 FROM hr_employees h WHERE h.id = ct.employee_id) AND ct.employee_id IS NOT NULL;
UPDATE public.custodies c SET employee_id = NULL WHERE NOT EXISTS (SELECT 1 FROM hr_employees h WHERE h.id = c.employee_id) AND c.employee_id IS NOT NULL;

-- Add new FKs referencing hr_employees
ALTER TABLE public.employee_advances ADD CONSTRAINT employee_advances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id);
ALTER TABLE public.custody_transactions ADD CONSTRAINT custody_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id);
ALTER TABLE public.custodies ADD CONSTRAINT custodies_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.hr_employees(id);
