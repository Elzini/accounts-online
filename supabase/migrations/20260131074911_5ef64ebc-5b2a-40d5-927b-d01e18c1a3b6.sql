-- إنشاء السنة المالية 2025 (مغلقة)
INSERT INTO fiscal_years (
  id,
  company_id,
  name,
  start_date,
  end_date,
  status,
  is_current,
  notes
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'السنة المالية 2025',
  '2025-01-01',
  '2025-12-31',
  'closed',
  false,
  'السنة المالية المنتهية - تم الإغلاق وترحيل الأرصدة'
);

-- إنشاء السنة المالية 2026 (الحالية)
INSERT INTO fiscal_years (
  id,
  company_id,
  name,
  start_date,
  end_date,
  status,
  is_current,
  notes
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'السنة المالية 2026',
  '2026-01-01',
  '2026-12-31',
  'open',
  true,
  'السنة المالية الحالية'
);