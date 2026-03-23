/**
 * Journal Entries Service
 * 
 * READ operations: direct queries (no engine needed).
 * WRITE operations: ALL routed through ServiceContainer's JournalEngine.
 * 
 * This is the ONLY service-layer entry point for journal CRUD.
 * Components use hooks from useAccounting.ts which delegate here.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { JournalEntry, JournalEntryLine } from './types';
import { getServiceContainer } from '@/core/engine/serviceContainer';

// ── READ operations (direct queries, no engine needed) ──

export async function fetchJournalEntries(companyId: string, fiscalYearId?: string): Promise<JournalEntry[]> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('entry_number', { ascending: false });
  
  if (fiscalYearId) {
    query = query.eq('fiscal_year_id', fiscalYearId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as JournalEntry[];
}

export async function fetchJournalEntryWithLines(entryId: string): Promise<JournalEntry | null> {
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();
  
  if (entryError) throw entryError;
  if (!entry) return null;

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select(`
      *,
      account:account_categories(*)
    `)
    .eq('journal_entry_id', entryId)
    .order('created_at', { ascending: true });
  
  if (linesError) throw linesError;

  return {
    ...(entry as JournalEntry),
    lines: (lines || []) as JournalEntryLine[],
  };
}

// ── WRITE operations → ServiceContainer's JournalEngine ──

export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>,
  lines: Array<{ account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  const { journal } = getServiceContainer(entry.company_id);

  const result = await journal.createEntry({
    company_id: entry.company_id,
    fiscal_year_id: (entry as any).fiscal_year_id || '',
    entry_date: entry.entry_date,
    description: entry.description,
    reference_type: (entry as any).reference_type || 'manual',
    reference_id: (entry as any).reference_id || null,
    is_posted: entry.is_posted ?? true,
    lines: lines.map(l => ({
      account_id: l.account_id,
      description: l.description || null,
      debit: l.debit || 0,
      credit: l.credit || 0,
      cost_center_id: l.cost_center_id || null,
    })),
  });

  return result as unknown as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  // Fetch company_id to get the right container
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('company_id')
    .eq('id', id)
    .single();

  if (entry?.company_id) {
    const { journal } = getServiceContainer(entry.company_id);
    await journal.deleteEntry(id);
  }
}

export async function updateJournalEntry(
  entryId: string,
  entry: Partial<Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>>,
  lines: Array<{ id?: string; account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  // Fetch company_id to get the right container
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('company_id')
    .eq('id', entryId)
    .single();

  if (!existing) throw new Error('Journal entry not found');

  const { journal } = getServiceContainer(existing.company_id);

  // Update header fields via engine's repo
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  // Use replaceLines which handles totals + line replacement atomically
  await journal.replaceLines(entryId, lines.map(l => ({
    account_id: l.account_id,
    description: l.description || null,
    debit: l.debit || 0,
    credit: l.credit || 0,
    cost_center_id: l.cost_center_id || null,
  })));

  // Update header metadata (date, description) if provided
  if (entry.entry_date || entry.description) {
    const { supabase: sb } = await import('@/integrations/supabase/client');
    const updateData: Record<string, any> = {};
    if (entry.entry_date) updateData.entry_date = entry.entry_date;
    if (entry.description) updateData.description = entry.description;
    await sb.from('journal_entries').update(updateData).eq('id', entryId);
  }

  // Fetch updated entry
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  return data as JournalEntry;
}
