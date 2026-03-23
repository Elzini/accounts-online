
-- Phase 2: Drop empty, unreferenced tables (Batch 1 - Infrastructure dead code)
DROP TABLE IF EXISTS code_integrity_hashes CASCADE;
DROP TABLE IF EXISTS critical_operation_otps CASCADE;
DROP TABLE IF EXISTS encryption_key_registry CASCADE;
DROP TABLE IF EXISTS encryption_keys CASCADE;
DROP TABLE IF EXISTS field_permissions CASCADE;
DROP TABLE IF EXISTS immutable_baselines CASCADE;
DROP TABLE IF EXISTS rate_limit_config CASCADE;
DROP TABLE IF EXISTS rate_limit_log CASCADE;
DROP TABLE IF EXISTS tenant_ip_whitelist CASCADE;
DROP TABLE IF EXISTS tenant_storage_snapshots CASCADE;
DROP TABLE IF EXISTS system_change_alerts CASCADE;
