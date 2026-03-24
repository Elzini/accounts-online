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
  { id: 'quickAccess', label: 'الوصول السريع', visible: true, order: 0, colSpan: 2 },
  { id: 'availableCars', label: 'السيارات المتاحة', visible: true, order: 1, colSpan: 1 },
  { id: 'totalPurchases', label: 'إجمالي المشتريات', visible: true, order: 2, colSpan: 1 },
  { id: 'monthSales', label: 'مبيعات الشهر', visible: true, order: 3, colSpan: 1 },
  { id: 'totalProfit', label: 'إجمالي الأرباح', visible: true, order: 4, colSpan: 1 },
  { id: 'todaySales', label: 'مبيعات اليوم', visible: true, order: 5, colSpan: 1 },
  { id: 'monthSalesCount', label: 'عدد مبيعات الشهر', visible: true, order: 6, colSpan: 1 },
  { id: 'allTimePurchases', label: 'إجمالي مشتريات الشركة', visible: true, order: 7, colSpan: 1 },
  { id: 'allTimeSales', label: 'إجمالي مبيعات الشركة', visible: true, order: 8, colSpan: 1 },
  { id: 'activeInstallments', label: 'عقود التقسيط النشطة', visible: true, order: 9, colSpan: 1 },
  { id: 'overdueInstallments', label: 'الأقساط المتأخرة', visible: true, order: 10, colSpan: 1 },
  { id: 'upcomingInstallments', label: 'أقساط الشهر الحالي', visible: true, order: 11, colSpan: 1 },
  { id: 'totalDue', label: 'إجمالي المستحق', visible: true, order: 12, colSpan: 1 },
  { id: 'nextPayment', label: 'القسط القادم', visible: true, order: 13, colSpan: 2 },
  { id: 'monthlyExpenses', label: 'المصروفات الشهرية', visible: true, order: 14, colSpan: 2 },
  { id: 'transfers', label: 'السيارات الوارد والصادر', visible: true, order: 15, colSpan: 2 },
  { id: 'quickActions', label: 'الإجراءات السريعة', visible: true, order: 16, colSpan: 1 },
  { id: 'reports', label: 'التقارير', visible: true, order: 17, colSpan: 1 },
  { id: 'recentInvoices', label: 'أحدث الفواتير', visible: true, order: 18, colSpan: 2 },
  { id: 'smartAlerts', label: 'التنبيهات الذكية', visible: true, order: 19, colSpan: 2 },
  { id: 'securityAlerts', label: 'مراقبة الأمان', visible: true, order: 20, colSpan: 2 },
];
