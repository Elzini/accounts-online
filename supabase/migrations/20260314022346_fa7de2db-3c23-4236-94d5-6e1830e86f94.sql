-- Remove broken correlated subquery policies from backup_schedules
DROP POLICY IF EXISTS "Users can view their company backup schedule" ON public.backup_schedules;
DROP POLICY IF EXISTS "Users can insert their company backup schedule" ON public.backup_schedules;
DROP POLICY IF EXISTS "Users can update their company backup schedule" ON public.backup_schedules;
DROP POLICY IF EXISTS "Users can delete their company backup schedule" ON public.backup_schedules;

-- Remove broken policies from backups
DROP POLICY IF EXISTS "Users can view their company backups" ON public.backups;
DROP POLICY IF EXISTS "Users can create backups for their company" ON public.backups;
DROP POLICY IF EXISTS "Users can update their company backups" ON public.backups;
DROP POLICY IF EXISTS "Users can delete their company backups" ON public.backups;

-- Remove broken policies from employee_advances
DROP POLICY IF EXISTS "Users can view advances in their company" ON public.employee_advances;
DROP POLICY IF EXISTS "Users can insert advances in their company" ON public.employee_advances;
DROP POLICY IF EXISTS "Users can update advances in their company" ON public.employee_advances;
DROP POLICY IF EXISTS "Users can delete advances in their company" ON public.employee_advances;

-- Remove broken policies from sms_provider_configs
DROP POLICY IF EXISTS "Users can view sms configs for their company" ON public.sms_provider_configs;
DROP POLICY IF EXISTS "Users can insert sms configs for their company" ON public.sms_provider_configs;
DROP POLICY IF EXISTS "Users can update sms configs for their company" ON public.sms_provider_configs;
DROP POLICY IF EXISTS "Users can delete sms configs for their company" ON public.sms_provider_configs;