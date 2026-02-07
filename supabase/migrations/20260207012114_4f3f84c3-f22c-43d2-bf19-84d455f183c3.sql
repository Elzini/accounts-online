
-- Fix handle_new_user to read company_type from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  company_name_from_meta text;
  phone_from_meta text;
  company_type_from_meta text;
  existing_profile_id uuid;
BEGIN
  -- Check if profile already exists (prevent duplicate)
  SELECT id INTO existing_profile_id FROM public.profiles WHERE user_id = new.id;
  IF existing_profile_id IS NOT NULL THEN
    RETURN new;
  END IF;

  -- Get company name, phone, and type from user metadata
  company_name_from_meta := COALESCE(new.raw_user_meta_data ->> 'username', 'شركة جديدة');
  phone_from_meta := new.raw_user_meta_data ->> 'phone';
  company_type_from_meta := COALESCE(new.raw_user_meta_data ->> 'company_type', 'car_dealership');
  
  -- Create a new company for this user with the correct company_type
  INSERT INTO public.companies (name, phone, company_type)
  VALUES (company_name_from_meta, phone_from_meta, company_type_from_meta::company_activity_type)
  RETURNING id INTO new_company_id;
  
  -- Create user profile linked to the new company
  INSERT INTO public.profiles (user_id, username, company_id)
  VALUES (new.id, company_name_from_meta, new_company_id);
  
  -- Give the user all necessary permissions
  INSERT INTO public.user_roles (user_id, permission)
  VALUES 
    (new.id, 'admin'),
    (new.id, 'sales'),
    (new.id, 'purchases'),
    (new.id, 'reports'),
    (new.id, 'users')
  ON CONFLICT DO NOTHING;
  
  RETURN new;
END;
$$;
