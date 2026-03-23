-- C3: Drop unused empty tables (Batch 3)
-- Workflow engine (not implemented, 0 data, 0 code refs)
DROP TABLE IF EXISTS workflow_instance_stages CASCADE;
DROP TABLE IF EXISTS workflow_instances CASCADE;
DROP TABLE IF EXISTS workflow_stage_fields CASCADE;
DROP TABLE IF EXISTS workflow_accounting_rules CASCADE;
DROP TABLE IF EXISTS workflow_transitions CASCADE;
DROP TABLE IF EXISTS workflow_stages CASCADE;
DROP TABLE IF EXISTS workflow_templates CASCADE;

-- Unused infrastructure (0 data, 0 code refs)
DROP TABLE IF EXISTS supplier_portal_tokens CASCADE;
DROP TABLE IF EXISTS storage_access_log CASCADE;
DROP TABLE IF EXISTS support_ticket_messages CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;