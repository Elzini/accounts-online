
-- Add missing enum values to company_activity_type
ALTER TYPE company_activity_type ADD VALUE IF NOT EXISTS 'bookkeeping';
ALTER TYPE company_activity_type ADD VALUE IF NOT EXISTS 'manufacturing';
