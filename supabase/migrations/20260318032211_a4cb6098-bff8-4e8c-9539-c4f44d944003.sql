
-- Disable triggers for fixing orphan accounts
ALTER TABLE account_categories DISABLE TRIGGER trg_protect_system_accounts;
ALTER TABLE account_categories DISABLE TRIGGER trg_freeze_check_account_categories;
ALTER TABLE account_categories DISABLE TRIGGER enforce_company_isolation_trigger;
ALTER TABLE account_categories DISABLE TRIGGER trg_block_cross_tenant_account_categories;
ALTER TABLE account_categories DISABLE TRIGGER sync_account_category_trigger;
ALTER TABLE account_categories DISABLE TRIGGER trg_sync_account;

-- Fix الزيني للمقاولات orphans: 1300 → الأصول, 4901 → الإيرادات, 5401/5901 → المصروفات
UPDATE account_categories SET parent_id = '2c25fdfb-2882-449c-b0d5-c088f8a2d2ff' WHERE id = 'a487e47a-9cca-4663-91fe-8de12aed8977';
UPDATE account_categories SET parent_id = 'b0520ad9-4189-4db2-9d7a-17eef81f826c' WHERE id = '2763e9a8-371c-48f0-a981-1831045c6fe1';
UPDATE account_categories SET parent_id = 'dd15d7f5-7489-4666-84a8-d282d569ef27' WHERE id = 'd1c287a6-5cc1-4214-9cc7-3ae4e9723c1b';
UPDATE account_categories SET parent_id = 'dd15d7f5-7489-4666-84a8-d282d569ef27' WHERE id = 'da846d91-651a-4bce-8a2c-05cfb107cd3c';

-- Re-enable triggers
ALTER TABLE account_categories ENABLE TRIGGER trg_protect_system_accounts;
ALTER TABLE account_categories ENABLE TRIGGER trg_freeze_check_account_categories;
ALTER TABLE account_categories ENABLE TRIGGER enforce_company_isolation_trigger;
ALTER TABLE account_categories ENABLE TRIGGER trg_block_cross_tenant_account_categories;
ALTER TABLE account_categories ENABLE TRIGGER sync_account_category_trigger;
ALTER TABLE account_categories ENABLE TRIGGER trg_sync_account;
