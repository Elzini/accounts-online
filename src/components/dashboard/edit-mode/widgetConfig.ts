/**
 * Dashboard Widget Configuration - Types & Defaults
 */

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  colSpan: number;
}

// Widget label map keyed by widget id -> translation key
export const WIDGET_LABEL_KEYS: Record<string, string> = {
  quickAccess: 'widget_quick_access',
  availableCars: 'widget_available_cars',
  totalPurchases: 'widget_total_purchases',
  monthSales: 'widget_month_sales',
  totalProfit: 'widget_total_profit',
  todaySales: 'widget_today_sales',
  monthSalesCount: 'widget_month_sales_count',
  allTimePurchases: 'widget_all_time_purchases',
  allTimeSales: 'widget_all_time_sales',
  activeInstallments: 'widget_active_installments',
  overdueInstallments: 'widget_overdue_installments',
  upcomingInstallments: 'widget_upcoming_installments',
  totalDue: 'widget_total_due',
  nextPayment: 'widget_next_payment',
  monthlyExpenses: 'widget_monthly_expenses',
  transfers: 'widget_transfers',
  quickActions: 'widget_quick_actions',
  reports: 'widget_reports',
  recentInvoices: 'widget_recent_invoices',
};

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'totalPurchases', label: 'إجمالي المشتريات', visible: true, order: 0, colSpan: 1 },
  { id: 'monthSales', label: 'مبيعات الشهر', visible: true, order: 1, colSpan: 1 },
  { id: 'smartAlerts', label: 'التنبيهات الذكية', visible: true, order: 2, colSpan: 2 },
  { id: 'quickAccess', label: 'الوصول السريع', visible: false, order: 3, colSpan: 2 },
  { id: 'availableCars', label: 'السيارات المتاحة', visible: false, order: 4, colSpan: 1 },
  { id: 'totalProfit', label: 'إجمالي الأرباح', visible: false, order: 5, colSpan: 1 },
  { id: 'todaySales', label: 'مبيعات اليوم', visible: false, order: 6, colSpan: 1 },
  { id: 'monthSalesCount', label: 'عدد مبيعات الشهر', visible: false, order: 7, colSpan: 1 },
  { id: 'allTimePurchases', label: 'إجمالي مشتريات الشركة', visible: false, order: 8, colSpan: 1 },
  { id: 'allTimeSales', label: 'إجمالي مبيعات الشركة', visible: false, order: 9, colSpan: 1 },
  { id: 'activeInstallments', label: 'عقود التقسيط النشطة', visible: false, order: 10, colSpan: 1 },
  { id: 'overdueInstallments', label: 'الأقساط المتأخرة', visible: false, order: 11, colSpan: 1 },
  { id: 'upcomingInstallments', label: 'أقساط الشهر الحالي', visible: false, order: 12, colSpan: 1 },
  { id: 'totalDue', label: 'إجمالي المستحق', visible: false, order: 13, colSpan: 1 },
  { id: 'nextPayment', label: 'القسط القادم', visible: false, order: 14, colSpan: 2 },
  { id: 'monthlyExpenses', label: 'المصروفات الشهرية', visible: false, order: 15, colSpan: 2 },
  { id: 'transfers', label: 'السيارات الوارد والصادر', visible: false, order: 16, colSpan: 2 },
  { id: 'quickActions', label: 'الإجراءات السريعة', visible: false, order: 17, colSpan: 1 },
  { id: 'reports', label: 'التقارير', visible: false, order: 18, colSpan: 1 },
  { id: 'recentInvoices', label: 'أحدث الفواتير', visible: false, order: 19, colSpan: 2 },
  { id: 'securityAlerts', label: 'مراقبة الأمان', visible: false, order: 20, colSpan: 2 },
];
