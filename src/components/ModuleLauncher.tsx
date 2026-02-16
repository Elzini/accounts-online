import { 
  LucideIcon, LayoutDashboard, Users, ShoppingCart, DollarSign, BookOpen, 
  Warehouse, Users2, Wrench, Plug, Settings, FileText, Factory, 
  MapPin, Building2, RotateCcw, RotateCw, FileCheck,
  CreditCard, Star, Award, CalendarCheck, ArrowLeftRight, Package, Banknote,
  ArrowDownToLine, Truck, Coins, Wallet, Clock, Receipt, Calculator, Scale,
  ClipboardList, ClipboardCheck, Landmark, HandCoins, Target, Percent,
  PieChart, FileSpreadsheet, Boxes, BarChart3, Activity, TrendingUp,
  ArrowUpFromLine, FolderTree, Ruler, Smartphone, Play, Home, Globe,
  BookMarked, RefreshCw, Link2, LayoutGrid, Code, Puzzle, Workflow,
  GitBranch, GitFork, Palette, Settings2, ShieldCheck, Database, FileUp,
  TestTube, QrCode, CalendarDays, FileSignature, Calendar, UserCog, ListTodo
} from 'lucide-react';
import { ActivePage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlugins } from '@/hooks/usePlugins';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import defaultLogo from '@/assets/logo.png';

interface ModuleLauncherProps {
  setActivePage: (page: ActivePage) => void;
  onModuleSelect: (moduleId: string) => void;
}

interface AppItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users' | 'employees' | 'payroll' | 'warehouses' | 'financial_accounting';
}

export function ModuleLauncher({ setActivePage, onModuleSelect }: ModuleLauncherProps) {
  const { permissions } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { language } = useLanguage();
  const { activePlugins } = usePlugins();

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;

  const allApps: AppItem[] = [
    // Main
    { id: 'dashboard', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard, color: 'bg-emerald-500' },

    // Sales
    { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, color: 'bg-blue-500', permission: 'sales' },
    { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', icon: RotateCcw, color: 'bg-blue-400', permission: 'sales' },
    { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', icon: FileCheck, color: 'bg-blue-600', permission: 'sales' },
    { id: 'installments', label: 'الأقساط', labelEn: 'Installments', icon: CreditCard, color: 'bg-blue-300', permission: 'sales' },
    { id: 'customers', label: 'العملاء', labelEn: 'Customers', icon: Users, color: 'bg-cyan-500', permission: 'sales' },
    { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', icon: Users, color: 'bg-cyan-600', permission: 'sales' },
    ...(companyType === 'car_dealership' ? [
      { id: 'partner-dealerships' as ActivePage, label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', icon: Building2, color: 'bg-blue-700', permission: 'sales' as const },
      { id: 'car-transfers' as ActivePage, label: 'تحويلات السيارات', labelEn: 'Car Transfers', icon: ArrowLeftRight, color: 'bg-blue-800', permission: 'sales' as const },
    ] : []),
    { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', icon: Star, color: 'bg-yellow-500', permission: 'sales' },
    { id: 'sales-targets', label: 'المستهدفة', labelEn: 'Sales Targets', icon: Award, color: 'bg-amber-500', permission: 'sales' },
    { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', icon: CalendarCheck, color: 'bg-teal-500', permission: 'sales' },
    { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', icon: DollarSign, color: 'bg-blue-500', permission: 'reports' },
    { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', icon: Users, color: 'bg-cyan-500', permission: 'reports' },
    { id: 'commissions-report', label: 'تقرير العمولات', labelEn: 'Commissions Report', icon: DollarSign, color: 'bg-indigo-400', permission: 'reports' },
    ...(companyType === 'car_dealership' ? [
      { id: 'transfers-report' as ActivePage, label: 'تقرير التحويلات', labelEn: 'Transfers Report', icon: ArrowLeftRight, color: 'bg-indigo-500', permission: 'reports' as const },
      { id: 'partner-report' as ActivePage, label: 'تقرير المعرض الشريك', labelEn: 'Partner Report', icon: Building2, color: 'bg-indigo-600', permission: 'reports' as const },
    ] : []),

    // Purchases
    { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, color: 'bg-orange-500', permission: 'purchases' },
    { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', icon: RotateCw, color: 'bg-orange-400', permission: 'purchases' },
    { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', icon: Package, color: 'bg-orange-600', permission: 'purchases' },
    { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', icon: ShoppingCart, color: 'bg-orange-700', permission: 'purchases' },
    { id: 'contractor-payment', label: 'سند صرف مقاول', labelEn: 'Contractor Payment', icon: Banknote, color: 'bg-orange-300', permission: 'purchases' },
    { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', icon: ArrowDownToLine, color: 'bg-amber-600', permission: 'purchases' },
    { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', icon: Truck, color: 'bg-orange-500', permission: 'purchases' },
    { id: 'currencies', label: 'العملات', labelEn: 'Currencies', icon: Coins, color: 'bg-yellow-600', permission: 'purchases' },
    { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', icon: Wallet, color: 'bg-red-400', permission: 'purchases' },
    { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', icon: Clock, color: 'bg-red-300', permission: 'purchases' },
    { id: 'purchases-report', label: 'تقارير المشتريات', labelEn: 'Purchases Report', icon: FileText, color: 'bg-orange-500', permission: 'reports' },
    { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', icon: Truck, color: 'bg-orange-600', permission: 'reports' },

    // Accounting
    { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', icon: Receipt, color: 'bg-indigo-600' },
    { id: 'journal-entries', label: 'دفتر اليومية', labelEn: 'Journal Entries', icon: Calculator, color: 'bg-indigo-500' },
    { id: 'general-ledger', label: 'دفتر الأستاذ', labelEn: 'General Ledger', icon: FileText, color: 'bg-indigo-700' },
    { id: 'account-statement', label: 'كشف حساب مفصل', labelEn: 'Account Statement', icon: ClipboardList, color: 'bg-indigo-400' },
    { id: 'banking', label: 'إدارة البنوك', labelEn: 'Banking', icon: Scale, color: 'bg-violet-500' },
    { id: 'checks', label: 'إدارة الشيكات', labelEn: 'Checks', icon: ClipboardCheck, color: 'bg-violet-600' },
    { id: 'financing', label: 'شركات التمويل', labelEn: 'Financing', icon: Landmark, color: 'bg-violet-400' },
    { id: 'custody', label: 'إدارة العهد', labelEn: 'Custody', icon: HandCoins, color: 'bg-purple-500' },
    { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', icon: BookOpen, color: 'bg-indigo-600' },
    { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', icon: Target, color: 'bg-purple-600' },
    { id: 'tax-settings', label: 'إعدادات الضريبة', labelEn: 'Tax Settings', icon: Percent, color: 'bg-red-500' },
    { id: 'vat-return-report', label: 'إقرار ضريبة القيمة المضافة', labelEn: 'VAT Return', icon: Receipt, color: 'bg-red-600' },
    { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', icon: PieChart, color: 'bg-indigo-500' },
    { id: 'zakat-reports', label: 'القوائم الزكوية', labelEn: 'Zakat Reports', icon: Scale, color: 'bg-emerald-600' },
    { id: 'trial-balance-analysis', label: 'تحليل ميزان المراجعة', labelEn: 'Trial Balance', icon: FileSpreadsheet, color: 'bg-indigo-400' },
    { id: 'financial-statements', label: 'القوائم المالية', labelEn: 'Financial Statements', icon: FileText, color: 'bg-indigo-700' },
    { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', icon: Boxes, color: 'bg-stone-500' },
    { id: 'aging-report', label: 'تقرير أعمار الديون', labelEn: 'Aging Report', icon: Clock, color: 'bg-rose-500' },
    { id: 'budgets', label: 'الموازنات التقديرية', labelEn: 'Budgets', icon: BarChart3, color: 'bg-sky-500' },
    { id: 'financial-kpis', label: 'مؤشرات الأداء المالي', labelEn: 'Financial KPIs', icon: Activity, color: 'bg-green-500' },
    { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', icon: TrendingUp, color: 'bg-emerald-500', permission: 'reports' },
    { id: 'account-movement', label: 'حركة الحسابات', labelEn: 'Account Movement', icon: ClipboardList, color: 'bg-indigo-500', permission: 'reports' },

    // Inventory
    { id: 'items-catalog', label: 'ملف الأصناف', labelEn: 'Items Catalog', icon: Package, color: 'bg-amber-600' },
    { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', icon: ArrowUpFromLine, color: 'bg-amber-500' },
    { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse, color: 'bg-amber-700' },
    { id: 'item-categories', label: 'فئات الأصناف', labelEn: 'Categories', icon: FolderTree, color: 'bg-amber-400' },
    { id: 'units-of-measure', label: 'وحدات القياس', labelEn: 'Units', icon: Ruler, color: 'bg-lime-500' },
    { id: 'stocktaking', label: 'الجرد', labelEn: 'Stocktaking', icon: ClipboardList, color: 'bg-amber-600' },
    { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', icon: Factory, color: 'bg-stone-600' },
    { id: 'mobile-inventory', label: 'جرد بالجوال', labelEn: 'Mobile Inventory', icon: Smartphone, color: 'bg-lime-600' },
    { id: 'inventory-report', label: 'تقرير المخزون', labelEn: 'Inventory Report', icon: Package, color: 'bg-amber-500', permission: 'reports' },

    // HR
    { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users, color: 'bg-teal-500', permission: 'employees' },
    { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', icon: CreditCard, color: 'bg-teal-600', permission: 'employees' },
    { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock, color: 'bg-teal-400', permission: 'employees' },
    { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays, color: 'bg-teal-300', permission: 'employees' },
    { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Contracts', icon: FileSignature, color: 'bg-teal-700', permission: 'employees' },
    { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', icon: GitFork, color: 'bg-teal-500', permission: 'employees' },

    // Operations
    { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', icon: Wrench, color: 'bg-purple-500' },
    { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', icon: Play, color: 'bg-purple-400' },
    { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', icon: Home, color: 'bg-purple-600' },
    { id: 'trips', label: 'إدارة الرحلات', labelEn: 'Trips', icon: MapPin, color: 'bg-purple-300' },
    { id: 'advanced-projects', label: 'مشاريع متقدمة', labelEn: 'Projects', icon: LayoutGrid, color: 'bg-purple-700' },
    { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', icon: Globe, color: 'bg-sky-500' },
    { id: 'bookkeeping-service', label: 'مسك الدفاتر', labelEn: 'Bookkeeping', icon: BookMarked, color: 'bg-sky-600' },
    { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', icon: RefreshCw, color: 'bg-pink-500' },
    { id: 'payment-gateway', label: 'بوابة الدفع', labelEn: 'Payment Gateway', icon: Link2, color: 'bg-pink-600' },

    // Integrations
    { id: 'integrations', label: 'التكاملات', labelEn: 'Integrations', icon: Plug, color: 'bg-pink-500' },
    { id: 'api-management', label: 'API عام', labelEn: 'API Management', icon: Globe, color: 'bg-pink-400' },
    { id: 'developer-api', label: 'API للمطورين', labelEn: 'Developer API', icon: Code, color: 'bg-pink-600' },
    { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', icon: Puzzle, color: 'bg-pink-700' },
    ...activePlugins.map(p => ({
      id: p.pageId as ActivePage,
      label: p.menuLabel,
      labelEn: p.menuLabel_en,
      icon: Puzzle,
      color: 'bg-pink-500',
    })),

    // System
    { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'Users', icon: UserCog, color: 'bg-gray-600', permission: 'admin' as const },
    { id: 'branches', label: 'الفروع', labelEn: 'Branches', icon: GitFork, color: 'bg-gray-500', permission: 'admin' as const },
    { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', icon: Calendar, color: 'bg-gray-700', permission: 'admin' as const },
    { id: 'tasks', label: 'إدارة المهام', labelEn: 'Tasks', icon: ListTodo, color: 'bg-gray-500', permission: 'admin' as const },
    { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', icon: GitBranch, color: 'bg-gray-600', permission: 'admin' as const },
    { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', icon: Workflow, color: 'bg-gray-700', permission: 'admin' as const },
    { id: 'app-settings', label: 'إعدادات النظام', labelEn: 'Settings', icon: Settings, color: 'bg-gray-600', permission: 'admin' as const },
    { id: 'theme-settings', label: 'المظهر', labelEn: 'Theme', icon: Palette, color: 'bg-gray-500', permission: 'admin' as const },
    { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', icon: Settings2, color: 'bg-gray-700', permission: 'admin' as const },
    { id: 'audit-logs', label: 'سجل التدقيق', labelEn: 'Audit Logs', icon: ClipboardList, color: 'bg-gray-600', permission: 'admin' as const },
    { id: 'accounting-audit', label: 'تدقيق محاسبي', labelEn: 'Accounting Audit', icon: ShieldCheck, color: 'bg-gray-500', permission: 'admin' as const },
    { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', icon: Database, color: 'bg-gray-700', permission: 'admin' as const },
    { id: 'medad-import', label: 'استيراد من ميداد', labelEn: 'Medad Import', icon: FileUp, color: 'bg-gray-500', permission: 'admin' as const },
    { id: 'zatca-sandbox', label: 'بيئة محاكاة ZATCA', labelEn: 'ZATCA Sandbox', icon: TestTube, color: 'bg-gray-600', permission: 'admin' as const },
    { id: 'zatca-technical-doc', label: 'وثائق ZATCA', labelEn: 'ZATCA Docs', icon: FileText, color: 'bg-gray-700', permission: 'admin' as const },
    { id: 'mobile-invoice-reader', label: 'قراءة فاتورة بالجوال', labelEn: 'Invoice Reader', icon: QrCode, color: 'bg-gray-500', permission: 'admin' as const },
  ];

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.admin || (permissions as any)[permission];
  };

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    return 'Elzini SaaS';
  };

  const visibleApps = allApps.filter(app => hasAccess(app.permission));

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 sm:p-6 lg:p-8">
      {/* Logo & Title */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-2xl overflow-hidden bg-card shadow-lg ring-2 ring-border/50">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{getAppName()}</h1>
      </div>

      {/* Apps Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
        {visibleApps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => setActivePage(app.id)}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${app.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs text-center text-foreground/80 leading-tight line-clamp-2 font-medium">
                {language === 'ar' ? app.label : app.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 sm:mt-12 flex flex-col items-center gap-3">
        <LanguageSwitcher variant="compact" />
        <p className="text-[10px] text-muted-foreground/50">
          Elzini SaaS © 2026
        </p>
      </div>
    </div>
  );
}
