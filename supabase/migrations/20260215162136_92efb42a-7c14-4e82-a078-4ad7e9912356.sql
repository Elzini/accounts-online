-- Add 'medical' to company_activity_type enum
ALTER TYPE public.company_activity_type ADD VALUE IF NOT EXISTS 'medical';