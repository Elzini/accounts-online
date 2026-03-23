import { describe, it, expect } from 'vitest';
import { validateJournalEntry, validateDateInFiscalYear, validateLeafAccount } from '@/core/engine/validation';
import type { JournalEntryInput } from '@/core/engine/types';

describe('validateLeafAccount', () => {
  const accounts = [
    { id: 'parent', parent_id: null },
    { id: 'child1', parent_id: 'parent' },
    { id: 'child2', parent_id: 'parent' },
    { id: 'leaf', parent_id: null },
  ];

  it('rejects posting to a parent account', () => {
    const result = validateLeafAccount('parent', accounts);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('parent');
  });

  it('allows posting to a leaf account', () => {
    const result = validateLeafAccount('leaf', accounts);
    expect(result.valid).toBe(true);
  });

  it('allows posting to a child (leaf) account', () => {
    const result = validateLeafAccount('child1', accounts);
    expect(result.valid).toBe(true);
  });
});

describe('validateJournalEntry - edge cases', () => {
  const base: JournalEntryInput = {
    company_id: 'c1', fiscal_year_id: 'fy1', entry_date: '2026-01-15',
    description: 'Test',
    lines: [
      { account_id: 'a1', description: 'D', debit: 100, credit: 0 },
      { account_id: 'a2', description: 'C', debit: 0, credit: 100 },
    ],
  };

  it('rejects negative debit', () => {
    const result = validateJournalEntry({
      ...base, lines: [
        { account_id: 'a1', description: 'D', debit: -50, credit: 0 },
        { account_id: 'a2', description: 'C', debit: 0, credit: -50 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('negative'))).toBe(true);
  });

  it('rejects missing entry_date', () => {
    const result = validateJournalEntry({ ...base, entry_date: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only description', () => {
    const result = validateJournalEntry({ ...base, description: '   ' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing account_id on line', () => {
    const result = validateJournalEntry({
      ...base, lines: [
        { account_id: '', description: 'D', debit: 100, credit: 0 },
        { account_id: 'a2', description: 'C', debit: 0, credit: 100 },
      ],
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateDateInFiscalYear - edge cases', () => {
  it('accepts date on start boundary', () => {
    expect(validateDateInFiscalYear('2026-01-01', '2026-01-01', '2026-12-31').valid).toBe(true);
  });

  it('accepts date on end boundary', () => {
    expect(validateDateInFiscalYear('2026-12-31', '2026-01-01', '2026-12-31').valid).toBe(true);
  });

  it('rejects date one day before start', () => {
    expect(validateDateInFiscalYear('2025-12-31', '2026-01-01', '2026-12-31').valid).toBe(false);
  });

  it('rejects date one day after end', () => {
    expect(validateDateInFiscalYear('2027-01-01', '2026-01-01', '2026-12-31').valid).toBe(false);
  });
});
