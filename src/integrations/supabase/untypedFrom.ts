/**
 * Supabase Untyped Table Helper
 * 
 * Provides a typed wrapper for accessing tables that exist in the database
 * but aren't yet reflected in the auto-generated types.ts.
 * 
 * Usage:
 *   const { data } = await untypedFrom('workflow_templates').select('*').eq('company_id', id);
 * 
 * This replaces scattered `(supabase as any).from(...)` and `supabase.from('x' as any)`
 * patterns with a single, documented utility.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Access a Supabase table that isn't in the generated types.
 * Returns a standard PostgREST query builder.
 */
export function untypedFrom(table: string) {
  return (supabase as any).from(table);
}

/**
 * Access supabase RPC functions not in generated types.
 */
export function untypedRpc(fn: string, params?: Record<string, unknown>) {
  return (supabase.rpc as any)(fn, params);
}
