import { describe, it, expect } from 'vitest';
import { getIndustryFeatures, getCompanyTypeLabel } from '@/core/engine/industryFeatures';

describe('getIndustryFeatures', () => {
  it('returns car inventory features for car_dealership', () => {
    const features = getIndustryFeatures('car_dealership');
    expect(features.hasCarInventory).toBe(true);
  });

  it('returns no car inventory for general_trading', () => {
    const features = getIndustryFeatures('general_trading');
    expect(features.hasCarInventory).toBe(false);
  });

  it('handles null/undefined company type gracefully', () => {
    const features1 = getIndustryFeatures(null);
    expect(features1.hasCarInventory).toBe(false);

    const features2 = getIndustryFeatures(undefined);
    expect(features2.hasCarInventory).toBe(false);
  });

  it('returns real estate features for real_estate', () => {
    const features = getIndustryFeatures('real_estate');
    expect(features.hasCarInventory).toBe(false);
  });
});

describe('getCompanyTypeLabel', () => {
  it('returns label for known types', () => {
    const label = getCompanyTypeLabel('car_dealership');
    expect(label).toBeTruthy();
    expect(typeof label).toBe('string');
  });

  it('returns fallback for unknown type', () => {
    const label = getCompanyTypeLabel('unknown_type_xyz');
    expect(label).toBeTruthy();
  });
});
