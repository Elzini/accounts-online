-- Add VAT Settlement account to existing companies
INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
SELECT 
  ac.company_id,
  '2203',
  'حساب تسوية ضريبة القيمة المضافة',
  'liabilities',
  true,
  ac.id,
  'حساب تسوية الضريبة مع هيئة الزكاة والضريبة والجمارك'
FROM account_categories ac
WHERE ac.code = '22' 
  AND ac.type = 'liabilities'
  AND NOT EXISTS (
    SELECT 1 FROM account_categories existing 
    WHERE existing.company_id = ac.company_id 
    AND existing.code = '2203'
  );

-- Add vat_settlement_account_id column to company_accounting_settings
ALTER TABLE company_accounting_settings 
ADD COLUMN IF NOT EXISTS vat_settlement_account_id uuid REFERENCES account_categories(id);

-- Add comment for clarity
COMMENT ON COLUMN company_accounting_settings.vat_settlement_account_id IS 'حساب تسوية ضريبة القيمة المضافة مع الزكاة';