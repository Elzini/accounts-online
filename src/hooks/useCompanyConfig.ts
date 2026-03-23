/**
 * Unified Company Configuration Hook
 * 
 * Single hook that provides:
 * - CompanyConfig (accounting settings, tax, mappings)
 * - IndustryFeatures (feature flags per company type)
 * 
 * Cached via React Query — fetched once per company, auto-invalidated.
 * 
 * Usage:
 *   const { config, features, isLoading } = useCompanyConfig();
 *   if (features.hasCarInventory) { ... }
 *   if (config.tax.is_active) { ... }
 */

import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { loadCompanyConfig } from '@/core/engine/companyConfigLoader';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';
import type { CompanyConfig } from '@/core/engine/types';
import type { IndustryFeatures } from '@/core/engine/industryFeatures';

interface CompanyConfigResult {
  config: CompanyConfig | null;
  features: IndustryFeatures;
  isLoading: boolean;
  /** Shorthand: is car dealership */
  isCarDealership: boolean;
  /** Shorthand: is real estate */
  isRealEstate: boolean;
}

const DEFAULT_FEATURES = getIndustryFeatures('general_trading');

export function useCompanyConfig(): CompanyConfigResult {
  const { companyId, company } = useCompany();
  const companyType = company?.company_type || 'general_trading';

  const { data: config = null, isLoading } = useQuery({
    queryKey: ['company-config', companyId],
    queryFn: () => loadCompanyConfig(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  });

  const features = config
    ? getIndustryFeatures(config.company_type)
    : getIndustryFeatures(companyType);

  return {
    config,
    features,
    isLoading,
    isCarDealership: features.hasCarInventory,
    isRealEstate: features.hasRealEstateProjects,
  };
}
