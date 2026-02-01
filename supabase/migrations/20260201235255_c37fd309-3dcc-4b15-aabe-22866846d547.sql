-- Create 2FA configuration table
CREATE TABLE public.user_2fa (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    secret_encrypted TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings" 
ON public.user_2fa FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" 
ON public.user_2fa FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" 
ON public.user_2fa FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings" 
ON public.user_2fa FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_2fa_updated_at
    BEFORE UPDATE ON public.user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();