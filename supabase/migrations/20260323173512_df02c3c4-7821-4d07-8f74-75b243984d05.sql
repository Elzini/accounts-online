-- Add missing schema_name column
ALTER TABLE public.tenant_db_roles ADD COLUMN IF NOT EXISTS schema_name text;

-- Make user_id nullable since system triggers insert without it
ALTER TABLE public.tenant_db_roles ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing unique constraint that includes user_id
ALTER TABLE public.tenant_db_roles DROP CONSTRAINT IF EXISTS tenant_db_roles_user_id_company_id_role_name_key;

-- Add unique constraint on role_name alone (used by ON CONFLICT in create_tenant_db_role)
CREATE UNIQUE INDEX IF NOT EXISTS tenant_db_roles_role_name_key ON public.tenant_db_roles (role_name);