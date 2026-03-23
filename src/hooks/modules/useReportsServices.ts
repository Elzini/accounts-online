/**
 * Reports & Analytics - Service Hooks
 * Centralized data access for all report/analytics components.
 */
import { supabase } from '@/integrations/supabase/client';

// Re-export for components with complex inline queries
export { supabase } from '@/integrations/supabase/client';
