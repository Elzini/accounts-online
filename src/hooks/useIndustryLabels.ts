import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';

export interface IndustryLabels {
  // General terms
  itemName: string;        // السيارة / المشروع / المنتج
  itemsName: string;       // السيارات / المشاريع / المنتجات
  itemUnit: string;        // سيارة / مشروع / منتج (counting unit)
  
  // Dashboard
  availableItems: string;  // السيارات المتاحة / المشاريع النشطة
  availableSubtitle: string; // سيارة في المخزون / مشروع نشط
  totalPurchasesLabel: string;
  
  // All-time stats
  allTimePurchasesSubUnit: string; // سيارة / مشروع
  allTimeSalesSubUnit: string;    // عملية بيع / عقد
  
  // Quick access
  inventoryLabel: string;  // المخزون / المواد
  inventoryActions: { label: string; page: string }[];
  
  // Reports
  showTransfersReport: boolean;
  showPartnerReport: boolean;
  showCommissionsReport: boolean;
  showInventoryReport: boolean;
}

const labelsMap: Record<CompanyActivityType, IndustryLabels> = {
  car_dealership: {
    itemName: 'السيارة',
    itemsName: 'السيارات',
    itemUnit: 'سيارة',
    availableItems: 'السيارات المتاحة',
    availableSubtitle: 'سيارة في المخزون',
    totalPurchasesLabel: 'إجمالي المشتريات',
    allTimePurchasesSubUnit: 'سيارة',
    allTimeSalesSubUnit: 'عملية بيع',
    inventoryLabel: 'المخزون',
    inventoryActions: [
      { label: 'السيارات المتاحة', page: 'purchases' },
      { label: 'تقرير المخزون', page: 'inventory-report' },
      { label: 'التحويلات', page: 'car-transfers' },
    ],
    showTransfersReport: true,
    showPartnerReport: true,
    showCommissionsReport: true,
    showInventoryReport: true,
  },
  construction: {
    itemName: 'المشروع',
    itemsName: 'المشاريع',
    itemUnit: 'مشروع',
    availableItems: 'المشاريع النشطة',
    availableSubtitle: 'مشروع قيد التنفيذ',
    totalPurchasesLabel: 'إجمالي التكاليف',
    allTimePurchasesSubUnit: 'مشروع',
    allTimeSalesSubUnit: 'عقد',
    inventoryLabel: 'المواد',
    inventoryActions: [
      { label: 'المشاريع', page: 'projects' },
      { label: 'العقود', page: 'contracts' },
      { label: 'المستخلصات', page: 'progress-billings' },
    ],
    showTransfersReport: false,
    showPartnerReport: false,
    showCommissionsReport: false,
    showInventoryReport: false,
  },
  general_trading: {
    itemName: 'المنتج',
    itemsName: 'المنتجات',
    itemUnit: 'منتج',
    availableItems: 'المنتجات المتاحة',
    availableSubtitle: 'منتج في المخزون',
    totalPurchasesLabel: 'إجمالي المشتريات',
    allTimePurchasesSubUnit: 'منتج',
    allTimeSalesSubUnit: 'عملية بيع',
    inventoryLabel: 'المخزون',
    inventoryActions: [
      { label: 'المنتجات المتاحة', page: 'purchases' },
      { label: 'تقرير المخزون', page: 'inventory-report' },
    ],
    showTransfersReport: false,
    showPartnerReport: false,
    showCommissionsReport: true,
    showInventoryReport: true,
  },
  restaurant: {
    itemName: 'الصنف',
    itemsName: 'الأصناف',
    itemUnit: 'صنف',
    availableItems: 'الأصناف المتاحة',
    availableSubtitle: 'صنف في القائمة',
    totalPurchasesLabel: 'إجمالي التوريدات',
    allTimePurchasesSubUnit: 'طلب توريد',
    allTimeSalesSubUnit: 'عملية بيع',
    inventoryLabel: 'المخزون',
    inventoryActions: [
      { label: 'إدارة القائمة', page: 'menu-management' },
      { label: 'الطلبات', page: 'restaurant-orders' },
    ],
    showTransfersReport: false,
    showPartnerReport: false,
    showCommissionsReport: false,
    showInventoryReport: true,
  },
  export_import: {
    itemName: 'الشحنة',
    itemsName: 'الشحنات',
    itemUnit: 'شحنة',
    availableItems: 'الشحنات النشطة',
    availableSubtitle: 'شحنة قيد المعالجة',
    totalPurchasesLabel: 'إجمالي الواردات',
    allTimePurchasesSubUnit: 'شحنة',
    allTimeSalesSubUnit: 'عملية تصدير',
    inventoryLabel: 'الشحنات',
    inventoryActions: [
      { label: 'الشحنات', page: 'shipments' },
      { label: 'خطابات الاعتماد', page: 'letters-of-credit' },
      { label: 'التخليص الجمركي', page: 'customs-clearance' },
    ],
    showTransfersReport: false,
    showPartnerReport: false,
    showCommissionsReport: false,
    showInventoryReport: false,
  },
};

export function useIndustryLabels(): IndustryLabels {
  const { company } = useCompany();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  return labelsMap[companyType] || labelsMap.car_dealership;
}

export function getIndustryLabelsByType(companyType: CompanyActivityType): IndustryLabels {
  return labelsMap[companyType] || labelsMap.car_dealership;
}
