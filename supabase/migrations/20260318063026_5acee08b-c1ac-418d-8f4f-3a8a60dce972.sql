
-- Move "أرباح مستحقة" from equity (code 34) to assets under الذمم المدينة (code 12)
UPDATE account_categories ac
SET 
  code = '1206',
  type = 'assets',
  parent_id = (SELECT id FROM account_categories p WHERE p.company_id = ac.company_id AND p.code = '12' LIMIT 1),
  description = 'أرباح مستحقة التحصيل'
WHERE ac.code = '34' AND ac.name = 'أرباح مستحقة';
