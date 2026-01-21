-- Update the handle_new_user function to create a company for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
  company_name_from_meta text;
  phone_from_meta text;
BEGIN
  -- Get company name and phone from user metadata
  company_name_from_meta := COALESCE(new.raw_user_meta_data ->> 'username', 'شركة جديدة');
  phone_from_meta := new.raw_user_meta_data ->> 'phone';
  
  -- Create a new company for this user
  INSERT INTO public.companies (name, phone)
  VALUES (company_name_from_meta, phone_from_meta)
  RETURNING id INTO new_company_id;
  
  -- Create user profile linked to the new company
  INSERT INTO public.profiles (user_id, username, company_id)
  VALUES (new.id, company_name_from_meta, new_company_id);
  
  -- Give the user admin permission
  INSERT INTO public.user_roles (user_id, permission, company_id)
  VALUES (new.id, 'admin', new_company_id);
  
  RETURN new;
END;
$$;