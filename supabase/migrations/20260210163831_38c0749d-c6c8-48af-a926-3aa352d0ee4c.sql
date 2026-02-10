
-- Update strict_company_check to allow super_admin to view any company
CREATE OR REPLACE FUNCTION public.strict_company_check(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_company_id UUID;
    company_active BOOLEAN;
    user_is_super_admin BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super admins can access any company
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND permission = 'super_admin'
    ) INTO user_is_super_admin;

    IF user_is_super_admin THEN
        -- Just check the company is active
        SELECT is_active INTO company_active
        FROM public.companies
        WHERE id = _company_id;
        RETURN company_active IS TRUE;
    END IF;

    SELECT p.company_id INTO user_company_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid();

    IF user_company_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF user_company_id != _company_id THEN
        RETURN FALSE;
    END IF;

    SELECT is_active INTO company_active
    FROM public.companies
    WHERE id = _company_id;

    IF company_active IS NOT TRUE THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Also update the "Company isolation select" policies that use get_user_company_id()
-- These don't check for super_admin and will block access

-- Drop and recreate for sales
DROP POLICY IF EXISTS "Company isolation select" ON public.sales;
CREATE POLICY "Company isolation select" ON public.sales
FOR SELECT USING (
    is_super_admin(auth.uid()) OR company_id = get_user_company_id()
);

-- Drop and recreate for customers
DROP POLICY IF EXISTS "Company isolation select" ON public.customers;
CREATE POLICY "Company isolation select" ON public.customers
FOR SELECT USING (
    is_super_admin(auth.uid()) OR company_id = get_user_company_id()
);

-- Drop and recreate for expenses
DROP POLICY IF EXISTS "Company isolation select" ON public.expenses;
CREATE POLICY "Company isolation select" ON public.expenses
FOR SELECT USING (
    is_super_admin(auth.uid()) OR company_id = get_user_company_id()
);

-- Drop and recreate for journal_entries
DROP POLICY IF EXISTS "Company isolation select" ON public.journal_entries;
CREATE POLICY "Company isolation select" ON public.journal_entries
FOR SELECT USING (
    is_super_admin(auth.uid()) OR company_id = get_user_company_id()
);
