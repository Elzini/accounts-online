import { useState, useRef, useEffect, useMemo } from 'react';
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
  ArrowRight, ArrowLeft, Search, Bell, Users2 as UsersIcon, Fingerprint, Shield,
  Edit3, Sparkles, LayoutGrid as LayoutGridIcon
} from 'lucide-react';
import { ActivePage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlugins } from '@/hooks/usePlugins';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LauncherEditToolbar, EditableModuleCard, useLauncherDragDrop, LauncherModuleConfig } from '@/components/launcher/LauncherEditMode';
import { LauncherCustomizer } from '@/components/launcher/LauncherCustomizer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
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
  gradient: string;
  permission?: string;
  items: SubItem[];
}

const LAUNCHER_CONFIG_KEY = 'launcher_module_config';

export function ModuleLauncher({ setActivePage, onModuleSelect }: ModuleLauncherProps) {
  const { permissions, user } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { language } = useLanguage();
  const { activePlugins } = usePlugins();
  const [selectedModule, setSelectedModule] = useState<MainModule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const usersRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (usersRef.current && !usersRef.current.contains(e.target as Node)) setShowUsers(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const logoUrl = settings?.company_logo_url || defaultLogo;
  const isRtl = language === 'ar';

  const modules: MainModule[] = [
    {
      id: 'dashboard-mod', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard,
      color: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600',
      items: [{ id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      id: 'sales-mod', label: 'المبيعات', labelEn: 'Sales', icon: DollarSign,
      color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', permission: 'sales',
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
      id: 'purchases-mod', label: 'المشتريات', labelEn: 'Purchases', icon: ShoppingCart,
      color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600', permission: 'purchases',
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
      id: 'accounting-mod', label: 'المحاسبة', labelEn: 'Accounting', icon: BookOpen,
      color: 'bg-indigo-600', gradient: 'from-indigo-500 to-indigo-700', permission: 'reports',
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
      id: 'inventory-mod', label: 'المستودعات', labelEn: 'Warehouses', icon: Warehouse,
      color: 'bg-amber-600', gradient: 'from-amber-500 to-amber-700', permission: 'purchases',
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
      id: 'hr-mod', label: 'الموارد البشرية', labelEn: 'Human Resources', icon: Users2,
      color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600', permission: 'employees',
      items: [
        { id: 'employees', label: 'الموظفين', labelEn: 'Employees', icon: Users, permission: 'employees' },
        { id: 'payroll', label: 'مسير الرواتب', labelEn: 'Payroll', icon: CreditCard, permission: 'employees' },
        { id: 'attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: Clock, permission: 'employees' },
        { id: 'leaves', label: 'الإجازات', labelEn: 'Leaves', icon: CalendarDays, permission: 'employees' },
        { id: 'insurance', label: 'التأمينات', labelEn: 'Insurance', icon: Shield, permission: 'employees' },
        { id: 'fingerprint-devices', label: 'أجهزة البصمة', labelEn: 'Fingerprint Devices', icon: Fingerprint, permission: 'employees' },
        { id: 'employee-contracts', label: 'عقود الموظفين', labelEn: 'Contracts', icon: FileSignature, permission: 'employees' },
        { id: 'org-structure', label: 'الهيكل التنظيمي', labelEn: 'Org Structure', icon: GitFork, permission: 'employees' },
      ],
    },
    {
      id: 'operations-mod', label: 'العمليات', labelEn: 'Operations', icon: Wrench,
      color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600',
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
      id: 'integrations-mod', label: 'التكاملات', labelEn: 'Integrations', icon: Plug,
      color: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600',
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
      id: 'system-mod', label: 'النظام', labelEn: 'System', icon: Settings,
      color: 'bg-slate-600', gradient: 'from-slate-500 to-slate-700', permission: 'admin',
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

  // === Launcher customization config ===
  const defaultModuleConfigs: LauncherModuleConfig[] = useMemo(() =>
    visibleModules.map((m, i) => ({
      id: m.id,
      label: isRtl ? m.label : m.labelEn,
      visible: true,
      order: i,
      size: 'normal' as const,
    })),
    [visibleModules.length, isRtl]
  );

  const [moduleConfigs, setModuleConfigs] = useState<LauncherModuleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LAUNCHER_CONFIG_KEY);
      if (saved) {
        const parsed: LauncherModuleConfig[] = JSON.parse(saved);
        const merged = visibleModules.map((m, i) => {
          const existing = parsed.find(p => p.id === m.id);
          return existing || {
            id: m.id,
            label: isRtl ? m.label : m.labelEn,
            visible: true,
            order: existing?.order ?? i,
            size: 'normal' as const,
          };
        });
        return merged.sort((a, b) => a.order - b.order).map((m, i) => ({ ...m, order: i }));
      }
    } catch {}
    return defaultModuleConfigs;
  });

  const [editConfigs, setEditConfigs] = useState<LauncherModuleConfig[]>(moduleConfigs);

  const handleStartEdit = () => {
    setEditConfigs([...moduleConfigs]);
    setIsEditMode(true);
  };

  const handleSave = (configs: LauncherModuleConfig[]) => {
    setModuleConfigs(configs);
    localStorage.setItem(LAUNCHER_CONFIG_KEY, JSON.stringify(configs));
    setIsEditMode(false);
    toast.success(isRtl ? 'تم حفظ تخصيص الواجهة' : 'Layout saved');
  };

  const handleCancel = () => {
    setEditConfigs([...moduleConfigs]);
    setIsEditMode(false);
  };

  const dragDrop = useLauncherDragDrop(editConfigs, setEditConfigs);

  const currentConfigs = isEditMode ? editConfigs : moduleConfigs;
  const sortedConfigs = [...currentConfigs].sort((a, b) => a.order - b.order);

  const filterBySearch = (items: SubItem[]) => {
    if (!searchQuery.trim()) return items.filter(i => hasAccess(i.permission));
    const q = searchQuery.toLowerCase();
    return items.filter(i => 
      hasAccess(i.permission) && 
      (i.label.includes(q) || i.labelEn.toLowerCase().includes(q))
    );
  };

  // === Sub-items view ===
  if (selectedModule) {
    const visibleItems = filterBySearch(selectedModule.items);
    const ModIcon = selectedModule.icon;
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background">
        <div className={`bg-gradient-to-r ${selectedModule.gradient} px-4 sm:px-8 py-6`}>
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => { setSelectedModule(null); setSearchQuery(''); }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
            >
              <BackIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{isRtl ? 'رجوع للقائمة' : 'Back to menu'}</span>
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ModIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isRtl ? selectedModule.label : selectedModule.labelEn}
                  </h2>
                  <p className="text-white/70 text-sm mt-0.5">
                    {visibleItems.length} {isRtl ? 'عنصر' : 'items'}
                  </p>
                </div>
              </div>
              <div className="relative hidden sm:block">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'بحث...' : 'Search...'}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-full py-2 ps-10 pe-4 text-sm text-white placeholder:text-white/40 w-56 focus:outline-none focus:bg-white/25 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 sm:p-8">
          {visibleItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {isRtl ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {visibleItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/40 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedModule.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <ItemIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-center text-foreground/80 group-hover:text-foreground leading-tight line-clamp-2 font-medium transition-colors">
                      {isRtl ? item.label : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const onlineUsersCount = 1;

  // === Main modules view ===
  return (
    <div className="min-h-[calc(100vh-60px)] bg-muted/40 flex flex-col items-center p-4 sm:p-8">
      {/* Edit Mode Toolbar */}
      <LauncherEditToolbar
        isEditMode={isEditMode}
        onSave={handleSave}
        onCancel={handleCancel}
        modules={editConfigs}
        onModulesChange={setEditConfigs}
        defaultModules={defaultModuleConfigs}
      />

      {/* Top Bar: Customize dropdown + Search */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        {!isEditMode ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Settings className="w-4 h-4" />
                {isRtl ? 'تخصيص الواجهة' : 'Customize'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{isRtl ? 'خيارات التخصيص' : 'Customization Options'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleStartEdit} className="gap-2 cursor-pointer">
                <Edit3 className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">{isRtl ? 'تعديل الواجهة' : 'Edit Layout'}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? 'سحب وإفلات الأقسام' : 'Drag & drop sections'}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCustomizerOpen(true)} className="gap-2 cursor-pointer">
                <LayoutGridIcon className="w-4 h-4 text-success" />
                <div>
                  <p className="font-medium">{isRtl ? 'ترتيب الوحدات' : 'Arrange Modules'}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? 'نقل وتغيير حجم الوحدات' : 'Move & resize modules'}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePage('theme-settings')} className="gap-2 cursor-pointer">
                <Palette className="w-4 h-4 text-warning" />
                <div>
                  <p className="font-medium">{isRtl ? 'الألوان والسمات' : 'Colors & Themes'}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? 'تغيير ألوان الواجهة' : 'Change interface colors'}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePage('theme-settings')} className="gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium">{isRtl ? 'تأثيرات متقدمة' : 'Advanced Effects'}</p>
                  <p className="text-xs text-muted-foreground">{isRtl ? 'حركات وتأثيرات بصرية' : 'Animations & effects'}</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : <div />}
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث في النظام...' : 'Search...'}
            className="bg-card border border-border/50 rounded-full py-2 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:shadow-md transition-shadow w-52 sm:w-64"
          />
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="w-full max-w-4xl mb-6 rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-3xl sm:text-4xl">👋</span>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isRtl ? `أهلاً, ${userName}` : `Hello, ${userName}`} ☕
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mt-0.5">
              {isRtl ? `مرحباً بك في ${getAppName()}` : `Welcome to ${getAppName()}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={usersRef}>
            <button onClick={() => { setShowUsers(!showUsers); setShowNotifications(false); }} className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors">
              <Users2 className="w-4 h-4 text-white/70" />
            </button>
            <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
              {onlineUsersCount}
            </span>
            {showUsers && (
              <div className="absolute top-full mt-2 end-0 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">{isRtl ? 'المتصلون الآن' : 'Online Users'}</h4>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                    <p className="text-[10px] text-muted-foreground">{isRtl ? 'أنت' : 'You'}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setShowNotifications(!showNotifications); setShowUsers(false); }} className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors">
              <Bell className="w-4 h-4 text-white/70" />
            </button>
            {showNotifications && (
              <div className="absolute top-full mt-2 end-0 w-72 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">{isRtl ? 'الإشعارات' : 'Notifications'}</h4>
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">{isRtl ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>




      {/* Search Results */}
      {searchQuery.trim() ? (
        <div className="max-w-5xl w-full mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {visibleModules.flatMap(mod => 
              mod.items.filter(i => hasAccess(i.permission)).filter(i => {
                const q = searchQuery.toLowerCase();
                return i.label.includes(q) || i.labelEn.toLowerCase().includes(q);
              }).map(item => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <ItemIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-center text-foreground/80 group-hover:text-foreground leading-tight line-clamp-2 font-medium">
                      {isRtl ? item.label : item.labelEn}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {visibleModules.flatMap(mod => mod.items.filter(i => hasAccess(i.permission)).filter(i => {
            const q = searchQuery.toLowerCase();
            return i.label.includes(q) || i.labelEn.toLowerCase().includes(q);
          })).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {isRtl ? 'لا توجد نتائج' : 'No results found'}
            </div>
          )}
        </div>
      ) : null}

      {/* Main Modules Grid */}
      {!searchQuery.trim() && (
      <div className="max-w-4xl w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {sortedConfigs.map((config) => {
          const mod = visibleModules.find(m => m.id === config.id);
          if (!mod) return null;
          if (!config.visible && !isEditMode) return null;
          
          const Icon = mod.icon;
          const handleClick = () => {
            if (isEditMode) return;
            if (mod.items.length === 1) {
              setActivePage(mod.items[0].id);
            } else {
              setSelectedModule(mod);
            }
          };

          const iconSize = config.iconSize || (config.size === 'large' ? 72 : config.size === 'small' ? 48 : 64);
          const gradientClass = config.gradient || mod.gradient;

          const handleWheel = (e: React.WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            const current = config.iconSize || iconSize;
            const newSize = Math.max(32, Math.min(120, current + (e.deltaY > 0 ? -4 : 4)));
            const updated = currentConfigs.map(c => c.id === config.id ? { ...c, iconSize: newSize } : c);
            if (isEditMode) {
              setEditConfigs(updated);
            } else {
              setModuleConfigs(updated);
              localStorage.setItem(LAUNCHER_CONFIG_KEY, JSON.stringify(updated));
            }
          };

          const cardContent = (
            <button
              key={mod.id}
              onClick={handleClick}
              onWheel={handleWheel}
              className={`group flex flex-col items-center gap-3 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 w-full ${
                config.size === 'large' ? 'col-span-2' : ''
              } ${!config.visible ? 'opacity-40' : ''}`}
              style={{ background: config.bgColor || undefined }}
            >
              <div
                className={`rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                style={{ width: iconSize, height: iconSize }}
              >
                <Icon className="text-white" style={{ width: iconSize * 0.45, height: iconSize * 0.45 }} />
              </div>
              <span className="text-sm sm:text-base font-semibold leading-tight text-center group-hover:text-foreground transition-colors"
                style={{ color: config.textColor || undefined }}>
                {config.label || (isRtl ? mod.label : mod.labelEn)}
              </span>
            </button>
          );

          if (isEditMode) {
            return (
              <EditableModuleCard
                key={config.id}
                id={config.id}
                isEditMode={true}
                visible={true}
                size={config.size}
                onRemove={dragDrop.removeModule}
                onResize={dragDrop.resizeModule}
                onMoveUp={dragDrop.moveUp}
                onMoveDown={dragDrop.moveDown}
                onDragStart={dragDrop.handleDragStart}
                onDragEnd={dragDrop.handleDragEnd}
                onDragOver={dragDrop.handleDragOver}
                onDrop={dragDrop.handleDrop}
                isDragging={dragDrop.draggedId === config.id}
                isDragOver={dragDrop.dragOverId === config.id}
              >
                {cardContent}
              </EditableModuleCard>
            );
          }

          return cardContent;
        })}
      </div>
      )}

      {/* Footer */}
      <div className="mt-10 sm:mt-14 flex flex-col items-center gap-3">
        <LanguageSwitcher variant="compact" />
        <p className="text-[10px] text-muted-foreground/50">Elzini SaaS © 2026</p>
      </div>

      {/* Launcher Customizer Dialog */}
      <LauncherCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        modules={moduleConfigs}
        onModulesChange={(configs) => {
          setModuleConfigs(configs);
          localStorage.setItem(LAUNCHER_CONFIG_KEY, JSON.stringify(configs));
        }}
        visibleModules={visibleModules}
      />
    </div>
  );
}
