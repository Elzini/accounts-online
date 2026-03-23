CREATE TABLE IF NOT EXISTS public.tenant_db_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role_name text NOT NULL DEFAULT 'member',
  granted_at timestamptz DEFAULT now(),
  granted_by uuid,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, company_id, role_name)
);

ALTER TABLE public.tenant_db_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant roles" ON public.tenant_db_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "No direct insert update delete" ON public.tenant_db_roles
  FOR INSERT TO authenticated
  WITH CHECK (false);