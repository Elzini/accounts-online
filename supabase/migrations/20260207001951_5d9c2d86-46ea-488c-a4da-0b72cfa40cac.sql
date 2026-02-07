-- Add new company activity types
ALTER TYPE public.company_activity_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE public.company_activity_type ADD VALUE IF NOT EXISTS 'export_import';
