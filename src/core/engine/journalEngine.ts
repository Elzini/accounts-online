/**
 * Core Accounting Engine - Journal Entry Engine
 * Handles all journal entry creation, validation, and posting
 * Industry-agnostic — works for any company type
 */

import { supabase } from '@/integrations/supabase/client';
import { JournalEntryInput, JournalEntryRecord, ValidationResult } from './types';
import { validateJournalEntry } from './validation';

export class JournalEngine {
  constructor(private companyId: string) {}

  /** Create and optionally post a journal entry with full validation */
  async createEntry(input: JournalEntryInput): Promise<JournalEntryRecord> {
    // 1. Validate
    const validation = validateJournalEntry(input);
    if (!validation.valid) {
      throw new Error(`Journal entry validation failed: ${validation.errors.join('; ')}`);
    }

    const totalDebit = input.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = input.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    // 2. Insert entry header
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        company_id: input.company_id,
        fiscal_year_id: input.fiscal_year_id,
        entry_date: input.entry_date,
        description: input.description,
        reference_type: input.reference_type || 'manual',
        reference_id: input.reference_id || null,
        is_posted: input.is_posted ?? true,
        total_debit: totalDebit,
        total_credit: totalCredit,
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // 3. Insert lines
    const lines = input.lines.map(line => ({
      journal_entry_id: entry.id,
      account_id: line.account_id,
      description: line.description || null,
      debit: line.debit || 0,
      credit: line.credit || 0,
      cost_center_id: line.cost_center_id || null,
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(lines);

    if (linesError) throw linesError;

    return entry as unknown as JournalEntryRecord;
  }

  /** Check if a journal entry already exists for a reference */
  async existsForReference(referenceId: string, referenceTypes: string[]): Promise<string | null> {
    const { data } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('reference_id', referenceId)
      .in('reference_type', referenceTypes)
      .eq('company_id', this.companyId)
      .limit(1);

    return data && data.length > 0 ? data[0].id : null;
  }

  /** Delete all lines and re-insert (for entry updates) */
  async replaceLines(entryId: string, lines: JournalEntryInput['lines']): Promise<void> {
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    // Update totals
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({ total_debit: totalDebit, total_credit: totalCredit })
      .eq('id', entryId);
    if (updateError) throw updateError;

    // Delete old lines
    const { error: deleteError } = await supabase
      .from('journal_entry_lines')
      .delete()
      .eq('journal_entry_id', entryId);
    if (deleteError) throw deleteError;

    // Insert new lines
    const { error: insertError } = await supabase
      .from('journal_entry_lines')
      .insert(lines.map(l => ({
        journal_entry_id: entryId,
        account_id: l.account_id,
        description: l.description || null,
        debit: l.debit || 0,
        credit: l.credit || 0,
        cost_center_id: l.cost_center_id || null,
      })));
    if (insertError) throw insertError;
  }
}
