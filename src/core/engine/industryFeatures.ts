/**
 * Core Engine - Industry Feature Flags
 * Replaces scattered `if (company_type === 'car_dealership')` checks
 * with a declarative configuration system
 */

export interface IndustryFeatures {
  /** Show car inventory management */
  hasCarInventory: boolean;
  /** Show partner dealerships & transfers */
  hasPartnerDealerships: boolean;
  /** Show commission tracking */
  hasCommissions: boolean;
  /** Show real estate projects module */
  hasRealEstateProjects: boolean;
  /** Show contractor management */
  hasContractors: boolean;
  /** Show CRM module */
  hasCRM: boolean;
  /** Show construction projects */
  hasConstructionProjects: boolean;
  /** Show inventory/stock management */
  hasInventory: boolean;
  /** Show manufacturing module */
  hasManufacturing: boolean;
  /** Use 'cars' table for purchases instead of 'invoices' */
  useCarsTable: boolean;
  /** Use 'sales' table instead of 'invoices' for sales */
  useCarSalesTable: boolean;
  /** Show transfers report */
  showTransfersReport: boolean;
  /** Show partner report */
  showPartnerReport: boolean;
  /** Show commissions report */
  showCommissionsReport: boolean;
  /** Show inventory report */
  showInventoryReport: boolean;
}

const DEFAULT_FEATURES: IndustryFeatures = {
  hasCarInventory: false,
  hasPartnerDealerships: false,
  hasCommissions: false,
  hasRealEstateProjects: false,
  hasContractors: false,
  hasCRM: false,
  hasConstructionProjects: false,
  hasInventory: true,
  hasManufacturing: false,
  useCarsTable: false,
  useCarSalesTable: false,
  showTransfersReport: false,
  showPartnerReport: false,
  showCommissionsReport: false,
  showInventoryReport: true,
};

/** Feature configuration per company type */
const FEATURE_MAP: Record<string, Partial<IndustryFeatures>> = {
  car_dealership: {
    hasCarInventory: true,
    hasPartnerDealerships: true,
    hasCommissions: true,
    useCarsTable: true,
    useCarSalesTable: true,
    showTransfersReport: true,
    showPartnerReport: true,
    showCommissionsReport: true,
  },
  real_estate: {
    hasRealEstateProjects: true,
    hasContractors: true,
    hasCRM: true,
    showInventoryReport: false,
  },
  construction: {
    hasConstructionProjects: true,
    showInventoryReport: false,
  },
  restaurant: {
    hasInventory: true,
  },
  export_import: {
    showInventoryReport: false,
  },
  medical: {
    hasInventory: true,
  },
  general_trading: {
    hasCommissions: true,
  },
  bookkeeping: {
    hasInventory: false,
    showInventoryReport: false,
  },
  manufacturing: {
    hasManufacturing: true,
    hasInventory: true,
  },
};

/** Human-readable labels for company types (Arabic) */
const COMPANY_TYPE_LABELS: Record<string, string> = {
  car_dealership: 'معرض سيارات',
  construction: 'مقاولات',
  general_trading: 'تجارة عامة',
  restaurant: 'مطاعم',
  export_import: 'استيراد وتصدير',
  real_estate: 'تطوير عقاري',
  medical: 'طبي',
  bookkeeping: 'مكتب محاسبة',
  manufacturing: 'تصنيع',
};

/** Display metadata per company type */
export interface IndustryDisplayMeta {
  appName: string;
  appNameEn: string;
  appSubtitle: string;
  appSubtitleEn: string;
  footerText: string;
  footerTextEn: string;
}

const DISPLAY_META: Record<string, IndustryDisplayMeta> = {
  car_dealership: {
    appName: 'نظام معارض السيارات',
    appNameEn: 'Car Dealership System',
    appSubtitle: 'إدارة المعرض',
    appSubtitleEn: 'Dealership Management',
    footerText: 'نظام معارض السيارات',
    footerTextEn: 'Car Dealership System',
  },
  construction: {
    appName: 'نظام المقاولات',
    appNameEn: 'Construction System',
    appSubtitle: 'إدارة المشاريع والمقاولات',
    appSubtitleEn: 'Construction Management',
    footerText: 'نظام المقاولات',
    footerTextEn: 'Construction System',
  },
  general_trading: {
    appName: 'نظام التجارة',
    appNameEn: 'Trading System',
    appSubtitle: 'إدارة التجارة العامة',
    appSubtitleEn: 'General Trading Management',
    footerText: 'نظام التجارة',
    footerTextEn: 'Trading System',
  },
  restaurant: {
    appName: 'نظام المطاعم',
    appNameEn: 'Restaurant System',
    appSubtitle: 'إدارة المطاعم والكافيهات',
    appSubtitleEn: 'Restaurant Management',
    footerText: 'نظام المطاعم',
    footerTextEn: 'Restaurant System',
  },
  export_import: {
    appName: 'نظام الاستيراد والتصدير',
    appNameEn: 'Import/Export System',
    appSubtitle: 'إدارة الاستيراد والتصدير',
    appSubtitleEn: 'Import/Export Management',
    footerText: 'نظام الاستيراد والتصدير',
    footerTextEn: 'Import/Export System',
  },
  real_estate: {
    appName: 'نظام التطوير العقاري',
    appNameEn: 'Real Estate System',
    appSubtitle: 'إدارة المشاريع العقارية',
    appSubtitleEn: 'Real Estate Management',
    footerText: 'نظام التطوير العقاري',
    footerTextEn: 'Real Estate System',
  },
  medical: {
    appName: 'النظام الطبي',
    appNameEn: 'Medical System',
    appSubtitle: 'إدارة الأدوية والمعدات الطبية',
    appSubtitleEn: 'Medical Supply Management',
    footerText: 'النظام الطبي',
    footerTextEn: 'Medical System',
  },
  bookkeeping: {
    appName: 'نظام مسك الدفاتر',
    appNameEn: 'Bookkeeping System',
    appSubtitle: 'خدمات محاسبية',
    appSubtitleEn: 'Accounting Services',
    footerText: 'نظام مسك الدفاتر',
    footerTextEn: 'Bookkeeping System',
  },
  manufacturing: {
    appName: 'نظام التصنيع',
    appNameEn: 'Manufacturing System',
    appSubtitle: 'إدارة التصنيع والإنتاج',
    appSubtitleEn: 'Manufacturing Management',
    footerText: 'نظام التصنيع',
    footerTextEn: 'Manufacturing System',
  },
};

const DEFAULT_DISPLAY_META: IndustryDisplayMeta = {
  appName: 'Elzini SaaS',
  appNameEn: 'Elzini SaaS',
  appSubtitle: 'نظام محاسبي متكامل',
  appSubtitleEn: 'Integrated ERP System',
  footerText: 'Elzini SaaS',
  footerTextEn: 'Elzini SaaS',
};

/**
 * Get feature flags for a company type
 */
export function getIndustryFeatures(companyType: string): IndustryFeatures {
  const overrides = FEATURE_MAP[companyType] || {};
  return { ...DEFAULT_FEATURES, ...overrides };
}

/**
 * Get display label for a company type
 */
export function getCompanyTypeLabel(companyType: string): string {
  return COMPANY_TYPE_LABELS[companyType] || companyType;
}
