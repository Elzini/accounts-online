-- Update old journal entry lines to use new cars account (4101) instead of used cars (4102)

-- Step 1: Update journal entry lines - change account from 4102 to 4101 for sales
UPDATE journal_entry_lines
SET 
  account_id = (
    SELECT new_acc.id 
    FROM journal_entries je
    JOIN account_categories new_acc ON new_acc.company_id = je.company_id AND new_acc.code = '4101'
    WHERE je.id = journal_entry_lines.journal_entry_id
    LIMIT 1
  ),
  description = CASE 
    WHEN description LIKE '%مستعملة%' THEN REPLACE(description, 'مستعملة', 'جديدة')
    WHEN description LIKE '%المستعملة%' THEN REPLACE(description, 'المستعملة', 'الجديدة')
    WHEN description = 'إيراد المبيعات' THEN 'إيراد مبيعات سيارات جديدة'
    WHEN description = 'إيراد مبيعات' THEN 'إيراد مبيعات سيارات جديدة'
    ELSE description
  END
WHERE journal_entry_id IN (
  SELECT je.id FROM journal_entries je WHERE je.reference_type = 'sale'
)
AND account_id IN (
  SELECT acc.id FROM account_categories acc WHERE acc.code = '4102'
);

-- Step 2: Update journal entry header descriptions
UPDATE journal_entries
SET description = CASE 
  WHEN description LIKE '%مستعملة%' THEN REPLACE(description, 'مستعملة', 'جديدة')
  WHEN description LIKE '%المستعملة%' THEN REPLACE(description, 'المستعملة', 'الجديدة')
  ELSE description
END
WHERE reference_type = 'sale';

-- Step 3: Update any remaining revenue lines that just say "إيراد المبيعات"
UPDATE journal_entry_lines jel
SET description = 'إيراد مبيعات سيارات جديدة'
WHERE jel.journal_entry_id IN (
  SELECT je.id FROM journal_entries je WHERE je.reference_type = 'sale'
)
AND jel.credit > 0
AND jel.account_id IN (
  SELECT acc.id FROM account_categories acc WHERE acc.code = '4101'
)
AND (jel.description = 'إيراد المبيعات' OR jel.description = 'إيراد مبيعات');