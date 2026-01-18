-- Fix audit trigger to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action text;
    v_user_id uuid;
BEGIN
    -- Get the user who made the change, fallback to the affected user
    v_user_id := COALESCE(auth.uid(), NEW.user_id, OLD.user_id);
    
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
                v_user_id,
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
            COALESCE(auth.uid(), OLD.user_id),
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

-- Also fix user_roles trigger
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_id uuid;
    v_action text;
    v_user_id uuid;
BEGIN
    -- Get the company_id from the user's profile
    SELECT company_id INTO v_company_id
    FROM profiles
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    -- Get the user who made the change
    v_user_id := COALESCE(auth.uid(), NEW.user_id, OLD.user_id);

    IF TG_OP = 'INSERT' THEN
        v_action := 'permission_granted';
        INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
        VALUES (
            v_company_id,
            v_user_id,
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
            v_user_id,
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