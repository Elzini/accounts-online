import { describe, it, expect } from 'vitest';
import { validateJournalEntry, validateDateInFiscalYear } from '@/core/engine/validation';
import type { JournalEntryInput } from '@/core/engine/types';

describe('validateJournalEntry', () => {
  const validEntry: JournalEntryInput = {
    company_id: 'c1', fiscal_year_id: 'fy1', entry_date: '2026-01-15',
    description: 'Test entry',
    lines: [
      { account_id: 'a1', description: 'Debit', debit: 1000, credit: 0 },
      { account_id: 'a2', description: 'Credit', debit: 0, credit: 1000 },
    ],
  };

  it('accepts a balanced entry', () => {
    const result = validateJournalEntry(validEntry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects unbalanced entry', () => {
    const entry = { ...validEntry, lines: [
      { account_id: 'a1', description: 'D', debit: 1000, credit: 0 },
      { account_id: 'a2', description: 'C', debit: 0, credit: 500 },
    ]};
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('unbalanced'))).toBe(true);
  });

  it('rejects missing company_id', () => {
    const result = validateJournalEntry({ ...validEntry, company_id: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects fewer than 2 lines', () => {
    const result = validateJournalEntry({ ...validEntry, lines: [
      { account_id: 'a1', description: 'D', debit: 100, credit: 0 },
    ]});
    expect(result.valid).toBe(false);
  });

  it('rejects line with both debit and credit', () => {
    const result = validateJournalEntry({ ...validEntry, lines: [
      { account_id: 'a1', description: 'D', debit: 100, credit: 100 },
      { account_id: 'a2', description: 'C', debit: 0, credit: 0 },
    ]});
    expect(result.valid).toBe(false);
  });

  it('allows tolerance of half halala', () => {
    const entry = { ...validEntry, lines: [
      { account_id: 'a1', description: 'D', debit: 1000.004, credit: 0 },
      { account_id: 'a2', description: 'C', debit: 0, credit: 1000 },
    ]};
    const result = validateJournalEntry(entry);
    expect(result.valid).toBe(true);
  });
});

describe('validateDateInFiscalYear', () => {
  it('returns valid for date within range', () => {
    const result = validateDateInFiscalYear('2026-06-15', '2026-01-01', '2026-12-31');
    expect(result.valid).toBe(true);
  });

  it('returns invalid for date outside range', () => {
    const result = validateDateInFiscalYear('2025-06-15', '2026-01-01', '2026-12-31');
    expect(result.valid).toBe(false);
  });
});
