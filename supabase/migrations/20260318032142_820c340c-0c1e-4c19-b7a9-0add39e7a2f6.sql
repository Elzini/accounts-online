
-- Disable only user-defined triggers (not system FK triggers)
ALTER TABLE account_categories DISABLE TRIGGER enforce_company_isolation_trigger;
ALTER TABLE account_categories DISABLE TRIGGER sync_account_category_trigger;
ALTER TABLE account_categories DISABLE TRIGGER trg_block_cross_tenant_account_categories;
ALTER TABLE account_categories DISABLE TRIGGER trg_freeze_check_account_categories;
ALTER TABLE account_categories DISABLE TRIGGER trg_protect_system_accounts;
ALTER TABLE account_categories DISABLE TRIGGER trg_sync_account;
ALTER TABLE account_categories DISABLE TRIGGER update_account_categories_updated_at;

-- Fix company 60a4ec01: 1300 → under الأصول, 1304 → under الأصول, 1305 → under 1304
UPDATE account_categories SET parent_id = '5ba15a04-83a5-45a4-9893-1cbca3352649' WHERE id = 'b64cbc59-c0ed-46b2-9702-c7fdaa93b34c';
UPDATE account_categories SET parent_id = '5ba15a04-83a5-45a4-9893-1cbca3352649' WHERE id = '3ce61e32-53ca-470b-99bc-eac49b0dd795';
UPDATE account_categories SET parent_id = '3ce61e32-53ca-470b-99bc-eac49b0dd795' WHERE id = 'dfa14323-eb06-45cf-80a4-760509187ccf';

-- Fix company 3b6672f6: 1300 → under الأصول, 1304 → under الأصول, 1305 → under 1304
UPDATE account_categories SET parent_id = '38d531f5-ab29-44eb-b513-df71799976e7' WHERE id = '952c821a-87fe-46e9-bd94-1baa6359fe6a';
UPDATE account_categories SET parent_id = '38d531f5-ab29-44eb-b513-df71799976e7' WHERE id = '12b595f3-5b99-4fe0-95a2-9ed006d91035';
UPDATE account_categories SET parent_id = '12b595f3-5b99-4fe0-95a2-9ed006d91035' WHERE id = '72cf68c8-b6eb-4ca9-bc06-cc28a4149a49';

-- Fix company 00000000: 1300 → under الأصول, 1304 → under الأصول, 1305 → under 1304, 5406/5407 → under المصروفات
UPDATE account_categories SET parent_id = 'd56eeb89-325f-432a-9ea5-8708147469d7' WHERE id = '3de0ca67-61a7-45b8-a397-b48d399732c7';
UPDATE account_categories SET parent_id = 'd56eeb89-325f-432a-9ea5-8708147469d7' WHERE id = '42dc511c-fa02-488d-8f1f-9caca1054368';
UPDATE account_categories SET parent_id = '42dc511c-fa02-488d-8f1f-9caca1054368' WHERE id = '5998bf77-734c-46c1-b02a-1fdf6e8afb1d';
UPDATE account_categories SET parent_id = 'faeb89f5-9751-4717-9989-1122232aef4d' WHERE id = '24c55c9a-aede-48e2-949a-22667ec58c74';
UPDATE account_categories SET parent_id = 'faeb89f5-9751-4717-9989-1122232aef4d' WHERE id = 'ad00ce8f-8d1c-4a25-b33b-d7973a35d812';

-- Re-enable all triggers
ALTER TABLE account_categories ENABLE TRIGGER enforce_company_isolation_trigger;
ALTER TABLE account_categories ENABLE TRIGGER sync_account_category_trigger;
ALTER TABLE account_categories ENABLE TRIGGER trg_block_cross_tenant_account_categories;
ALTER TABLE account_categories ENABLE TRIGGER trg_freeze_check_account_categories;
ALTER TABLE account_categories ENABLE TRIGGER trg_protect_system_accounts;
ALTER TABLE account_categories ENABLE TRIGGER trg_sync_account;
ALTER TABLE account_categories ENABLE TRIGGER update_account_categories_updated_at;
