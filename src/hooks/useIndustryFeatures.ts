/**
 * React Hook - Industry Feature Flags
 * Replaces all `company?.company_type === 'car_dealership'` checks
 * 
 * Usage:
 *   const features = useIndustryFeatures();
 *   if (features.hasCarInventory) { ... }
 */

import { useCompany } from '@/contexts/CompanyContext';
import { getIndustryFeatures, IndustryFeatures } from '@/core/engine/industryFeatures';

export function useIndustryFeatures(): IndustryFeatures {
  const { company } = useCompany();
  const companyType = company?.company_type || 'general_trading';
  return getIndustryFeatures(companyType);
}
