/**
 * Centralized Company Context Utilities
 * 
 * Single source of truth for getting the current company ID.
 * All services should import from here instead of duplicating this logic.
 */
import { supabase } from '@/integrations/supabase/client';
import { getCompanyOverride } from '@/lib/companyOverride';

/** Get current company ID (nullable) */
export async function getCurrentCompanyId(): Promise<string | null> {
  const override = getCompanyOverride();
  if (override) return override;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  return profile?.company_id || null;
}

/** Get current company ID or throw */
export async function requireCompanyId(): Promise<string> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');
  return companyId;
}

/** Format date to YYYY-MM-DD */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
