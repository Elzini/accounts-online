import { useState } from 'react';
import { 
  LucideIcon, LayoutDashboard, Users, ShoppingCart, DollarSign, BookOpen, 
  Warehouse, Users2, Wrench, Plug, Settings, Crown, FileText, Factory, 
  MapPin, UtensilsCrossed, Ship, Building2, RotateCcw, RotateCw, FileCheck,
  CreditCard, Star, Award, CalendarCheck, ArrowLeftRight, Package, Banknote,
  ArrowDownToLine, Truck, Coins, Wallet, Clock, Receipt, Calculator, Scale,
  ClipboardList, ClipboardCheck, Landmark, HandCoins, Target, Percent,
  PieChart, FileSpreadsheet, Boxes, BarChart3, Activity, TrendingUp,
  ArrowUpFromLine, FolderTree, Ruler, Smartphone, Play, Home, Globe,
  BookMarked, RefreshCw, Link2, LayoutGrid, Code, Puzzle, Workflow,
  GitBranch, GitFork, Palette, Settings2, ShieldCheck, Database, FileUp,
  TestTube, QrCode, CalendarDays, FileSignature, Calendar, UserCog, ListTodo,
  Monitor, MessageCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { ActivePage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlugins } from '@/hooks/usePlugins';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users' | 'employees' | 'payroll' | 'warehouses' | 'financial_accounting';
}

interface ModuleSection {
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ===== القائمة الرئيسية =====
  const mainSection: ModuleSection = {
    id: 'main', label: 'القائمة الرئيسية', labelEn: 'Main Menu', icon: LayoutDashboard, color: 'bg-emerald-500',
    items: [
      { id: 'dashboard', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard },
    ]
  };

  // ===== مبيعات =====
  const salesSection: ModuleSection = {
    id: 'sales', label: 'مبيعات', labelEn: 'Sales', icon: DollarSign, color: 'bg-blue-500', permission: 'sales',
    items: [
      { id: 'sales', label: 'فاتورة مبيعات', labelEn: 'Sales Invoice', icon: DollarSign, permission: 'sales' },
      { id: 'credit-debit-notes', label: 'مرتجع مبيعات / إشعار دائن', labelEn: 'Sales Returns / Credit Note', icon: RotateCcw, permission: 'sales' },
      { id: 'quotations', label: 'عروض الأسعار', labelEn: 'Quotations', icon: FileCheck, permission: 'sales' },
      { id: 'installments', label: 'الأقساط', labelEn: 'Installments', icon: CreditCard, permission: 'sales' },
      { id: 'customers', label: 'العملاء', labelEn: 'Customers', icon: Users, permission: 'sales' },
      { id: 'crm', label: 'إدارة العملاء CRM', labelEn: 'CRM', icon: Users, permission: 'sales' },
      ...(companyType === 'car_dealership' ? [
        { id: 'partner-dealerships' as ActivePage, label: 'المعارض الشريكة', labelEn: 'Partner Dealerships', icon: Building2, permission: 'sales' as const },
        { id: 'car-transfers' as ActivePage, label: 'تحويلات السيارات', labelEn: 'Car Transfers', icon: ArrowLeftRight, permission: 'sales' as const },
      ] : []),
      { id: 'loyalty', label: 'نقاط الولاء', labelEn: 'Loyalty Points', icon: Star, permission: 'sales' },
      { id: 'sales-targets', label: 'المبيعات المستهدفة', labelEn: 'Sales Targets', icon: Award, permission: 'sales' },
      { id: 'bookings', label: 'الحجوزات', labelEn: 'Bookings', icon: CalendarCheck, permission: 'sales' },
      { id: 'sales-report', label: 'تقرير المبيعات', labelEn: 'Sales Report', icon: DollarSign, permission: 'reports' },
      { id: 'customers-report', label: 'تقرير العملاء', labelEn: 'Customers Report', icon: Users, permission: 'reports' },
      { id: 'commissions-report', label: 'تقرير العمولات', labelEn: 'Commissions Report', icon: DollarSign, permission: 'reports' },
      ...(companyType === 'car_dealership' ? [
        { id: 'transfers-report' as ActivePage, label: 'تقرير التحويلات', labelEn: 'Transfers Report', icon: ArrowLeftRight, permission: 'reports' as const },
        { id: 'partner-report' as ActivePage, label: 'تقرير المعرض الشريك', labelEn: 'Partner Report', icon: Building2, permission: 'reports' as const },
      ] : []),
    ]
  };

  // ===== مشتريات =====
  const purchasesSection: ModuleSection = {
    id: 'purchases', label: 'مشتريات', labelEn: 'Purchases', icon: ShoppingCart, color: 'bg-orange-500', permission: 'purchases',
    items: [
      { id: 'purchases', label: 'فاتورة مشتريات', labelEn: 'Purchase Invoice', icon: ShoppingCart, permission: 'purchases' },
      { id: 'purchase-returns', label: 'مرتجع مشتريات / إشعار مدين', labelEn: 'Purchase Returns / Debit Note', icon: RotateCw, permission: 'purchases' },
      { id: 'materials-request', label: 'طلب مواد', labelEn: 'Materials Request', icon: Package, permission: 'purchases' },
      { id: 'purchase-orders', label: 'طلب شراء', labelEn: 'Purchase Order', icon: ShoppingCart, permission: 'purchases' },
      { id: 'contractor-payment', label: 'سند صرف مقاول', labelEn: 'Contractor Payment', icon: Banknote, permission: 'purchases' },
      { id: 'goods-receipt', label: 'سند استلام مواد', labelEn: 'Goods Receipt', icon: ArrowDownToLine, permission: 'purchases' },
      { id: 'suppliers', label: 'الموردين', labelEn: 'Suppliers', icon: Truck, permission: 'purchases' },
      { id: 'currencies', label: 'ملف العملات', labelEn: 'Currencies', icon: Coins, permission: 'purchases' },
      { id: 'expenses', label: 'المصروفات', labelEn: 'Expenses', icon: Wallet, permission: 'purchases' },
      { id: 'prepaid-expenses', label: 'المصروفات المقدمة', labelEn: 'Prepaid Expenses', icon: Clock, permission: 'purchases' },
      { id: 'purchases-report', label: 'تقارير المشتريات', labelEn: 'Purchases Report', icon: FileText, permission: 'reports' },
      { id: 'suppliers-report', label: 'تقرير الموردين', labelEn: 'Suppliers Report', icon: Truck, permission: 'reports' },
    ]
  };

  // ===== المحاسبة =====
  const accountingSection: ModuleSection = {
    id: 'accounting', label: 'المحاسبة', labelEn: 'Accounting', icon: BookOpen, color: 'bg-indigo-600', permission: 'reports',
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
      { id: 'currencies', label: 'العملات', labelEn: 'Currencies', icon: Coins },
      { id: 'vat-return-report', label: 'إقرار ضريبة القيمة المضافة', labelEn: 'VAT Return', icon: Receipt },
      { id: 'financial-reports', label: 'التقارير المالية', labelEn: 'Financial Reports', icon: PieChart },
      { id: 'zakat-reports', label: 'القوائم الزكوية', labelEn: 'Zakat Reports', icon: Scale },
      { id: 'trial-balance-analysis', label: 'تحليل ميزان المراجعة', labelEn: 'Trial Balance', icon: FileSpreadsheet },
      { id: 'financial-statements', label: 'القوائم المالية الشاملة', labelEn: 'Financial Statements', icon: FileText },
      { id: 'fixed-assets', label: 'الأصول الثابتة', labelEn: 'Fixed Assets', icon: Boxes },
      { id: 'aging-report', label: 'تقرير أعمار الديون', labelEn: 'Aging Report', icon: Clock },
      { id: 'budgets', label: 'الموازنات التقديرية', labelEn: 'Budgets', icon: BarChart3 },
      { id: 'financial-kpis', label: 'مؤشرات الأداء المالي', labelEn: 'Financial KPIs', icon: Activity },
      { id: 'profit-report', label: 'تقرير الأرباح', labelEn: 'Profit Report', icon: TrendingUp, permission: 'reports' },
      { id: 'account-movement', label: 'تقرير حركة الحسابات', labelEn: 'Account Movement', icon: ClipboardList, permission: 'reports' },
    ]
  };

  // ===== مستودعات =====
  const inventorySection: ModuleSection = {
    id: 'inventory', label: 'مستودعات', labelEn: 'Warehouses', icon: Warehouse, color: 'bg-amber-600', permission: 'purchases',
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
    ]
  };

  // ===== الموارد البشرية =====
  const hrSection: ModuleSection = {
    id: 'hr', label: 'الموارد البشرية', labelEn: 'Human Resources', icon: Users2, color: 'bg-teal-500', permission: 'employees',
    items: [
      { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users },
      { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', icon: CreditCard },
      { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock },
      { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays },
      { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Contracts', icon: FileSignature },
      { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', icon: GitFork },
    ]
  };

  // ===== العمليات =====
  const operationsSection: ModuleSection = {
    id: 'operations', label: 'العمليات', labelEn: 'Operations', icon: Wrench, color: 'bg-purple-500',
    items: [
      { id: 'work-orders', label: 'أوامر العمل', labelEn: 'Work Orders', icon: Wrench },
      { id: 'time-tracking', label: 'تتبع الوقت', labelEn: 'Time Tracking', icon: Play },
      { id: 'rentals', label: 'الإيجارات', labelEn: 'Rentals', icon: Home },
      { id: 'trips', label: 'إدارة الرحلات', labelEn: 'Trips', icon: MapPin },
      { id: 'advanced-projects', label: 'إدارة مشاريع متقدمة', labelEn: 'Advanced Projects', icon: LayoutGrid },
      { id: 'customer-portal', label: 'بوابة العملاء', labelEn: 'Customer Portal', icon: Globe },
      { id: 'bookkeeping-service', label: 'مسك الدفاتر كخدمة', labelEn: 'Bookkeeping Service', icon: BookMarked },
      { id: 'subscriptions', label: 'الاشتراكات', labelEn: 'Subscriptions', icon: RefreshCw },
      { id: 'payment-gateway', label: 'بوابة الدفع', labelEn: 'Payment Gateway', icon: Link2 },
    ]
  };

  // ===== التكاملات والإضافات =====
  const pluginItems: SubItem[] = activePlugins.map(p => ({
    id: p.pageId as ActivePage,
    label: p.menuLabel,
    labelEn: p.menuLabel_en,
    icon: Puzzle,
  }));

  const integrationsSection: ModuleSection = {
    id: 'integrations', label: 'التكاملات والإضافات', labelEn: 'Integrations & Plugins', icon: Plug, color: 'bg-pink-500',
    items: [
      { id: 'integrations', label: 'التكاملات الخارجية', labelEn: 'Integrations', icon: Plug },
      { id: 'api-management', label: 'API عام', labelEn: 'API Management', icon: Globe },
      { id: 'developer-api', label: 'API للمطورين', labelEn: 'Developer API', icon: Code },
      { id: 'plugins', label: 'الإضافات', labelEn: 'Plugins', icon: Puzzle },
      ...pluginItems,
    ]
  };

  // ===== النظام =====
  const systemSection: ModuleSection = {
    id: 'system', label: 'النظام', labelEn: 'System', icon: Settings, color: 'bg-gray-600', permission: 'admin',
    items: [
      { id: 'users-management', label: 'إدارة المستخدمين', labelEn: 'Users Management', icon: UserCog },
      { id: 'branches', label: 'الفروع', labelEn: 'Branches', icon: GitFork },
      { id: 'fiscal-years', label: 'السنوات المالية', labelEn: 'Fiscal Years', icon: Calendar },
      { id: 'tasks', label: 'إدارة المهام', labelEn: 'Tasks', icon: ListTodo },
      { id: 'approvals', label: 'الموافقات', labelEn: 'Approvals', icon: GitBranch },
      { id: 'workflows', label: 'الدورات المستندية', labelEn: 'Workflows', icon: Workflow },
      { id: 'app-settings', label: 'إعدادات النظام', labelEn: 'App Settings', icon: Settings },
      { id: 'theme-settings', label: 'المظهر', labelEn: 'Theme', icon: Palette },
      { id: 'control-center', label: 'مركز التحكم', labelEn: 'Control Center', icon: Settings2 },
      { id: 'audit-logs', label: 'سجل التدقيق', labelEn: 'Audit Logs', icon: ClipboardList },
      { id: 'accounting-audit', label: 'تدقيق محاسبي', labelEn: 'Accounting Audit', icon: ShieldCheck },
      { id: 'backups', label: 'النسخ الاحتياطي', labelEn: 'Backups', icon: Database },
      { id: 'medad-import', label: 'استيراد من ميداد', labelEn: 'Medad Import', icon: FileUp },
      { id: 'zatca-sandbox', label: 'بيئة محاكاة ZATCA', labelEn: 'ZATCA Sandbox', icon: TestTube },
      { id: 'zatca-technical-doc', label: 'وثائق ZATCA التقنية', labelEn: 'ZATCA Technical Docs', icon: FileText },
      { id: 'mobile-invoice-reader', label: 'قراءة فاتورة بالجوال', labelEn: 'Mobile Invoice Reader', icon: QrCode },
    ]
  };

  const allSections: ModuleSection[] = [
    mainSection,
    salesSection,
    purchasesSection,
    accountingSection,
    inventorySection,
    hrSection,
    operationsSection,
    integrationsSection,
    systemSection,
  ];

  const hasAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.admin || (permissions as any)[permission];
  };

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    return 'Elzini SaaS';
  };

  const handleItemClick = (page: ActivePage) => {
    setActivePage(page);
  };

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

      {/* Sections Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {allSections.filter(s => hasAccess(s.permission)).map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections[section.id] !== false; // default open
          const visibleItems = section.items.filter(item => hasAccess(item.permission));
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              {/* Section Header */}
              <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <button className={`w-full flex items-center gap-3 p-3 sm:p-4 ${section.color} text-white hover:opacity-90 transition-opacity`}>
                    <SectionIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                    <span className="font-bold text-sm sm:text-base flex-1 text-start">
                      {language === 'ar' ? section.label : section.labelEn}
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-1.5 sm:p-2">
                    {visibleItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground/80 hover:bg-accent hover:text-foreground transition-colors text-start"
                        >
                          <ItemIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">
                            {language === 'ar' ? item.label : item.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
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
