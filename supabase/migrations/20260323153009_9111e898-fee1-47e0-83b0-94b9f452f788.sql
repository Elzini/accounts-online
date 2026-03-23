
-- Phase 4: Drop 15 unused tables to reduce schema bloat
-- These tables have zero references in application code

-- Security/Encryption tables (unused - encryption handled differently)
DROP TABLE IF EXISTS public.tenant_encryption_config CASCADE;
DROP TABLE IF EXISTS public.tenant_storage_config CASCADE;
DROP TABLE IF EXISTS public.tenant_network_config CASCADE;
DROP TABLE IF EXISTS public.tenant_db_roles CASCADE;
DROP TABLE IF EXISTS public.company_encryption_keys CASCADE;

-- Fleet module (never implemented)
DROP TABLE IF EXISTS public.fleet_vehicles CASCADE;
DROP TABLE IF EXISTS public.fleet_service_logs CASCADE;

-- Unused child/line tables (parent tables exist but lines never used)
DROP TABLE IF EXISTS public.goods_receipt_lines CASCADE;
DROP TABLE IF EXISTS public.purchase_order_lines CASCADE;
DROP TABLE IF EXISTS public.stock_voucher_lines CASCADE;
DROP TABLE IF EXISTS public.stocktaking_lines CASCADE;

-- Unused config/audit tables
DROP TABLE IF EXISTS public.audit_hash_chain CASCADE;
DROP TABLE IF EXISTS public.security_events CASCADE;
DROP TABLE IF EXISTS public.industry_dashboard_config CASCADE;
DROP TABLE IF EXISTS public.industry_menu_config CASCADE;
