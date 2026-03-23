/**
 * Journal Entries Service
 * 
 * READ operations remain as direct queries (no engine needed).
 * WRITE operations delegate to Core Engine's JournalEngine.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { JournalEntry, JournalEntryLine } from './types';
import { getServiceContainer } from '@/core/engine/serviceContainer';
import { defaultRepos } from '@/core/engine/supabaseRepositories';

// ── READ operations (no engine needed) ──

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

// ── WRITE operations → Core Engine ──

export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>,
  lines: Array<{ account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  const { journal: engine } = getServiceContainer(entry.company_id);

  const result = await engine.createEntry({
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
  // Use repo directly for delete (engine delete also works)
  const repo = defaultRepos.journalEntries;
  await repo.deleteLines(id);
  await repo.deleteEntry(id);
}

export async function updateJournalEntry(
  entryId: string,
  entry: Partial<Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>>,
  lines: Array<{ id?: string; account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  const repo = defaultRepos.journalEntries;

  // Update header
  await repo.updateEntry(entryId, {
    entry_date: entry.entry_date,
    description: entry.description,
    total_debit: totalDebit,
    total_credit: totalCredit,
  });

  // Replace lines via engine pattern
  await repo.deleteLines(entryId);
  await repo.createLines(lines.map(l => ({
    journal_entry_id: entryId,
    account_id: l.account_id,
    description: l.description || null,
    debit: l.debit || 0,
    credit: l.credit || 0,
    cost_center_id: l.cost_center_id || null,
  })));

  // Fetch updated entry
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  return data as JournalEntry;
}
