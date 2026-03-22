-- حذف بنود القيود الافتتاحية المكررة أولاً
DELETE FROM journal_entry_lines 
WHERE journal_entry_id IN ('a5692bd3-eed0-4302-b19d-c6dbd08eb28c', '0f2fa980-4b2e-464a-972e-39a9a0413ddb');

-- حذف القيود الافتتاحية المكررة (الآن مسموح بعد إصلاح triggers)
DELETE FROM journal_entries 
WHERE id IN ('a5692bd3-eed0-4302-b19d-c6dbd08eb28c', '0f2fa980-4b2e-464a-972e-39a9a0413ddb');