
CREATE TABLE IF NOT EXISTS public.company_encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  algorithm text DEFAULT 'aes-256-cbc',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, key_version)
);

ALTER TABLE public.company_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_encryption_keys" ON public.company_encryption_keys
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid())));

CREATE POLICY "deny_insert_encryption_keys" ON public.company_encryption_keys
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "deny_update_encryption_keys" ON public.company_encryption_keys
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "deny_delete_encryption_keys" ON public.company_encryption_keys
  FOR DELETE TO authenticated USING (false);
