-- Update the trigger to NOT create a company for users who already have a company_id in their profile
-- This prevents creating duplicate companies when admins add users to their company

CREATE OR REPLACE FUNCTION public.create_company_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id UUID;
  user_count INTEGER;
  existing_company_id UUID;
BEGIN
  -- Check if the profile already has a company_id assigned (meaning the user was added to an existing company)
  -- This happens when an admin creates a user through the UsersManagement page
  IF NEW.company_id IS NOT NULL THEN
    -- User already has a company assigned, don't create a new one
    RETURN NEW;
  END IF;

  -- Create a new company for the user (self-registration flow)
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.username, 'شركتي'))
  RETURNING id INTO new_company_id;
  
  -- Update the profile with the company_id
  UPDATE public.profiles
  SET company_id = new_company_id
  WHERE id = NEW.id;
  
  -- Check if this is the very first user (super admin)
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 1 THEN
    -- First user becomes super_admin
    INSERT INTO public.user_roles (user_id, permission)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Give admin permissions to the company founder (all new company owners get full access)
  INSERT INTO public.user_roles (user_id, permission) VALUES
    (NEW.user_id, 'admin'),
    (NEW.user_id, 'sales'),
    (NEW.user_id, 'purchases'),
    (NEW.user_id, 'reports'),
    (NEW.user_id, 'users')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;