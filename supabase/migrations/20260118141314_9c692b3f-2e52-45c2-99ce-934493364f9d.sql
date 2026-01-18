-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin and admin can view audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view company audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    company_id = get_user_company_id(auth.uid()) 
    AND is_admin(auth.uid())
);

-- Only system can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_company_id uuid,
    p_user_id uuid,
    p_action text,
    p_entity_type text,
    p_entity_id text DEFAULT NULL,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (p_company_id, p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data);
END;
$$;

-- Trigger function for user_roles changes
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_id uuid;
    v_action text;
BEGIN
    -- Get the company_id from the user's profile
    SELECT company_id INTO v_company_id
    FROM profiles
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

    IF TG_OP = 'INSERT' THEN
        v_action := 'permission_granted';
        INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
        VALUES (
            v_company_id,
            auth.uid(),
            v_action,
            'user_role',
            NEW.user_id::text,
            jsonb_build_object('permission', NEW.permission, 'target_user_id', NEW.user_id)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'permission_revoked';
        INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data)
        VALUES (
            v_company_id,
            auth.uid(),
            v_action,
            'user_role',
            OLD.user_id::text,
            jsonb_build_object('permission', OLD.permission, 'target_user_id', OLD.user_id)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for user_roles
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_roles_changes();

-- Trigger function for profiles changes (user creation/update)
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'user_created';
        INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
        VALUES (
            NEW.company_id,
            COALESCE(auth.uid(), NEW.user_id),
            v_action,
            'user',
            NEW.user_id::text,
            jsonb_build_object('username', NEW.username, 'company_id', NEW.company_id)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log significant changes
        IF OLD.company_id IS DISTINCT FROM NEW.company_id OR OLD.username IS DISTINCT FROM NEW.username THEN
            v_action := 'user_updated';
            INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data, new_data)
            VALUES (
                NEW.company_id,
                auth.uid(),
                v_action,
                'user',
                NEW.user_id::text,
                jsonb_build_object('username', OLD.username, 'company_id', OLD.company_id),
                jsonb_build_object('username', NEW.username, 'company_id', NEW.company_id)
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'user_deleted';
        INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, old_data)
        VALUES (
            OLD.company_id,
            auth.uid(),
            v_action,
            'user',
            OLD.user_id::text,
            jsonb_build_object('username', OLD.username, 'company_id', OLD.company_id)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for profiles
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profiles_changes();