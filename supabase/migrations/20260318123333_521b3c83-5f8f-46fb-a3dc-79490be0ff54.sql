
-- Recreate hr_employees_safe view with masked column names and security_invoker
DROP VIEW IF EXISTS public.hr_employees_safe;

CREATE VIEW public.hr_employees_safe WITH (security_invoker = true) AS
SELECT 
    id,
    company_id,
    employee_number,
    full_name,
    full_name_en,
    job_title,
    department,
    is_active,
    hire_date,
    contract_type,
    CASE
        WHEN has_hr_access(company_id) THEN base_salary
        ELSE NULL::numeric
    END AS base_salary,
    CASE
        WHEN has_hr_access(company_id) THEN housing_allowance
        ELSE NULL::numeric
    END AS housing_allowance,
    CASE
        WHEN has_hr_access(company_id) THEN transport_allowance
        ELSE NULL::numeric
    END AS transport_allowance,
    CASE
        WHEN has_hr_access(company_id) THEN other_allowances
        ELSE NULL::numeric
    END AS other_allowances,
    CASE
        WHEN has_hr_access(company_id) THEN phone
        ELSE CASE
            WHEN phone IS NOT NULL THEN '••••' || right(phone, 4)
            ELSE NULL::text
        END
    END AS phone_masked,
    CASE
        WHEN has_hr_access(company_id) THEN national_id
        ELSE CASE
            WHEN national_id IS NOT NULL THEN '••••' || right(national_id, 4)
            ELSE NULL::text
        END
    END AS national_id_masked,
    CASE
        WHEN has_hr_access(company_id) THEN email
        ELSE NULL::text
    END AS email_masked,
    CASE
        WHEN has_hr_access(company_id) THEN bank_name
        ELSE NULL::text
    END AS bank_name,
    CASE
        WHEN has_hr_access(company_id) THEN iban
        ELSE CASE
            WHEN iban IS NOT NULL THEN '••••' || right(iban, 4)
            ELSE NULL::text
        END
    END AS iban_masked,
    notes,
    created_at,
    updated_at
FROM hr_employees;
