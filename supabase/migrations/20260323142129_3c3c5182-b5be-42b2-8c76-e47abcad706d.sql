-- C3: Drop unused empty security tables (Batch 4)
-- Empty (0 rows), no code references
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS security_anomalies CASCADE;
DROP TABLE IF EXISTS security_incidents CASCADE;
DROP TABLE IF EXISTS network_access_log CASCADE;
DROP TABLE IF EXISTS penetration_test_results CASCADE;
DROP TABLE IF EXISTS system_activity_logs CASCADE;