import { describe, it, expect } from 'vitest';
import { toDateOnly } from '@/services/companyContext';

describe('toDateOnly', () => {
  it('formats a date correctly', () => {
    const date = new Date(2026, 2, 23); // March 23, 2026
    expect(toDateOnly(date)).toBe('2026-03-23');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2026, 0, 5); // Jan 5, 2026
    expect(toDateOnly(date)).toBe('2026-01-05');
  });

  it('handles December correctly', () => {
    const date = new Date(2025, 11, 31); // Dec 31, 2025
    expect(toDateOnly(date)).toBe('2025-12-31');
  });
});
