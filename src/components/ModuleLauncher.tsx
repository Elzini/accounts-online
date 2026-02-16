import { useState } from 'react';
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
  TestTube, QrCode, CalendarDays, FileSignature, Calendar, UserCog, ListTodo,
  ArrowRight, ArrowLeft
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

interface SubItem {
  id: ActivePage;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  permission?: string;
}

interface MainModule {
  id: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  color: string;
  permission?: string;
  items: SubItem[];
}

export function ModuleLauncher({ setActivePage, onModuleSelect }: ModuleLauncherProps) {
  const { permissions } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { language } = useLanguage();
  const { activePlugins } = usePlugins();
  const [selectedModule, setSelectedModule] = useState<MainModule | null>(null);

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;
  const isRtl = language === 'ar';

  const modules: MainModule[] = [
    {
      id: 'dashboard-mod', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard, color: 'bg-emerald-500',
      items: [{ id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      id: 'sales-mod', label: 'المبيعات', labelEn: 'Sales', icon: DollarSign, color: 'bg-blue-500', permission: 'sales',
      items: [
        { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, permission: 'sales' },
        { id: 'credit-debit-notes', label: 'مرتجع مبيعات', labelEn: 'Sales Returns', icon: RotateCcw, permission: 'sales' },
        { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', icon: FileCheck, permission: 'sales' },
        { id: 'installments', label: 'الأقساط', labelEn: 'Installments', icon: CreditCard, permission: 'sales' },
        { id: 'customers', label: 'العملاء', labelEn: 'Customers', icon: Users, permission: 'sales' },
        { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', icon: Users, permission: 'sales' },
        ...(companyType === 'car_dealership' ? [
          { id: 'partner-dealerships' as ActivePage, label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', icon: Building2, permission: 'sales' },
          { id: 'car-transfers' as ActivePage, label: 'تحويلات السيارات', labelEn: 'Car Transfers', icon: ArrowLeftRight, permission: 'sales' },
        ] : []),
        { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', icon: Star, permission: 'sales' },
        { id: 'sales-targets', label: 'المستهدفة', labelEn: 'Sales Targets', icon: Award, permission: 'sales' },
        { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', icon: CalendarCheck, permission: 'sales' },
        { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', icon: DollarSign, permission: 'reports' },
        { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', icon: Users, permission: 'reports' },
        { id: 'commissions-report', label: 'تقرير العمولات', labelEn: 'Commissions', icon: DollarSign, permission: 'reports' },
        ...(companyType === 'car_dealership' ? [
          { id: 'transfers-report' as ActivePage, label: 'تقرير التحويلات', labelEn: 'Transfers Report', icon: ArrowLeftRight, permission: 'reports' },
          { id: 'partner-report' as ActivePage, label: 'تقرير المعرض الشريك', labelEn: 'Partner Report', icon: Building2, permission: 'reports' },
        ] : []),
      ],
    },
    {
      id: 'purchases-mod', label: 'المشتريات', labelEn: 'Purchases', icon: ShoppingCart, color: 'bg-orange-500', permission: 'purchases',
      items: [
        { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, permission: 'purchases' },
        { id: 'purchase-returns', label: 'مرتجع مشتريات', labelEn: 'Purchase Returns', icon: RotateCw, permission: 'purchases' },
        { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', icon: Package, permission: 'purchases' },
        { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', icon: ShoppingCart, permission: 'purchases' },
        { id: 'contractor-payment', label: 'سند صرف مقاول', labelEn: 'Contractor Payment', icon: Banknote, permission: 'purchases' },
        { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', icon: ArrowDownToLine, permission: 'purchases' },
        { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', icon: Truck, permission: 'purchases' },
        { id: 'currencies', label: 'العملات', labelEn: 'Currencies', icon: Coins, permission: 'purchases' },
        { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', icon: Wallet, permission: 'purchases' },
        { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', icon: Clock, permission: 'purchases' },
        { id: 'purchases-report', label: 'تقارير المشتريات', labelEn: 'Purchases Report', icon: FileText, permission: 'reports' },
        { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', icon: Truck, permission: 'reports' },
      ],
    },
    {
      id: 'accounting-mod', label: 'المحاسبة', labelEn: 'Accounting', icon: BookOpen, color: 'bg-indigo-600', permission: 'reports',
      items: [
        { id: 'vouchers', label: 'سندات القبض والصرف', labelEn: 'Vouchers', icon: Receipt },
        { id: 'journal-entries', label: 'دفتر اليومية', labelEn: 'Journal Entries', icon: Calculator },
        { id: 'general-ledger', label: 'دفتر الأستاذ', labelEn: 'General Ledger', icon: FileText },
        { id: 'account-statement', label: 'كشف حساب مفصل', labelEn: 'Account Statement', icon: ClipboardList },
        { id: 'banking', label: 'إدارة البنوك', labelEn: 'Banking', icon: Scale },
        { id: 'checks', label: 'إدارة الشيكات', labelEn: 'Checks', icon: ClipboardCheck },
        { id: 'financing', label: 'شركات التمويل', labelEn: 'Financing', icon: Landmark },
        { id: 'custody', label: 'إدارة العهد', labelEn: 'Custody', icon: HandCoins },
        { id: 'chart-of-accounts', label: 'شجرة الحسابات', labelEn: 'Chart of Accounts', icon: BookOpen },
        { id: 'cost-centers', label: 'مراكز التكلفة', labelEn: 'Cost Centers', icon: Target },
        { id: 'tax-settings', label: 'إعدادات الضريبة', labelEn: 'Tax Settings', icon: Percent },
        { id: 'vat-return-report', label: 'إقرار ضريبة القيمة المضافة', labelEn: 'VAT Return', icon: Receipt },
        { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', icon: PieChart },
        { id: 'zakat-reports', label: 'القوائم الزكوية', labelEn: 'Zakat Reports', icon: Scale },
        { id: 'trial-balance-analysis', label: 'ميزان المراجعة', labelEn: 'Trial Balance', icon: FileSpreadsheet },
        { id: 'financial-statements', label: 'القوائم المالية', labelEn: 'Financial Statements', icon: FileText },
        { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', icon: Boxes },
        { id: 'aging-report', label: 'أعمار الديون', labelEn: 'Aging Report', icon: Clock },
        { id: 'budgets', label: 'الموازنات التقديرية', labelEn: 'Budgets', icon: BarChart3 },
        { id: 'financial-kpis', label: 'مؤشرات الأداء', labelEn: 'Financial KPIs', icon: Activity },
        { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', icon: TrendingUp, permission: 'reports' },
        { id: 'account-movement', label: 'حركة الحسابات', labelEn: 'Account Movement', icon: ClipboardList, permission: 'reports' },
      ],
    },
    {
      id: 'inventory-mod', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse, color: 'bg-amber-600', permission: 'purchases',
      items: [
        { id: 'items-catalog', label: 'ملف الأصناف', labelEn: 'Items Catalog', icon: Package },
        { id: 'stock-vouchers', label: 'الأذون المخزنية', labelEn: 'Stock Vouchers', icon: ArrowUpFromLine },
        { id: 'warehouses', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse },
        { id: 'item-categories', label: 'فئات الأصناف', labelEn: 'Categories', icon: FolderTree },
        { id: 'units-of-measure', label: 'وحدات القياس', labelEn: 'Units', icon: Ruler },
        { id: 'stocktaking', label: 'الجرد', labelEn: 'Stocktaking', icon: ClipboardList },
        { id: 'manufacturing', label: 'التصنيع', labelEn: 'Manufacturing', icon: Factory },
        { id: 'mobile-inventory', label: 'جرد بالجوال', labelEn: 'Mobile Inventory', icon: Smartphone },
        { id: 'inventory-report', label: 'تقرير المخزون', labelEn: 'Inventory Report', icon: Package, permission: 'reports' },
      ],
    },
    {
      id: 'hr-mod', label: 'الموارد البشرية', labelEn: 'Human Resources', icon: Users2, color: 'bg-teal-500', permission: 'employees',
      items: [
        { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users, permission: 'employees' },
        { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', icon: CreditCard, permission: 'employees' },
        { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock, permission: 'employees' },
        { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays, permission: 'employees' },
        { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Contracts', icon: FileSignature, permission: 'employees' },
        { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', icon: GitFork, permission: 'employees' },
      ],
    },
    {
      id: 'operations-mod', label: 'العمليات', labelEn: 'Operations', icon: Wrench, color: 'bg-purple-500',
      items: [
        { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', icon: Wrench },
        { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', icon: Play },
        { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', icon: Home },
        { id: 'trips', label: 'إدارة الرحلات', labelEn: 'Trips', icon: MapPin },
        { id: 'advanced-projects', label: 'مشاريع متقدمة', labelEn: 'Projects', icon: LayoutGrid },
        { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', icon: Globe },
        { id: 'bookkeeping-service', label: 'مسك الدفاتر', labelEn: 'Bookkeeping', icon: BookMarked },
        { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', icon: RefreshCw },
        { id: 'payment-gateway', label: 'بوابة الدفع', labelEn: 'Payment Gateway', icon: Link2 },
      ],
    },
    {
      id: 'integrations-mod', label: 'التكاملات', labelEn: 'Integrations', icon: Plug, color: 'bg-pink-500',
      items: [
        { id: 'integrations', label: 'التكاملات الخارجية', labelEn: 'Integrations', icon: Plug },
        { id: 'api-management', label: 'API عام', labelEn: 'API Management', icon: Globe },
        { id: 'developer-api', label: 'API للمطورين', labelEn: 'Developer API', icon: Code },
        { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', icon: Puzzle },
        ...activePlugins.map(p => ({
          id: p.pageId as ActivePage,
          label: p.menuLabel,
          labelEn: p.menuLabel_en,
          icon: Puzzle,
        })),
      ],
    },
    {
      id: 'system-mod', label: 'النظام', labelEn: 'System', icon: Settings, color: 'bg-gray-600', permission: 'admin',
      items: [
        { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'Users', icon: UserCog, permission: 'admin' },
        { id: 'branches', label: 'الفروع', labelEn: 'Branches', icon: GitFork, permission: 'admin' },
        { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', icon: Calendar, permission: 'admin' },
        { id: 'tasks', label: 'إدارة المهام', labelEn: 'Tasks', icon: ListTodo, permission: 'admin' },
        { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', icon: GitBranch, permission: 'admin' },
        { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', icon: Workflow, permission: 'admin' },
        { id: 'app-settings', label: 'إعدادات النظام', labelEn: 'Settings', icon: Settings, permission: 'admin' },
        { id: 'theme-settings', label: 'المظهر', labelEn: 'Theme', icon: Palette, permission: 'admin' },
        { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', icon: Settings2, permission: 'admin' },
        { id: 'audit-logs', label: 'سجل التدقيق', labelEn: 'Audit Logs', icon: ClipboardList, permission: 'admin' },
        { id: 'accounting-audit', label: 'تدقيق محاسبي', labelEn: 'Accounting Audit', icon: ShieldCheck, permission: 'admin' },
        { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', icon: Database, permission: 'admin' },
        { id: 'medad-import', label: 'استيراد من ميداد', labelEn: 'Medad Import', icon: FileUp, permission: 'admin' },
        { id: 'zatca-sandbox', label: 'بيئة محاكاة ZATCA', labelEn: 'ZATCA Sandbox', icon: TestTube, permission: 'admin' },
        { id: 'zatca-technical-doc', label: 'وثائق ZATCA', labelEn: 'ZATCA Docs', icon: FileText, permission: 'admin' },
        { id: 'mobile-invoice-reader', label: 'قراءة فاتورة بالجوال', labelEn: 'Invoice Reader', icon: QrCode, permission: 'admin' },
      ],
    },
  ];

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.admin || (permissions as any)[permission];
  };

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    return 'Elzini SaaS';
  };

  const visibleModules = modules.filter(m => hasAccess(m.permission));
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // === Sub-items view ===
  if (selectedModule) {
    const visibleItems = selectedModule.items.filter(i => hasAccess(i.permission));
    const ModIcon = selectedModule.icon;
    return (
      <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 sm:p-6 lg:p-8">
        {/* Back + Module Title */}
        <div className="max-w-5xl mx-auto mb-6">
          <button
            onClick={() => setSelectedModule(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <BackIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{isRtl ? 'رجوع' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${selectedModule.color} flex items-center justify-center shadow-md`}>
              <ModIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {isRtl ? selectedModule.label : selectedModule.labelEn}
            </h2>
          </div>
        </div>

        {/* Sub-items Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {visibleItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${selectedModule.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <ItemIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs text-center text-foreground/80 leading-tight line-clamp-2 font-medium">
                  {isRtl ? item.label : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === Main modules view ===
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

      {/* Main Modules Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6">
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const handleClick = () => {
            if (mod.items.length === 1) {
              setActivePage(mod.items[0].id);
            } else {
              setSelectedModule(mod);
            }
          };
          return (
            <button
              key={mod.id}
              onClick={handleClick}
              className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 group"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${mod.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <span className="text-xs sm:text-sm text-center text-foreground/90 font-semibold leading-tight">
                {isRtl ? mod.label : mod.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 sm:mt-12 flex flex-col items-center gap-3">
        <LanguageSwitcher variant="compact" />
        <p className="text-[10px] text-muted-foreground/50">Elzini SaaS © 2026</p>
      </div>
    </div>
  );
}
