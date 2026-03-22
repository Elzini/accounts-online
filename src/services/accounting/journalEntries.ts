import { supabase } from '@/integrations/supabase/client';
import { JournalEntry, JournalEntryLine } from './types';

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

export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>,
  lines: Array<{ account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  const { data: newEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      ...entry,
      total_debit: totalDebit,
      total_credit: totalCredit,
    })
    .select()
    .single();
  
  if (entryError) throw entryError;

  const linesWithEntryId = lines.map(line => ({
    journal_entry_id: newEntry.id,
    account_id: line.account_id,
    description: line.description || null,
    debit: line.debit || 0,
    credit: line.credit || 0,
    cost_center_id: line.cost_center_id || null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId);
  
  if (linesError) throw linesError;

  return newEntry as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function updateJournalEntry(
  entryId: string,
  entry: Partial<Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'lines'>>,
  lines: Array<{ id?: string; account_id: string; description?: string; debit: number; credit: number; cost_center_id?: string | null }>
): Promise<JournalEntry> {
  const { data: updatedEntry, error: entryError } = await supabase
    .from('journal_entries')
    .update({
      entry_date: entry.entry_date,
      description: entry.description,
      total_debit: entry.total_debit,
      total_credit: entry.total_credit,
    })
    .eq('id', entryId)
    .select()
    .single();
  
  if (entryError) throw entryError;

  const { error: deleteError } = await supabase
    .from('journal_entry_lines')
    .delete()
    .eq('journal_entry_id', entryId);
  
  if (deleteError) throw deleteError;

  const linesWithEntryId = lines.map(line => ({
    journal_entry_id: entryId,
    account_id: line.account_id,
    description: line.description || null,
    debit: line.debit || 0,
    credit: line.credit || 0,
    cost_center_id: line.cost_center_id || null,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId);
  
  if (linesError) throw linesError;

  return updatedEntry as JournalEntry;
}
