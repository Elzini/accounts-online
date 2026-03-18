
-- Temporarily drop the protection trigger
DROP TRIGGER IF EXISTS trg_protect_system_accounts ON account_categories;

-- Move children of "أصول متداولة أخرى" to "الأصول المتداولة"
UPDATE account_categories 
SET parent_id = 'd0bfd41f-b904-4d87-a530-500bc970a775'
WHERE parent_id = 'f72e2ca6-36be-41f0-81b3-506d49447573';

-- Mark as non-system and delete
UPDATE account_categories SET is_system = false WHERE id = 'f72e2ca6-36be-41f0-81b3-506d49447573';
DELETE FROM account_categories WHERE id = 'f72e2ca6-36be-41f0-81b3-506d49447573';

-- Recreate the protection trigger
CREATE TRIGGER trg_protect_system_accounts
  BEFORE UPDATE OR DELETE ON account_categories
  FOR EACH ROW
  EXECUTE FUNCTION protect_system_accounts();
