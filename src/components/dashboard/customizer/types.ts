/**
 * Dashboard Customizer Types & Constants
 * Extracted from DashboardCustomizer.tsx
 */

export interface CardConfig {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
  bgColor?: string;
  textColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  fontSize?: number;
  height?: number;
  width?: number;
  enable3D?: boolean;
  showTrend?: boolean;
  trendColor?: string;
  dataSource?: 'default' | 'account' | 'formula';
  accountId?: string;
  formulaAccounts?: FormulaAccountItem[];
}

export interface FormulaAccountItem {
  accountId: string;
  accountName: string;
  accountCode: string;
  operator: '+' | '-';
}

export const DEFAULT_STAT_CARDS: CardConfig[] = [
  { id: 'totalPurchases', type: 'stat', label: 'إجمالي المشتريات', visible: true, order: 0, size: 'medium' },
  { id: 'monthSales', type: 'stat', label: 'مبيعات الشهر', visible: true, order: 1, size: 'medium' },
  { id: 'smartAlerts', type: 'widget', label: 'التنبيهات الذكية', visible: true, order: 2, size: 'medium' },
  { id: 'quickAccess', type: 'widget', label: 'الوصول السريع', visible: false, order: 3, size: 'medium' },
  { id: 'availableCars', type: 'stat', label: 'السيارات المتاحة', visible: false, order: 4, size: 'medium' },
  { id: 'totalProfit', type: 'stat', label: 'إجمالي الأرباح', visible: false, order: 5, size: 'medium' },
  { id: 'todaySales', type: 'stat', label: 'مبيعات اليوم', visible: false, order: 6, size: 'medium' },
  { id: 'monthSalesCount', type: 'stat', label: 'عدد مبيعات الشهر', visible: false, order: 7, size: 'medium' },
  { id: 'allTimePurchases', type: 'stat', label: 'إجمالي مشتريات الشركة', visible: false, order: 8, size: 'medium' },
  { id: 'allTimeSales', type: 'stat', label: 'إجمالي مبيعات الشركة', visible: false, order: 9, size: 'medium' },
  { id: 'activeInstallments', type: 'stat', label: 'عقود التقسيط النشطة', visible: false, order: 10, size: 'medium' },
  { id: 'overdueInstallments', type: 'stat', label: 'الأقساط المتأخرة', visible: false, order: 11, size: 'medium' },
  { id: 'upcomingInstallments', type: 'stat', label: 'أقساط الشهر الحالي', visible: false, order: 12, size: 'medium' },
  { id: 'totalDue', type: 'stat', label: 'إجمالي المستحق', visible: false, order: 13, size: 'medium' },
  { id: 'nextPayment', type: 'stat', label: 'القسط القادم', visible: false, order: 14, size: 'medium' },
  { id: 'monthlyExpenses', type: 'widget', label: 'المصروفات الشهرية', visible: false, order: 15, size: 'medium' },
  { id: 'transfers', type: 'widget', label: 'السيارات الوارد والصادر', visible: false, order: 16, size: 'medium' },
  { id: 'quickActions', type: 'widget', label: 'الإجراءات السريعة', visible: false, order: 17, size: 'medium' },
  { id: 'reports', type: 'widget', label: 'التقارير', visible: false, order: 18, size: 'medium' },
  { id: 'recentInvoices', type: 'widget', label: 'أحدث الفواتير', visible: false, order: 19, size: 'medium' },
  { id: 'securityAlerts', type: 'widget', label: 'مراقبة الأمان', visible: false, order: 20, size: 'medium' },
];

export const CARD_COLORS = [
  { value: '', label: 'افتراضي' },
  { value: 'hsl(var(--primary) / 0.1)', label: 'أزرق' },
  { value: 'hsl(var(--success) / 0.1)', label: 'أخضر' },
  { value: 'hsl(var(--warning) / 0.1)', label: 'برتقالي' },
  { value: 'hsl(var(--destructive) / 0.1)', label: 'أحمر' },
  { value: 'hsl(262 83% 58% / 0.1)', label: 'بنفسجي' },
  { value: 'hsl(190 90% 50% / 0.1)', label: 'سماوي' },
  { value: 'hsl(330 80% 60% / 0.1)', label: 'وردي' },
  { value: 'hsl(45 90% 55% / 0.1)', label: 'ذهبي' },
];

export const TEXT_COLORS = [
  { value: '', label: 'افتراضي (أبيض)' },
  { value: '#ffffff', label: 'أبيض' },
  { value: '#000000', label: 'أسود' },
  { value: '#1e293b', label: 'رمادي داكن' },
  { value: '#f1f5f9', label: 'رمادي فاتح' },
  { value: '#fbbf24', label: 'ذهبي' },
  { value: '#34d399', label: 'أخضر' },
  { value: '#60a5fa', label: 'أزرق' },
];

export const TREND_COLORS = [
  { value: '', label: 'افتراضي (أخضر/أحمر)' },
  { value: '#ffffff', label: 'أبيض' },
  { value: '#fbbf24', label: 'ذهبي' },
  { value: '#60a5fa', label: 'أزرق' },
  { value: '#34d399', label: 'أخضر' },
  { value: '#f472b6', label: 'وردي' },
  { value: '#a78bfa', label: 'بنفسجي' },
  { value: '#22d3ee', label: 'سماوي' },
  { value: '#000000', label: 'أسود' },
];

export const GRADIENT_PRESETS = [
  { from: '', to: '', label: 'بدون تدرج' },
  { from: 'hsl(220 90% 55%)', to: 'hsl(260 80% 60%)', label: 'أزرق بنفسجي' },
  { from: 'hsl(200 95% 50%)', to: 'hsl(180 90% 45%)', label: 'سماوي فيروزي' },
  { from: 'hsl(190 100% 40%)', to: 'hsl(210 95% 55%)', label: 'سماوي عميق' },
  { from: 'hsl(185 85% 50%)', to: 'hsl(165 80% 45%)', label: 'تركواز' },
  { from: 'hsl(195 90% 55%)', to: 'hsl(230 85% 60%)', label: 'سماوي نيلي' },
  { from: 'hsl(180 70% 45%)', to: 'hsl(220 80% 55%)', label: 'سماوي أزرق' },
  { from: 'hsl(200 85% 45%)', to: 'hsl(160 80% 50%)', label: 'أزرق أخضر' },
  { from: 'hsl(210 100% 50%)', to: 'hsl(190 100% 45%)', label: 'أزرق سماوي ساطع' },
  { from: 'hsl(160 80% 45%)', to: 'hsl(200 85% 50%)', label: 'أخضر سماوي' },
  { from: 'hsl(140 75% 40%)', to: 'hsl(170 80% 45%)', label: 'أخضر زمردي' },
  { from: 'hsl(120 60% 45%)', to: 'hsl(80 70% 50%)', label: 'أخضر ليموني' },
  { from: 'hsl(340 80% 55%)', to: 'hsl(20 90% 55%)', label: 'وردي برتقالي' },
  { from: 'hsl(270 80% 55%)', to: 'hsl(320 80% 55%)', label: 'بنفسجي وردي' },
  { from: 'hsl(280 90% 60%)', to: 'hsl(200 90% 55%)', label: 'بنفسجي سماوي' },
  { from: 'hsl(330 85% 55%)', to: 'hsl(290 80% 55%)', label: 'فوشيا بنفسجي' },
  { from: 'hsl(30 90% 55%)', to: 'hsl(50 95% 55%)', label: 'برتقالي ذهبي' },
  { from: 'hsl(0 80% 55%)', to: 'hsl(30 90% 55%)', label: 'أحمر برتقالي' },
  { from: 'hsl(45 90% 50%)', to: 'hsl(30 85% 45%)', label: 'ذهبي بني' },
  { from: 'hsl(15 95% 55%)', to: 'hsl(45 100% 55%)', label: 'غروب ذهبي' },
  { from: 'hsl(250 70% 50%)', to: 'hsl(200 80% 55%)', label: 'نيلي سماوي' },
  { from: 'hsl(240 80% 45%)', to: 'hsl(280 75% 55%)', label: 'منتصف الليل' },
  { from: 'hsl(220 70% 35%)', to: 'hsl(200 80% 50%)', label: 'بحري عميق' },
  { from: 'hsl(350 70% 65%)', to: 'hsl(10 80% 70%)', label: 'مرجاني ناعم' },
  { from: 'hsl(260 60% 65%)', to: 'hsl(300 55% 70%)', label: 'لافندر' },
  { from: 'hsl(170 60% 55%)', to: 'hsl(190 65% 60%)', label: 'نعناعي' },
];
