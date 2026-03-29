CREATE OR REPLACE FUNCTION public.auto_set_child_company_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_company_id UUID;
  fk_value UUID;
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  EXECUTE format('SELECT ($1).%I', TG_ARGV[1]) INTO fk_value USING NEW;

  IF fk_value IS NOT NULL THEN
    EXECUTE format('SELECT company_id FROM public.%I WHERE id = $1', TG_ARGV[0])
      INTO parent_company_id USING fk_value;
    NEW.company_id := parent_company_id;
  END IF;

  RETURN NEW;
END;
$$;