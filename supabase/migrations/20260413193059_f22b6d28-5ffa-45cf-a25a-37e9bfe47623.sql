
-- Create daftra_integrations table
CREATE TABLE public.daftra_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    subdomain TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    username_encrypted TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    access_token_encrypted TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'idle',
    sync_log JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.daftra_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own company daftra config"
ON public.daftra_integrations FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own company daftra config"
ON public.daftra_integrations FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own company daftra config"
ON public.daftra_integrations FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own company daftra config"
ON public.daftra_integrations FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_daftra_integrations_updated_at
BEFORE UPDATE ON public.daftra_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
