-- Part 1: Add super_admin to user_permission enum
ALTER TYPE public.user_permission ADD VALUE IF NOT EXISTS 'super_admin';