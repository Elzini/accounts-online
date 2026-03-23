-- C3: Drop unused empty tables (Batch 1 - Zero data, no code references)
-- These tables have 0 rows and are not referenced anywhere in the codebase

-- Marketing/CMS (no code, no data)
DROP TABLE IF EXISTS elearning_courses CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_contacts CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS sms_campaigns CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS survey_questions CASCADE;

-- PLM (Product Lifecycle Management - not implemented)
DROP TABLE IF EXISTS plm_engineering_changes CASCADE;
DROP TABLE IF EXISTS plm_products CASCADE;

-- Recruitment (not implemented)
DROP TABLE IF EXISTS recruitment_candidates CASCADE;
DROP TABLE IF EXISTS recruitment_interviews CASCADE;
DROP TABLE IF EXISTS recruitment_jobs CASCADE;

-- Other unused modules (no code, no data)
DROP TABLE IF EXISTS siem_integrations CASCADE;
DROP TABLE IF EXISTS signature_requests CASCADE;
DROP TABLE IF EXISTS two_person_approvals CASCADE;
DROP TABLE IF EXISTS planning_shifts CASCADE;
DROP TABLE IF EXISTS rental_contracts CASCADE;
DROP TABLE IF EXISTS knowledge_articles CASCADE;
DROP TABLE IF EXISTS field_service_orders CASCADE;
DROP TABLE IF EXISTS maintenance_equipment CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS quality_checks CASCADE;
DROP TABLE IF EXISTS crm_activities CASCADE;