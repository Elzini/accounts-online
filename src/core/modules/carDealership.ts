/**
 * Car Dealership Module (Plugin)
 * Fully encapsulates car-specific logic: stats, menus, posting rules, reports, labels
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/hooks/modules/useMiscServices';

export const CarDealershipModule: IndustryModule = {
  id: 'car_dealership',
  name: 'معارض السيارات',
  supportedTypes: ['car_dealership'],

  async getDashboardStats(companyId: string, fiscalYearId?: string): Promise<Partial<DashboardStats>> {
    const [carsRes, salesRes, transfersRes] = await Promise.all([
      supabase.from('cars').select('id, status, purchase_price').eq('company_id', companyId),
      supabase.from('sales').select('id, selling_price, sale_date').eq('company_id', companyId),
      supabase.from('car_transfers').select('id, status').eq('company_id', companyId),
    ]);

    const cars = carsRes.data || [];
    const sales = salesRes.data || [];
    const transfers = transfersRes.data || [];

    const availableCars = cars.filter(c => c.status === 'available').length;
    const soldCars = cars.filter(c => c.status === 'sold').length;
    const activeTransfers = transfers.filter(t => t.status === 'pending').length;

    return {
      extra: {
        availableCars,
        soldCars,
        totalCars: cars.length,
        activeTransfers,
        totalTransfers: transfers.length,
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'cars', label: 'المخزون', icon: 'Car', path: '/cars' },
      { id: 'partner-dealerships', label: 'المعارض الشريكة', icon: 'Building2', path: '/partner-dealerships' },
      { id: 'car-transfers', label: 'تحويلات السيارات', icon: 'ArrowLeftRight', path: '/car-transfers' },
    ];
  },

  getCoaTemplate(): string {
    return 'car_dealership';
  },

  // === Extended Plugin Properties ===

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'شراء سيارة - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'customers',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'بيع سيارة - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'car',
      label: 'سيارة',
      table: 'cars',
      fields: [
        { key: 'name', label: 'اسم السيارة', type: 'text', required: true },
        { key: 'model', label: 'الموديل', type: 'text' },
        { key: 'color', label: 'اللون', type: 'text' },
        { key: 'chassis_number', label: 'رقم الهيكل', type: 'text', required: true },
        { key: 'plate_number', label: 'رقم اللوحة', type: 'text' },
        { key: 'car_condition', label: 'الحالة', type: 'select', options: [{ value: 'new', label: 'جديدة' }, { value: 'used', label: 'مستعملة' }] },
        { key: 'purchase_price', label: 'سعر الشراء', type: 'number', required: true },
      ],
    },
  ],

  reports: [
    {
      id: 'car-inventory',
      title: 'تقرير المخزون',
      subtitle: 'السيارات المتاحة والمباعة',
      table: 'cars',
      columns: [
        { header: 'رقم المخزون', key: 'inventory_number', type: 'number' },
        { header: 'اسم السيارة', key: 'name', type: 'text' },
        { header: 'الموديل', key: 'model', type: 'text' },
        { header: 'رقم الهيكل', key: 'chassis_number', type: 'text' },
        { header: 'سعر الشراء', key: 'purchase_price', type: 'currency' },
        { header: 'الحالة', key: 'status', type: 'status' },
      ],
      statusOptions: [
        { value: 'available', label: 'متاحة' },
        { value: 'sold', label: 'مباعة' },
        { value: 'transferred', label: 'محولة' },
      ],
    },
  ],

  dashboardCards: [
    { id: 'available-cars', title: 'سيارات متاحة', icon: 'Car', valueKey: 'availableCars', format: 'number' },
    { id: 'sold-cars', title: 'سيارات مباعة', icon: 'TrendingUp', valueKey: 'soldCars', format: 'number' },
    { id: 'active-transfers', title: 'تحويلات نشطة', icon: 'ArrowLeftRight', valueKey: 'activeTransfers', format: 'number' },
  ],

  labelOverrides: {
    'inv_item': 'السيارة',
    'inv_add_item': 'إضافة سيارة',
    'inv_items': 'السيارات',
    'purchases_title': 'مشتريات السيارات',
    'sales_title': 'مبيعات السيارات',
    'inventory_title': 'مخزون السيارات',
    'rpt_status_available': 'متاحة',
    'rpt_status_sold': 'مباعة',
  },
};
