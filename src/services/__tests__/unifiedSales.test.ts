import { describe, it, expect } from 'vitest';
import { getSalesReferenceTypes } from '@/services/unifiedSales';

describe('unifiedSales', () => {
  describe('getSalesReferenceTypes', () => {
    it('returns "sale" for car dealership', () => {
      const types = getSalesReferenceTypes('car_dealership');
      expect(types).toContain('sale');
    });

    it('returns "invoice_sale" for general trading', () => {
      const types = getSalesReferenceTypes('general_trading');
      expect(types).toContain('invoice_sale');
    });

    it('returns "invoice_sale" for null company type', () => {
      const types = getSalesReferenceTypes(null);
      expect(types).toContain('invoice_sale');
    });
  });
});
