-- Make 2025 the current fiscal year
UPDATE public.fiscal_years SET is_current = true, updated_at = now() WHERE id = 'c2b28dc8-8662-4bae-b018-76f2e85135a3';

-- Delete 2026 fiscal year
DELETE FROM public.fiscal_years WHERE id = 'ec948158-e5e0-4ee5-a653-be6640d3dfc8';