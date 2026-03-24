/**
 * Manufacturing Module (Plugin)
 * Encapsulates manufacturing-specific logic: stats, menus, posting rules, labels
 */
import { IndustryModule, DashboardStats, MenuItem } from '@/core/engine/types';
import { supabase } from '@/hooks/modules/useMiscServices';

export const ManufacturingModule: IndustryModule = {
  id: 'manufacturing',
  name: 'التصنيع',
  supportedTypes: ['manufacturing'],

  async getDashboardStats(companyId: string): Promise<Partial<DashboardStats>> {
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('manufacturing_products').select('id, status').eq('company_id', companyId),
      supabase.from('manufacturing_orders').select('id, status, quantity').eq('company_id', companyId),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const activeOrders = orders.filter(o => o.status === 'in_progress').length;

    return {
      extra: {
        totalProducts: products.length,
        activeOrders,
        totalOrders: orders.length,
        totalQuantity: orders.reduce((s, o) => s + (Number(o.quantity) || 0), 0),
      },
    };
  },

  getMenuItems(): MenuItem[] {
    return [
      { id: 'products', label: 'المنتجات', icon: 'Box', path: '/manufacturing/products' },
      { id: 'orders', label: 'أوامر التصنيع', icon: 'Factory', path: '/manufacturing/orders' },
      { id: 'bom', label: 'قوائم المواد', icon: 'List', path: '/manufacturing/bom' },
      { id: 'inventory', label: 'المخزون', icon: 'Package', path: '/inventory' },
    ];
  },

  getCoaTemplate(): string {
    return 'general_trading';
  },

  postingRules: {
    purchase: {
      debitAccountKey: 'purchase_expense',
      creditAccountKey: 'suppliers',
      applyVat: true,
      vatAccountKey: 'vat_input',
      descriptionTemplate: 'مشتريات مواد خام - {reference} - {party}',
    },
    sale: {
      debitAccountKey: 'sales_cash',
      creditAccountKey: 'sales_revenue',
      applyVat: true,
      vatAccountKey: 'vat_output',
      descriptionTemplate: 'مبيعات منتجات - {reference} - {party}',
    },
  },

  purchaseItemTypes: [
    {
      id: 'raw_material',
      label: 'مواد خام',
      table: 'invoice_items',
      fields: [
        { key: 'item_name', label: 'اسم المادة', type: 'text', required: true },
        { key: 'quantity', label: 'الكمية', type: 'number', required: true },
        { key: 'unit_price', label: 'سعر الوحدة', type: 'number', required: true },
      ],
    },
  ],

  dashboardCards: [
    { id: 'active-orders', title: 'أوامر تصنيع نشطة', icon: 'Factory', valueKey: 'activeOrders', format: 'number' },
    { id: 'total-products', title: 'إجمالي المنتجات', icon: 'Box', valueKey: 'totalProducts', format: 'number' },
  ],

  labelOverrides: {
    'inv_item': 'المادة الخام',
    'inv_add_item': 'إضافة مادة خام',
    'inv_items': 'المواد الخام',
    'purchases_title': 'مشتريات المصنع',
    'sales_title': 'مبيعات المنتجات',
    'inventory_title': 'مخزون المصنع',
  },
};
