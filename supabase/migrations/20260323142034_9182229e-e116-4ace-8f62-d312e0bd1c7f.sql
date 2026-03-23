-- C3: Drop unused empty tables (Batch 2)
-- Zero rows, no code references, safe to remove

DROP TABLE IF EXISTS appraisals CASCADE;
DROP TABLE IF EXISTS approval_delegations CASCADE;
DROP TABLE IF EXISTS cms_categories CASCADE;
DROP TABLE IF EXISTS document_attachments CASCADE;
DROP TABLE IF EXISTS employee_insurance CASCADE;
DROP TABLE IF EXISTS employee_rewards CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS financial_period_locks CASCADE;
DROP TABLE IF EXISTS pos_sessions CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS production_stages CASCADE;
DROP TABLE IF EXISTS project_billings CASCADE;
DROP TABLE IF EXISTS ticket_replies CASCADE;
DROP TABLE IF EXISTS trial_balance_imports CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;