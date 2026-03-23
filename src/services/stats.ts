/**
 * Stats Service - Dashboard statistics for all company types
 * Delegates to industry-specific implementations via strategy pattern
 */
import { supabase } from '@/integrations/supabase/client';
import { getCompanyOverride } from '@/lib/companyOverride';

async function requireCompanyId(): Promise<string> {
  const override = getCompanyOverride();
  if (override) return override;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('COMPANY_REQUIRED');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  if (!profile?.company_id) throw new Error('COMPANY_REQUIRED');
  return profile.company_id;
}

function toDateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Re-export from database.ts for backward compatibility during migration
export { fetchStats, fetchAllTimeStats, fetchMonthlyChartData } from './database';
