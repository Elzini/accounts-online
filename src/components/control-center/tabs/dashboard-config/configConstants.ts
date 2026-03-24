/**
 * Dashboard Config Constants - Extracted from DashboardConfigTab.tsx
 */

export const STAT_CARD_TYPES = [
  { id: 'available_cars', label: 'السيارات المتاحة', icon: '🚗', category: 'inventory' },
  { id: 'total_purchases', label: 'إجمالي المشتريات', icon: '🛒', category: 'purchases' },
  { id: 'month_sales', label: 'مبيعات الشهر', icon: '📈', category: 'sales' },
  { id: 'total_profit', label: 'إجمالي الأرباح', icon: '💰', category: 'profit' },
  { id: 'today_sales', label: 'مبيعات اليوم', icon: '📊', category: 'sales' },
  { id: 'month_sales_count', label: 'عدد مبيعات الشهر', icon: '🔢', category: 'sales' },
  { id: 'year_sales', label: 'مبيعات السنة', icon: '📅', category: 'sales' },
  { id: 'year_purchases', label: 'مشتريات السنة', icon: '📦', category: 'purchases' },
  { id: 'month_purchases', label: 'مشتريات الشهر', icon: '🛍️', category: 'purchases' },
  { id: 'gross_profit', label: 'إجمالي الربح الخام', icon: '💵', category: 'profit' },
  { id: 'net_profit', label: 'صافي الربح', icon: '💎', category: 'profit' },
  { id: 'total_expenses', label: 'إجمالي المصروفات', icon: '💸', category: 'expenses' },
  { id: 'month_expenses', label: 'مصروفات الشهر', icon: '📉', category: 'expenses' },
  { id: 'active_installments', label: 'عقود التقسيط النشطة', icon: '📋', category: 'installments' },
  { id: 'overdue_installments', label: 'الأقساط المتأخرة', icon: '⚠️', category: 'installments' },
  { id: 'current_month_installments', label: 'أقساط الشهر الحالي', icon: '💳', category: 'installments' },
  { id: 'total_receivables', label: 'إجمالي المستحق', icon: '💲', category: 'installments' },
  { id: 'customers_count', label: 'عدد العملاء', icon: '👥', category: 'customers' },
  { id: 'suppliers_count', label: 'عدد الموردين', icon: '🚚', category: 'suppliers' },
  { id: 'incoming_transfers', label: 'التحويلات الواردة', icon: '⬇️', category: 'transfers' },
  { id: 'outgoing_transfers', label: 'التحويلات الصادرة', icon: '⬆️', category: 'transfers' },
  { id: 'all_time_purchases', label: 'إجمالي مشتريات الشركة (كل السنين)', icon: '🏢', category: 'all_time' },
  { id: 'all_time_sales', label: 'إجمالي مبيعات الشركة (كل السنين)', icon: '🌐', category: 'all_time' },
];

export const ANALYTICS_COMPONENTS = [
  { id: 'sales_chart', label: 'رسم المبيعات البياني', description: 'رسم بياني شهري للمبيعات' },
  { id: 'profit_chart', label: 'رسم الأرباح البياني', description: 'رسم بياني شهري للأرباح' },
  { id: 'inventory_pie', label: 'توزيع المخزون', description: 'رسم دائري لحالة السيارات' },
  { id: 'revenue_area', label: 'منحنى الإيرادات', description: 'رسم المساحة للإيرادات والتكاليف' },
  { id: 'top_customers', label: 'أفضل العملاء', description: 'قائمة بأفضل العملاء' },
  { id: 'top_cars', label: 'أفضل السيارات مبيعاً', description: 'أكثر السيارات مبيعاً' },
  { id: 'performance_kpis', label: 'مؤشرات الأداء', description: 'مؤشرات KPI رئيسية' },
  { id: 'recent_activity', label: 'النشاط الأخير', description: 'آخر العمليات' },
  { id: 'trend_cards', label: 'بطاقات الاتجاه', description: 'بطاقات تحليل الاتجاهات' },
];

export interface StatCardConfig {
  id: string; type: string; label: string; visible: boolean;
  order: number; size: 'small' | 'medium' | 'large'; color?: string; width?: number; height?: number;
}

export interface AnalyticsConfig {
  componentId: string; visible: boolean; order: number; size: 'half' | 'full';
}

export interface LayoutConfig {
  cardsPerRow: number; cardSpacing: number; showOverviewTab: boolean;
  showAnalyticsTab: boolean; defaultTab: 'overview' | 'analytics';
}

export const DEFAULT_STAT_CARDS: StatCardConfig[] = [
  { id: '1', type: 'available_cars', label: 'السيارات المتاحة', visible: true, order: 0, size: 'medium' },
  { id: '2', type: 'total_purchases', label: 'إجمالي المشتريات', visible: true, order: 1, size: 'medium' },
  { id: '3', type: 'month_sales', label: 'مبيعات الشهر', visible: true, order: 2, size: 'medium' },
  { id: '4', type: 'total_profit', label: 'إجمالي الأرباح', visible: true, order: 3, size: 'medium' },
  { id: '5', type: 'today_sales', label: 'مبيعات اليوم', visible: true, order: 4, size: 'medium' },
  { id: '6', type: 'month_sales_count', label: 'عدد مبيعات الشهر', visible: true, order: 5, size: 'medium' },
];

export const DEFAULT_ANALYTICS: AnalyticsConfig[] = [
  { componentId: 'trend_cards', visible: true, order: 0, size: 'full' },
  { componentId: 'inventory_pie', visible: true, order: 1, size: 'half' },
  { componentId: 'revenue_area', visible: true, order: 2, size: 'half' },
  { componentId: 'top_customers', visible: true, order: 3, size: 'half' },
  { componentId: 'performance_kpis', visible: true, order: 4, size: 'half' },
  { componentId: 'recent_activity', visible: true, order: 5, size: 'full' },
];

export const DEFAULT_LAYOUT: LayoutConfig = {
  cardsPerRow: 3, cardSpacing: 4, showOverviewTab: true, showAnalyticsTab: true, defaultTab: 'overview',
};
