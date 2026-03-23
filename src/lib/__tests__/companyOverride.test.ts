import { describe, it, expect } from 'vitest';
import { setCompanyOverride, getCompanyOverride } from '@/lib/companyOverride';

describe('companyOverride', () => {
  it('returns null by default', () => {
    setCompanyOverride(null);
    expect(getCompanyOverride()).toBeNull();
  });

  it('stores and retrieves an override', () => {
    setCompanyOverride('test-company-id');
    expect(getCompanyOverride()).toBe('test-company-id');
  });

  it('clears override when set to null', () => {
    setCompanyOverride('some-id');
    setCompanyOverride(null);
    expect(getCompanyOverride()).toBeNull();
  });
});
