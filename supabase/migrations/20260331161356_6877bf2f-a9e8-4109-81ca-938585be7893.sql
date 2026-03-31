-- Unpost first to bypass trigger
UPDATE public.journal_entries SET is_posted = false WHERE id IN ('1de489fa-7ab3-4f60-9fdf-37a1a71f4c74', 'c54b7f1c-e555-490d-9034-9c04f660cc57', '3c26367b-5d5b-4a5f-b13f-fb99087783b1', 'd9f9dd67-7107-45d7-ad04-b5d436a577b8');
-- Delete lines
DELETE FROM public.journal_entry_lines WHERE journal_entry_id IN ('1de489fa-7ab3-4f60-9fdf-37a1a71f4c74', 'c54b7f1c-e555-490d-9034-9c04f660cc57', '3c26367b-5d5b-4a5f-b13f-fb99087783b1', 'd9f9dd67-7107-45d7-ad04-b5d436a577b8');
-- Delete headers
DELETE FROM public.journal_entries WHERE id IN ('1de489fa-7ab3-4f60-9fdf-37a1a71f4c74', 'c54b7f1c-e555-490d-9034-9c04f660cc57', '3c26367b-5d5b-4a5f-b13f-fb99087783b1', 'd9f9dd67-7107-45d7-ad04-b5d436a577b8');
-- Also clean duplicate custody transactions for payroll
DELETE FROM public.custody_transactions WHERE custody_id = '98e4a873-2fd7-4d72-b9d8-f1fe2b4d48ae' AND description LIKE '%مسير رواتب%';