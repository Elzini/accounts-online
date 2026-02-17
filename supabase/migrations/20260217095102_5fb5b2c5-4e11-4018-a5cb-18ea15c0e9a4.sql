
-- Add real_estate to the company_activity_type enum
ALTER TYPE public.company_activity_type ADD VALUE IF NOT EXISTS 'real_estate';
