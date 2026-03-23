/**
 * useIndustryModule - Hook to consume the active industry module
 * Replaces scattered isCarDealership checks with module-driven logic
 */
import { useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { ModuleRegistry } from '@/core/engine/moduleRegistry';
import { getIndustryFeatures, IndustryFeatures } from '@/core/engine/industryFeatures';
import type { IndustryModule } from '@/core/engine/types';

// Ensure modules are registered
import '@/core/modules';

export interface UseIndustryModuleReturn {
  /** The active industry module (or generic fallback) */
  module: IndustryModule | null;
  /** Feature flags for the current company type */
  features: IndustryFeatures;
  /** Shorthand: is car dealership */
  isCarDealership: boolean;
  /** Shorthand: is real estate */
  isRealEstate: boolean;
  /** Company type string */
  companyType: string;
  /** Get label with industry override support */
  getLabel: (key: string, fallback: string) => string;
  /** Get purchase item types for this industry */
  purchaseItemTypes: IndustryModule['purchaseItemTypes'];
  /** Get industry-specific reports */
  reports: IndustryModule['reports'];
  /** Get industry-specific dashboard cards */
  dashboardCards: IndustryModule['dashboardCards'];
}

export function useIndustryModule(): UseIndustryModuleReturn {
  const { company } = useCompany();
  const companyType = company?.company_type || 'general_trading';

  return useMemo(() => {
    const module = ModuleRegistry.getForType(companyType);
    const features = getIndustryFeatures(companyType);

    const getLabel = (key: string, fallback: string): string => {
      return module?.labelOverrides?.[key] || fallback;
    };

    return {
      module,
      features,
      isCarDealership: companyType === 'car_dealership',
      isRealEstate: companyType === 'real_estate',
      companyType,
      getLabel,
      purchaseItemTypes: module?.purchaseItemTypes,
      reports: module?.reports,
      dashboardCards: module?.dashboardCards,
    };
  }, [companyType]);
}
