
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted text,
  is_enabled boolean NOT NULL DEFAULT false,
  two_fa_type text CHECK (two_fa_type IN ('totp', 'sms')),
  phone_number text,
  sms_pin_id text,
  backup_codes text[],
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own 2fa" ON public.user_2fa
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own 2fa" ON public.user_2fa
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own 2fa" ON public.user_2fa
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own 2fa" ON public.user_2fa
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
