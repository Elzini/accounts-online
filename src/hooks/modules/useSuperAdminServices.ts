/**
 * Super Admin Services - Re-export barrel (backward compatibility)
 * REFACTORED: Split into src/hooks/modules/superadmin/ domain files.
 */
export { supabase } from '@/integrations/supabase/client';
export * from './superadmin/companies';
export * from './superadmin/users';
export * from './superadmin/security';
export * from './superadmin/settings';
export * from './superadmin/monitoring';
