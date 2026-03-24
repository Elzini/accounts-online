/**
 * Module Services - Re-export barrel (backward compatibility)
 * REFACTORED: Split into src/hooks/modules/modules/ domain files.
 */
export { supabase } from '@/integrations/supabase/untypedFrom';
export { useCompanyId } from '@/hooks/useCompanyId';
export * from './modules/bookings';
export * from './modules/facilities';
export * from './modules/tasks';
export * from './modules/dashboard';
export * from './modules/finance';
