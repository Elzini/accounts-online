/**
 * Module Services - Re-export barrel (backward compatibility)
 * REFACTORED: Split into src/hooks/modules/modules/ domain files.
 */
import { supabase } from '@/integrations/supabase/client';
export { supabase } from '@/integrations/supabase/client';
export { useCompanyId } from '@/hooks/useCompanyId';
export * from './modules/bookings';
export * from './modules/facilities';
export * from './modules/tasks';
export * from './modules/dashboard';
export * from './modules/finance';
