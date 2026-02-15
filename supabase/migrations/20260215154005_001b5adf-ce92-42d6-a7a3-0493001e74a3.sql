
-- Add new admin role types to user_permission enum
ALTER TYPE public.user_permission ADD VALUE IF NOT EXISTS 'support_admin';
ALTER TYPE public.user_permission ADD VALUE IF NOT EXISTS 'finance_admin';
ALTER TYPE public.user_permission ADD VALUE IF NOT EXISTS 'technical_admin';
