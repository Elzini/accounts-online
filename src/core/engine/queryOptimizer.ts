/**
 * Query Optimizer
 * 
 * Utilities for efficient database access at scale (1000+ companies).
 * - Paginated fetching (bypasses Supabase 1000-row limit)
 * - Batch operations
 * - Select-only-needed columns
 */

import { supabase } from '@/hooks/modules/useMiscServices';

/**
 * Fetch all rows from a table with automatic pagination.
 * Handles Supabase's 1000-row default limit.
 */
export async function fetchAllPaginated<T>(
  table: string,
  filters: Record<string, unknown>,
  options?: {
    select?: string;
    orderBy?: string;
    pageSize?: number;
  }
): Promise<T[]> {
  const allData: T[] = [];
  let from = 0;
  const pageSize = options?.pageSize || 1000;
  const select = options?.select || '*';
  const orderBy = options?.orderBy || 'created_at';

  while (true) {
    let query = supabase.from(table as any).select(select);
    
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as any);
    }
    
    const { data, error } = await query
      .order(orderBy, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}

/**
 * Batch insert with chunking to avoid payload size limits.
 */
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  chunkSize = 500
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table as any).insert(chunk as any);
    if (error) throw error;
  }
}

/**
 * Batch delete with chunking.
 */
export async function batchDelete(
  table: string,
  ids: string[],
  idColumn = 'id',
  chunkSize = 200
): Promise<void> {
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabase.from(table as any).delete().in(idColumn, chunk);
    if (error) throw error;
  }
}

/**
 * Count rows without fetching data.
 */
export async function countRows(
  table: string,
  filters: Record<string, unknown>
): Promise<number> {
  let query = supabase.from(table as any).select('*', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value as any);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Selective column fetching to reduce payload size.
 * Maps common entity types to their minimal required columns.
 */
export const LEAN_SELECTS = {
  account: 'id, code, name, type, parent_id, is_system',
  journal_entry: 'id, entry_number, entry_date, total_debit, total_credit, is_posted, reference_type, reference_id',
  journal_line: 'id, journal_entry_id, account_id, debit, credit, description',
  invoice: 'id, invoice_number, invoice_date, invoice_type, status, total, vat_amount',
  fiscal_year: 'id, name, start_date, end_date, is_current, status',
} as const;
