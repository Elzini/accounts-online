/**
 * Core Accounting Engine - Validation Layer
 * Ensures data integrity for all accounting operations
 */

import { JournalEntryInput, ValidationResult } from './types';

const TOLERANCE = 0.005; // Half a halala

/**
 * Validate journal entry before saving
 * Ensures debit = credit and all required fields
 */
export function validateJournalEntry(entry: JournalEntryInput): ValidationResult {
  const errors: string[] = [];

  if (!entry.company_id) errors.push('company_id is required');
  if (!entry.fiscal_year_id) errors.push('fiscal_year_id is required');
  if (!entry.entry_date) errors.push('entry_date is required');
  if (!entry.description?.trim()) errors.push('description is required');

  if (!entry.lines || entry.lines.length < 2) {
    errors.push('Journal entry must have at least 2 lines');
  }

  if (entry.lines) {
    const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);

    if (diff > TOLERANCE) {
      errors.push(`Entry is unbalanced: Debit=${totalDebit.toFixed(2)}, Credit=${totalCredit.toFixed(2)}, Diff=${diff.toFixed(2)}`);
    }

    for (let i = 0; i < entry.lines.length; i++) {
      const line = entry.lines[i];
      if (!line.account_id) errors.push(`Line ${i + 1}: account_id is required`);
      if (line.debit < 0) errors.push(`Line ${i + 1}: debit cannot be negative`);
      if (line.credit < 0) errors.push(`Line ${i + 1}: credit cannot be negative`);
      if (line.debit === 0 && line.credit === 0) errors.push(`Line ${i + 1}: both debit and credit are zero`);
      if (line.debit > 0 && line.credit > 0) errors.push(`Line ${i + 1}: cannot have both debit and credit`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that a date falls within a fiscal year range
 */
export function validateDateInFiscalYear(
  date: string, 
  startDate: string, 
  endDate: string
): ValidationResult {
  const errors: string[] = [];
  if (date < startDate || date > endDate) {
    errors.push(`Date ${date} is outside fiscal year range (${startDate} to ${endDate})`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate account is a leaf (no children) before posting
 */
export function validateLeafAccount(
  accountId: string,
  allAccounts: Array<{ id: string; parent_id: string | null }>
): ValidationResult {
  const errors: string[] = [];
  const hasChildren = allAccounts.some(a => a.parent_id === accountId);
  if (hasChildren) {
    errors.push('Cannot post to a parent/summary account. Use a leaf account.');
  }
  return { valid: errors.length === 0, errors };
}
