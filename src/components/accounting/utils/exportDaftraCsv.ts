/**
 * Export Journal Entries as CSV for Daftra import
 * Format matches Daftra's journal import template
 */
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface JournalEntryBasic {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference_type?: string | null;
}

export async function exportJournalEntriesToDaftraCsv(entries: JournalEntryBasic[], currency = 'SAR') {
  if (!entries.length) return;

  const entryIds = entries.map(e => e.id);
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select('journal_entry_id, account_id, description, debit, credit')
    .in('journal_entry_id', entryIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const accountIds = Array.from(
    new Set((lines || []).map((line) => line.account_id).filter(Boolean))
  ) as string[];

  const accountsById = new Map<string, { code: string; name: string }>();

  if (accountIds.length > 0) {
    const { data: accounts, error: accountsError } = await supabase
      .from('account_categories')
      .select('id, code, name')
      .in('id', accountIds);

    if (accountsError) throw accountsError;

    (accounts || []).forEach((account) => {
      accountsById.set(account.id, {
        code: String(account.code || '').trim(),
        name: String(account.name || '').trim(),
      });
    });
  }

  const headers = [
    'Journal Code', 'Journal Date', 'Currency', 'Journal Description',
    'Account Name', 'Transaction Description', 'Tags', 'Cost Center', 'Tax',
    'Debit', 'Credit'
  ];

  const csvRows: string[][] = [];

  for (const entry of entries) {
    const entryLines = (lines || []).filter((l: any) => (
      l.journal_entry_id === entry.id &&
      (Number(l.debit || 0) !== 0 || Number(l.credit || 0) !== 0)
    ));
    const journalCode = `JRN${String(entry.entry_number).padStart(3, '0')}`;
    const journalDate = format(new Date(entry.entry_date), 'dd/MM/yyyy');

    for (const line of entryLines) {
      const account = line.account_id ? accountsById.get(line.account_id) : undefined;
      const accountName = String(account?.code || account?.name || '').trim();

      csvRows.push([
        esc(journalCode),
        journalDate,
        currency,
        esc(entry.description),
        esc(accountName),
        esc(line.description || entry.description),
        '', // Tags
        '', // Cost Center
        '', // Tax
        line.debit > 0 ? String(line.debit) : '0',
        line.credit > 0 ? String(line.credit) : '0',
      ]);
    }
  }

  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal_entries_daftra_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function esc(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
