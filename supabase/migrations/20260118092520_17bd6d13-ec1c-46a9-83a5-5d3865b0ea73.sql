
-- Add tax/company fields to tax_settings table
ALTER TABLE public.tax_settings 
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS company_name_ar TEXT,
ADD COLUMN IF NOT EXISTS national_address TEXT,
ADD COLUMN IF NOT EXISTS commercial_register TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS building_number TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.tax_settings.tax_number IS 'الرقم الضريبي (VAT Number)';
COMMENT ON COLUMN public.tax_settings.company_name_ar IS 'اسم الشركة بالعربي';
COMMENT ON COLUMN public.tax_settings.national_address IS 'العنوان الوطني';
COMMENT ON COLUMN public.tax_settings.commercial_register IS 'السجل التجاري';
