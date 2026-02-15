import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKeys } from '@/i18n/types';

export interface IndustryLabels {
  itemName: string;
  itemsName: string;
  itemUnit: string;
  availableItems: string;
  availableSubtitle: string;
  totalPurchasesLabel: string;
  allTimePurchasesSubUnit: string;
  allTimeSalesSubUnit: string;
  inventoryLabel: string;
  inventoryActions: { label: string; page: string }[];
  showTransfersReport: boolean;
  showPartnerReport: boolean;
  showCommissionsReport: boolean;
  showInventoryReport: boolean;
}

function buildLabels(companyType: CompanyActivityType, t: TranslationKeys): Record<CompanyActivityType, IndustryLabels> {
  return {
    car_dealership: {
      itemName: t.industry_car,
      itemsName: t.industry_cars,
      itemUnit: t.industry_car_unit,
      availableItems: t.industry_available_cars,
      availableSubtitle: t.industry_car_in_stock,
      totalPurchasesLabel: t.dashboard_total_purchases,
      allTimePurchasesSubUnit: t.industry_car_unit,
      allTimeSalesSubUnit: t.industry_sale_operation,
      inventoryLabel: t.industry_inventory,
      inventoryActions: [
        { label: t.available_cars, page: 'purchases' },
        { label: t.inventory_report, page: 'inventory-report' },
        { label: t.nav_transfers, page: 'car-transfers' },
      ],
      showTransfersReport: true,
      showPartnerReport: true,
      showCommissionsReport: true,
      showInventoryReport: true,
    },
    construction: {
      itemName: t.industry_project,
      itemsName: t.industry_projects,
      itemUnit: t.industry_project_unit,
      availableItems: t.industry_active_projects,
      availableSubtitle: t.industry_project_in_progress,
      totalPurchasesLabel: t.industry_total_costs,
      allTimePurchasesSubUnit: t.industry_project_unit,
      allTimeSalesSubUnit: t.industry_contract,
      inventoryLabel: t.industry_materials,
      inventoryActions: [
        { label: t.projects_label, page: 'projects' },
        { label: t.contracts_label, page: 'contracts' },
        { label: t.billings_label, page: 'progress-billings' },
      ],
      showTransfersReport: false,
      showPartnerReport: false,
      showCommissionsReport: false,
      showInventoryReport: false,
    },
    general_trading: {
      itemName: t.industry_product,
      itemsName: t.industry_products,
      itemUnit: t.industry_product_unit,
      availableItems: t.industry_available_products,
      availableSubtitle: t.industry_product_in_stock,
      totalPurchasesLabel: t.dashboard_total_purchases,
      allTimePurchasesSubUnit: t.industry_product_unit,
      allTimeSalesSubUnit: t.industry_sale_operation,
      inventoryLabel: t.industry_inventory,
      inventoryActions: [
        { label: t.available_products, page: 'purchases' },
        { label: t.inventory_report, page: 'inventory-report' },
      ],
      showTransfersReport: false,
      showPartnerReport: false,
      showCommissionsReport: true,
      showInventoryReport: true,
    },
    restaurant: {
      itemName: t.industry_item,
      itemsName: t.industry_items,
      itemUnit: t.industry_item_unit,
      availableItems: t.industry_available_items,
      availableSubtitle: t.industry_item_in_menu,
      totalPurchasesLabel: t.industry_total_supplies,
      allTimePurchasesSubUnit: t.industry_supply_order,
      allTimeSalesSubUnit: t.industry_sale_operation,
      inventoryLabel: t.industry_inventory,
      inventoryActions: [
        { label: t.menu_management_label, page: 'menu-management' },
        { label: t.orders_label, page: 'restaurant-orders' },
      ],
      showTransfersReport: false,
      showPartnerReport: false,
      showCommissionsReport: false,
      showInventoryReport: true,
    },
    export_import: {
      itemName: t.industry_shipment,
      itemsName: t.industry_shipments,
      itemUnit: t.industry_shipment_unit,
      availableItems: t.industry_active_shipments,
      availableSubtitle: t.industry_shipment_processing,
      totalPurchasesLabel: t.industry_total_imports,
      allTimePurchasesSubUnit: t.industry_shipment_unit,
      allTimeSalesSubUnit: t.industry_export_operation,
      inventoryLabel: t.industry_shipments,
      inventoryActions: [
        { label: t.shipments_label, page: 'shipments' },
        { label: t.lc_label, page: 'letters-of-credit' },
        { label: t.customs_label, page: 'customs-clearance' },
      ],
      showTransfersReport: false,
      showPartnerReport: false,
      showCommissionsReport: false,
      showInventoryReport: false,
    },
    medical: {
      itemName: t.industry_medicine || 'الدواء',
      itemsName: t.industry_medicines || 'الأدوية',
      itemUnit: t.industry_medicine_unit || 'دواء',
      availableItems: t.industry_available_medicines || 'الأدوية المتاحة',
      availableSubtitle: t.industry_medicine_in_stock || 'دواء في المخزون',
      totalPurchasesLabel: t.industry_total_medical_purchases || 'إجمالي المشتريات الطبية',
      allTimePurchasesSubUnit: t.industry_medicine_unit || 'دواء',
      allTimeSalesSubUnit: t.industry_sale_operation,
      inventoryLabel: t.industry_medical_inventory || 'المخزون الطبي',
      inventoryActions: [
        { label: t.industry_medicines || 'الأدوية', page: 'purchases' },
        { label: t.inventory_report, page: 'inventory-report' },
      ],
      showTransfersReport: false,
      showPartnerReport: false,
      showCommissionsReport: false,
      showInventoryReport: true,
    },
  };
}

export function useIndustryLabels(): IndustryLabels {
  const { company } = useCompany();
  const { t } = useLanguage();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const allLabels = buildLabels(companyType, t);
  return allLabels[companyType] || allLabels.car_dealership;
}

export function getIndustryLabelsByType(companyType: CompanyActivityType): IndustryLabels {
  // This static version can't use hooks, so it returns Arabic defaults
  // For proper i18n, use the useIndustryLabels hook instead
  const fallback: IndustryLabels = {
    itemName: 'Item', itemsName: 'Items', itemUnit: 'item',
    availableItems: 'Available', availableSubtitle: 'in stock',
    totalPurchasesLabel: 'Total Purchases',
    allTimePurchasesSubUnit: 'item', allTimeSalesSubUnit: 'sale',
    inventoryLabel: 'Inventory', inventoryActions: [],
    showTransfersReport: false, showPartnerReport: false,
    showCommissionsReport: false, showInventoryReport: false,
  };
  return fallback;
}
