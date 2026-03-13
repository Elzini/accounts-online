import { useState, useEffect, useMemo } from 'react';

import { LayoutDashboard, Users, Truck, ShoppingCart, DollarSign, FileText, TrendingUp, Package, UserCog, Settings, Building2, ArrowLeftRight, Crown, Calculator, BookOpen, Percent, PieChart, Receipt, CreditCard, FileCheck, Wallet, ClipboardList, Database, Landmark, Scale, Clock, Calendar, FileSpreadsheet, Settings2, ChevronDown, ChevronRight, LucideIcon, Boxes, FileUp, HardHat, Wrench, HandCoins, MapPin, Palette, UtensilsCrossed, ChefHat, Coffee, Ship, FileBox, Globe, ShieldCheck, ListTodo, Warehouse, Ruler, FolderTree, Target, ClipboardCheck, BadgeDollarSign, BarChart3, Activity, GitBranch, CalendarDays, Shield, Factory, Plug, Coins, GitFork, Puzzle, Monitor, MessageCircle, MessageSquare, Workflow, ArrowDownToLine, ArrowUpFromLine, RotateCcw, RotateCw, Star, RefreshCw, CalendarCheck, Play, FileSignature, Home, Award, Link2, BookMarked, TestTube, LayoutGrid, Smartphone, QrCode, Code, Banknote, Fingerprint, MoreHorizontal, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useMenuConfiguration } from '@/hooks/useSystemControl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import defaultLogo from '@/assets/logo.png';
import { usePlugins } from '@/hooks/usePlugins';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

// Icon mapping for dynamic menu
const ICON_MAP: Record<string, LucideIcon> = {
  'dashboard': LayoutDashboard,
  'customers': Users,
  'suppliers': Truck,
  'purchases': ShoppingCart,
  'sales': DollarSign,
  'partner-dealerships': Building2,
  'car-transfers': ArrowLeftRight,
  'employees': Users,
  'payroll': CreditCard,
  'expenses': Wallet,
  'prepaid-expenses': Clock,
  'quotations': FileCheck,
  'installments': CreditCard,
  'vouchers': Receipt,
  'financing': Landmark,
  'banking': Scale,
  'inventory-report': Package,
  'profit-report': TrendingUp,
  'purchases-report': FileText,
  'sales-report': DollarSign,
  'customers-report': Users,
  'suppliers-report': Truck,
  'commissions-report': DollarSign,
  'transfers-report': ArrowLeftRight,
  'partner-report': Building2,
  'fiscal-years': Calendar,
  'tax-settings': Percent,
  'chart-of-accounts': BookOpen,
  'journal-entries': Calculator,
  'general-ledger': FileText,
  'account-statement': ClipboardList,
  'vat-return-report': Receipt,
  'financial-reports': PieChart,
  'zakat-reports': Scale,
  'trial-balance-analysis': FileSpreadsheet,
  'financial-statements': FileText,
  'fixed-assets': Boxes,
  'medad-import': FileUp,
  'users-management': UserCog,
  'app-settings': Settings,
  'audit-logs': ClipboardList,
  'backups': Database,
  'control-center': Settings2,
  'projects': Building2,
  'contracts': FileText,
  'progress-billings': Receipt,
  'materials': Package,
  'subcontractors': Users,
  'equipment': Wrench,
  'custody': HandCoins,
  'trips': MapPin,
  'theme-settings': Palette,
  'menu-management': UtensilsCrossed,
  'restaurant-orders': Coffee,
  'kitchen-display': ChefHat,
  'table-management': LayoutDashboard,
  'shipments': Ship,
  'letters-of-credit': FileBox,
  'customs-clearance': Globe,
  'accounting-audit': ShieldCheck,
  'tasks': ListTodo,
  'warehouses': Warehouse,
  'items-catalog': Package,
  'item-categories': FolderTree,
  'units-of-measure': Ruler,
  'cost-centers': Target,
  'aging-report': Clock,
  'checks': ClipboardCheck,
  'budgets': BarChart3,
  'financial-kpis': Activity,
  'approvals': GitBranch,
  'attendance': Clock,
  'fingerprint-devices': Fingerprint,
  'leaves': CalendarDays,
  'insurance': Shield,
  'manufacturing': Factory,
  'integrations': Plug,
  'currencies': Coins,
  'branches': GitFork,
  'monitor': Monitor,
  'message-circle': MessageCircle,
  'clipboard-list': ClipboardList,
  'receipt': Receipt,
  'users': Users,
  'warehouse': Warehouse,
  'bar-chart-3': BarChart3,
  'globe': Globe,
  'workflows': Workflow,
  'purchase-orders': ShoppingCart,
  'goods-receipt': ArrowDownToLine,
  'stock-vouchers': ArrowUpFromLine,
  'stocktaking': ClipboardList,
  'credit-debit-notes': RotateCcw,
  'purchase-returns': RotateCw,
  'materials-request': Package,
  'contractor-payment': Banknote,
  'crm': Users,
  'loyalty': Star,
  'subscriptions': RefreshCw,
  'work-orders': Wrench,
  'bookings': CalendarCheck,
  'time-tracking': Play,
  'employee-contracts': FileSignature,
  'org-structure': GitFork,
  'rentals': Home,
  'sales-targets': Award,
  'payment-gateway': Link2,
  'bookkeeping-service': BookMarked,
  'zatca-sandbox': TestTube,
  'customer-portal': Globe,
  'advanced-projects': LayoutGrid,
  'mobile-inventory': Smartphone,
  'mobile-invoice-reader': QrCode,
  'developer-api': Code,
};

// Section icon mapping
const SECTION_ICONS: Record<string, LucideIcon> = {
  main: LayoutDashboard,
  sales: DollarSign,
  purchases: ShoppingCart,
  accounting: Calculator,
  inventory: Warehouse,
  hr: Users,
  operations: Wrench,
  integrations: Plug,
  system: Settings2,
  more: MoreHorizontal,
};

interface MenuItem {
  id: ActivePage;
  label: string;
  icon: LucideIcon;
  permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users';
}

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
  showCondition: boolean;
  isMore?: boolean;
}

/** Collapsible section component */
function SidebarSection({
  section,
  activePage,
  setActivePage,
  isOpen,
  onToggle,
  getItemLabel,
}: {
  section: Section;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  isOpen: boolean;
  onToggle: () => void;
  getItemLabel: (sectionId: string, itemId: string, defaultLabel: string) => string;
}) {
  const SectionIcon = section.icon;
  const hasActiveItem = section.items.some(item => item.id === activePage);

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200",
          hasActiveItem
            ? "text-white bg-sidebar-primary shadow-md shadow-sidebar-primary/30"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        )}
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          hasActiveItem ? "bg-white/20" : "bg-sidebar-accent/40"
        )}>
          <SectionIcon className="w-4 h-4 shrink-0" />
        </div>
        <span className="flex-1 text-start truncate">{section.label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-out",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isOpen ? "max-h-[5000px] opacity-100 mt-1" : "max-h-0 opacity-0"
      )}>
        <ul className="ms-5 border-s-2 border-sidebar-primary/20 ps-2.5 space-y-0.5 pb-1">
          {section.items.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const itemLabel = getItemLabel(section.id, item.id, item.label);
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11.5px] transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary/90 text-white font-semibold shadow-sm"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{itemLabel}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white ms-auto shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function Sidebar({
  activePage,
  setActivePage
}: SidebarProps) {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { company } = useCompany();
  const { data: settings } = useAppSettings();
  const { data: menuConfig } = useMenuConfiguration();
  const { t, language } = useLanguage();

  const s = (settingValue: string | undefined | null, translationValue: string) => {
    if (language !== 'ar') return translationValue;
    return settingValue || translationValue;
  };

  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const rawLogoUrl = settings?.company_logo_url || defaultLogo;
  const logoUrl = rawLogoUrl !== defaultLogo && !rawLogoUrl.includes('?') 
    ? `${rawLogoUrl}?v=${encodeURIComponent(rawLogoUrl.slice(-10))}` 
    : rawLogoUrl;

  const getAppName = () => {
    if (settings?.app_name && language === 'ar') return settings.app_name;
    switch (companyType) {
      case 'construction': return t.sidebar_construction_system;
      case 'general_trading': return t.sidebar_trading_system;
      case 'restaurant': return t.sidebar_restaurant_system;
      case 'export_import': return t.sidebar_export_import_system;
      default: return 'Elzini SaaS';
    }
  };

  const getAppSubtitle = () => {
    if (settings?.app_subtitle && language === 'ar') return settings.app_subtitle;
    switch (companyType) {
      case 'construction': return t.sidebar_construction_subtitle;
      case 'general_trading': return t.sidebar_trading_subtitle;
      case 'restaurant': return t.sidebar_restaurant_subtitle;
      case 'export_import': return t.sidebar_export_import_subtitle;
      default: return t.sidebar_car_subtitle;
    }
  };

  const appName = getAppName();
  const appSubtitle = getAppSubtitle();

  // ===== Core Sections =====
  const salesMenuItems: MenuItem[] = [
    { id: 'sales' as ActivePage, label: language === 'ar' ? 'فاتورة مبيعات' : 'Sales Invoice', icon: DollarSign, permission: 'sales' },
    { id: 'credit-debit-notes' as ActivePage, label: language === 'ar' ? 'مرتجع مبيعات' : 'Sales Returns', icon: RotateCcw, permission: 'sales' },
    { id: 'quotations' as ActivePage, label: s(settings?.quotations_title, t.nav_quotations), icon: FileCheck, permission: 'sales' },
    { id: 'installments' as ActivePage, label: s(settings?.installments_title, t.nav_installments), icon: CreditCard, permission: 'sales' },
    { id: 'customers' as ActivePage, label: s(settings?.customers_title, t.nav_customers), icon: Users, permission: 'sales' },
    { id: 'sales-report' as ActivePage, label: s(settings?.sales_report_title, t.nav_sales_report), icon: DollarSign, permission: 'reports' },
    { id: 'customers-report' as ActivePage, label: s(settings?.customers_report_title, t.nav_customers_report), icon: Users, permission: 'reports' },
  ];

  if (companyType === 'car_dealership') {
    salesMenuItems.splice(5, 0,
      { id: 'partner-dealerships' as ActivePage, label: s(settings?.partner_dealerships_title, t.nav_partner_dealerships), icon: Building2, permission: 'sales' },
      { id: 'car-transfers' as ActivePage, label: s(settings?.car_transfers_title, t.nav_car_transfers), icon: ArrowLeftRight, permission: 'sales' },
    );
    salesMenuItems.push(
      { id: 'commissions-report' as ActivePage, label: s(settings?.commissions_report_title, t.nav_commissions_report), icon: DollarSign, permission: 'reports' },
      { id: 'transfers-report' as ActivePage, label: s(settings?.transfers_report_title, t.nav_transfers_report), icon: ArrowLeftRight, permission: 'reports' },
      { id: 'partner-report' as ActivePage, label: s(settings?.partner_report_title, t.nav_partner_report), icon: Building2, permission: 'reports' },
    );
  }

  const purchasesMenuItems: MenuItem[] = [
    { id: 'purchases' as ActivePage, label: language === 'ar' ? 'فاتورة مشتريات' : 'Purchase Invoice', icon: ShoppingCart, permission: 'purchases' },
    { id: 'purchase-returns' as ActivePage, label: language === 'ar' ? 'مرتجع مشتريات' : 'Purchase Returns', icon: RotateCw, permission: 'purchases' },
    { id: 'purchase-orders' as ActivePage, label: language === 'ar' ? 'طلب شراء' : 'Purchase Order', icon: ShoppingCart, permission: 'purchases' },
    { id: 'materials-request' as ActivePage, label: language === 'ar' ? 'طلب مواد' : 'Materials Request', icon: Package, permission: 'purchases' },
    { id: 'goods-receipt' as ActivePage, label: language === 'ar' ? 'سند استلام' : 'Goods Receipt', icon: ArrowDownToLine, permission: 'purchases' },
    { id: 'suppliers' as ActivePage, label: s(settings?.suppliers_title || null, t.nav_suppliers), icon: Truck, permission: 'purchases' },
    { id: 'expenses' as ActivePage, label: s(settings?.expenses_title, t.nav_expenses), icon: Wallet, permission: 'purchases' },
    { id: 'purchases-report' as ActivePage, label: language === 'ar' ? 'تقارير المشتريات' : 'Purchases Reports', icon: FileText, permission: 'reports' },
    { id: 'suppliers-report' as ActivePage, label: s(settings?.suppliers_report_title, t.nav_suppliers_report), icon: Truck, permission: 'reports' },
  ];

  const accountsMenuItems: MenuItem[] = [
    { id: 'vouchers' as ActivePage, label: s(settings?.vouchers_title, t.nav_vouchers), icon: Receipt },
    { id: 'journal-entries' as ActivePage, label: s(settings?.journal_entries_title, t.nav_journal_entries), icon: Calculator },
    { id: 'general-ledger' as ActivePage, label: s(settings?.general_ledger_title, t.nav_general_ledger), icon: FileText },
    { id: 'account-statement' as ActivePage, label: t.nav_account_statement, icon: ClipboardList },
    { id: 'banking' as ActivePage, label: s(settings?.banking_title, t.nav_banking), icon: Scale },
    { id: 'checks' as ActivePage, label: t.nav_checks, icon: ClipboardCheck },
    { id: 'custody' as ActivePage, label: t.nav_custody, icon: HandCoins },
    { id: 'chart-of-accounts' as ActivePage, label: s(settings?.chart_of_accounts_title, t.nav_chart_of_accounts), icon: BookOpen },
    { id: 'trial-balance-analysis' as ActivePage, label: t.nav_trial_balance, icon: FileSpreadsheet },
    { id: 'comprehensive-trial-balance' as ActivePage, label: t.fr_comprehensive_trial, icon: Scale },
    { id: 'financial-statements' as ActivePage, label: t.nav_financial_statements, icon: FileText },
    { id: 'financial-reports' as ActivePage, label: s(settings?.financial_reports_title, t.nav_financial_reports), icon: PieChart },
    { id: 'profit-report' as ActivePage, label: s(settings?.profit_report_title, t.nav_profit_report), icon: TrendingUp, permission: 'reports' },
  ];

  const warehouseMenuItems: MenuItem[] = [
    { id: 'items-catalog' as ActivePage, label: t.nav_items, icon: Package },
    { id: 'stock-vouchers' as ActivePage, label: language === 'ar' ? 'الأذون المخزنية' : 'Stock Vouchers', icon: ArrowUpFromLine },
    { id: 'warehouses' as ActivePage, label: t.nav_warehouses, icon: Warehouse },
    { id: 'inventory-report' as ActivePage, label: s(settings?.inventory_report_title, t.nav_inventory_report), icon: Package, permission: 'reports' },
  ];

  const hrItems: MenuItem[] = [
    { id: 'employees' as ActivePage, label: t.nav_employees, icon: Users },
    { id: 'payroll' as ActivePage, label: t.nav_payroll, icon: CreditCard },
    { id: 'attendance' as ActivePage, label: t.nav_attendance, icon: Clock },
    { id: 'leaves' as ActivePage, label: t.nav_leaves, icon: CalendarDays },
    { id: 'employee-contracts' as ActivePage, label: language === 'ar' ? 'عقود الموظفين' : 'Employee Contracts', icon: FileSignature },
  ];

  const expensesItems: MenuItem[] = [
    { id: 'expenses' as ActivePage, label: language === 'ar' ? 'المصروفات' : 'Expenses', icon: Wallet, permission: 'purchases' },
    { id: 'prepaid-expenses' as ActivePage, label: s(settings?.prepaid_expenses_title, t.nav_prepaid_expenses), icon: Clock, permission: 'purchases' },
    { id: 'cost-centers' as ActivePage, label: t.nav_cost_centers, icon: Target },
  ];

  const systemMenuItems: MenuItem[] = [
    { id: 'users-management' as ActivePage, label: s(settings?.users_management_title, t.nav_users_management), icon: UserCog },
    { id: 'field-level-security' as ActivePage, label: language === 'ar' ? 'صلاحيات الحقول' : 'Field Security', icon: Shield, permission: 'admin' },
    { id: 'branches' as ActivePage, label: t.nav_branches, icon: GitFork },
    { id: 'fiscal-years' as ActivePage, label: t.nav_fiscal_years, icon: Calendar },
    { id: 'approvals' as ActivePage, label: language === 'ar' ? 'الموافقات' : 'Approvals', icon: GitBranch, permission: 'admin' },
    { id: 'invoice-approval-workflow' as ActivePage, label: language === 'ar' ? 'اعتماد الفواتير' : 'Invoice Approvals', icon: Workflow, permission: 'admin' },
    { id: 'app-settings' as ActivePage, label: s(settings?.app_settings_title, t.nav_app_settings), icon: Settings },
    { id: 'control-center' as ActivePage, label: t.nav_control_center, icon: Settings2 },
    { id: 'backups' as ActivePage, label: s(settings?.backups_title, t.nav_backups), icon: Database },
    { id: 'audit-logs' as ActivePage, label: s(settings?.audit_logs_title, t.nav_audit_logs), icon: ClipboardList },
  ];

  const toolsMenuItems: MenuItem[] = [
    { id: 'zatca-sandbox' as ActivePage, label: language === 'ar' ? 'محاكاة ZATCA' : 'ZATCA Sandbox', icon: TestTube, permission: 'admin' },
    { id: 'zatca-technical-doc' as ActivePage, label: language === 'ar' ? 'وثائق ZATCA' : 'ZATCA Docs', icon: FileText, permission: 'admin' },
    { id: 'plugins' as ActivePage, label: language === 'ar' ? 'الإضافات' : 'Plugins', icon: Plug },
    { id: 'integrations' as ActivePage, label: t.nav_integrations, icon: Link2 },
    { id: 'ecommerce-integration' as ActivePage, label: language === 'ar' ? 'ربط سلة/زد' : 'Salla/Zid', icon: Globe, permission: 'admin' },
    { id: 'developer-api' as ActivePage, label: language === 'ar' ? 'API للمطورين' : 'Developer API', icon: Code, permission: 'admin' },
    { id: 'public-api-docs' as ActivePage, label: language === 'ar' ? 'توثيق API' : 'API Docs', icon: FileText, permission: 'admin' },
    { id: 'medad-import' as ActivePage, label: t.nav_medad_import, icon: FileUp, permission: 'admin' },
    { id: 'data-import' as ActivePage, label: language === 'ar' ? 'استيراد Excel' : 'Excel Import', icon: FileUp, permission: 'admin' },
    { id: 'expense-ocr' as ActivePage, label: language === 'ar' ? 'مسح المصروفات' : 'Expense OCR', icon: Receipt, permission: 'admin' },
    { id: 'overdue-invoices' as ActivePage, label: language === 'ar' ? 'الفواتير المتأخرة' : 'Overdue Invoices', icon: AlertCircle },
    { id: 'mobile-invoice-reader' as ActivePage, label: language === 'ar' ? 'قراءة فاتورة' : 'Invoice Reader', icon: QrCode },
    { id: 'automation' as ActivePage, label: language === 'ar' ? '⚡ أتمتة العمليات' : '⚡ Automation', icon: Zap },
  ];

  // ===== "المزيد" - Less used modules grouped together =====
  const moreItems: MenuItem[] = [
    { id: 'crm' as ActivePage, label: language === 'ar' ? 'إدارة العملاء CRM' : 'CRM', icon: Users, permission: 'sales' },
    { id: 'loyalty' as ActivePage, label: language === 'ar' ? 'نقاط الولاء' : 'Loyalty', icon: Star, permission: 'sales' },
    { id: 'sales-targets' as ActivePage, label: language === 'ar' ? 'المبيعات المستهدفة' : 'Sales Targets', icon: Award, permission: 'sales' },
    { id: 'bookings' as ActivePage, label: language === 'ar' ? 'الحجوزات' : 'Bookings', icon: CalendarCheck, permission: 'sales' },
    { id: 'contractor-payment' as ActivePage, label: language === 'ar' ? 'سند صرف مقاول' : 'Contractor Payment', icon: Banknote, permission: 'purchases' },
    { id: 'currencies' as ActivePage, label: t.nav_currencies, icon: Coins },
    { id: 'financing' as ActivePage, label: s(settings?.financing_title, t.nav_financing), icon: Landmark },
    { id: 'tax-settings' as ActivePage, label: s(settings?.tax_settings_title, t.nav_tax_settings), icon: Percent },
    { id: 'vat-return-report' as ActivePage, label: t.nav_vat_return, icon: Receipt },
    { id: 'zakat-reports' as ActivePage, label: t.nav_zakat_reports, icon: Scale },
    { id: 'fixed-assets' as ActivePage, label: t.nav_fixed_assets, icon: Boxes },
    { id: 'aging-report' as ActivePage, label: t.nav_aging_report, icon: Clock },
    { id: 'budgets' as ActivePage, label: t.nav_budgets, icon: BarChart3 },
    { id: 'financial-kpis' as ActivePage, label: t.nav_financial_kpis, icon: Activity },
    { id: 'cashflow-forecast' as ActivePage, label: 'توقعات التدفق النقدي', icon: TrendingUp },
    { id: 'executive-kpis' as ActivePage, label: 'لوحة KPIs الإدارية', icon: Target },
    { id: 'commissions-system' as ActivePage, label: 'نظام العمولات', icon: Calculator },
    { id: 'branch-comparison' as ActivePage, label: 'مقارنة الفروع', icon: Building2 },
    { id: 'ai-sales-forecast' as ActivePage, label: 'توقعات AI للمبيعات', icon: Sparkles },
    { id: 'account-movement' as ActivePage, label: t.nav_account_movement, icon: ClipboardList, permission: 'reports' },
    { id: 'item-categories' as ActivePage, label: t.nav_categories, icon: FolderTree },
    { id: 'units-of-measure' as ActivePage, label: t.nav_units, icon: Ruler },
    { id: 'stocktaking' as ActivePage, label: language === 'ar' ? 'الجرد' : 'Stocktaking', icon: ClipboardList },
    { id: 'manufacturing' as ActivePage, label: t.nav_manufacturing, icon: Factory },
    { id: 'mobile-inventory' as ActivePage, label: language === 'ar' ? 'جرد بالجوال' : 'Mobile Inventory', icon: Smartphone },
    { id: 'fingerprint-devices' as ActivePage, label: language === 'ar' ? 'أجهزة البصمة' : 'Fingerprint Devices', icon: Fingerprint },
    { id: 'org-structure' as ActivePage, label: language === 'ar' ? 'الهيكل التنظيمي' : 'Org Structure', icon: GitFork },
    { id: 'work-orders' as ActivePage, label: language === 'ar' ? 'أوامر العمل' : 'Work Orders', icon: Wrench },
    { id: 'time-tracking' as ActivePage, label: language === 'ar' ? 'تتبع الوقت' : 'Time Tracking', icon: Play },
    { id: 'rentals' as ActivePage, label: language === 'ar' ? 'الإيجارات' : 'Rentals', icon: Home },
    { id: 'trips' as ActivePage, label: t.nav_trips, icon: MapPin },
    { id: 'advanced-projects' as ActivePage, label: language === 'ar' ? 'مشاريع متقدمة' : 'Advanced Projects', icon: LayoutGrid },
    { id: 'customer-portal' as ActivePage, label: language === 'ar' ? 'بوابة العملاء' : 'Customer Portal', icon: Globe },
    { id: 'supplier-portal' as ActivePage, label: language === 'ar' ? 'بوابة الموردين' : 'Supplier Portal', icon: Globe },
    { id: 'whatsapp-integration' as ActivePage, label: language === 'ar' ? 'واتساب' : 'WhatsApp', icon: MessageSquare },
    { id: 'advanced-analytics' as ActivePage, label: language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics', icon: BarChart3 },
    { id: 'bookkeeping-service' as ActivePage, label: language === 'ar' ? 'مسك الدفاتر' : 'Bookkeeping', icon: BookMarked },
    { id: 'subscriptions' as ActivePage, label: language === 'ar' ? 'الاشتراكات' : 'Subscriptions', icon: RefreshCw },
    { id: 'payment-gateway' as ActivePage, label: language === 'ar' ? 'بوابة الدفع' : 'Payment Gateway', icon: Link2 },
    { id: 'tasks' as ActivePage, label: t.nav_tasks, icon: ListTodo },
    { id: 'approvals' as ActivePage, label: t.nav_approvals, icon: GitBranch },
    { id: 'workflows' as ActivePage, label: language === 'ar' ? 'الدورات المستندية' : 'Workflows', icon: Workflow },
    { id: 'accounting-audit' as ActivePage, label: t.nav_accounting_audit, icon: ShieldCheck },
    { id: 'theme-settings' as ActivePage, label: t.nav_theme_settings, icon: Palette },
  ];

  // Add plugin items
  const { activePlugins } = usePlugins();
  const pluginMenuItems: MenuItem[] = activePlugins.map(p => ({
    id: p.pageId as ActivePage,
    label: language === 'ar' ? p.menuLabel : p.menuLabel_en,
    icon: ICON_MAP[p.menuIcon] || Puzzle,
  }));
  if (pluginMenuItems.length > 0) {
    toolsMenuItems.push(...pluginMenuItems);
  }

  const hasAccess = (permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users') => {
    if (!permission) return true;
    return permissions.admin || permissions[permission];
  };
  const canManageUsers = permissions.admin || permissions.users || permissions.super_admin;
  const isSuperAdmin = permissions.super_admin;

  // Menu config helpers
  const getSectionConfig = (sectionId: string) => {
    if (!menuConfig?.menu_items) return null;
    return menuConfig.menu_items.find((item: any) => item.id === sectionId);
  };

  const isSectionVisible = (sectionId: string) => {
    const config = getSectionConfig(sectionId);
    return config ? config.visible !== false : true;
  };

  const getItemConfig = (sectionId: string, itemId: string) => {
    const section = getSectionConfig(sectionId);
    if (!section?.children) return null;
    return section.children.find((child: any) => child.id === itemId);
  };

  const isItemVisible = (sectionId: string, itemId: string) => {
    const itemConfig = getItemConfig(sectionId, itemId);
    return itemConfig ? itemConfig.visible !== false : true;
  };

  const getItemLabel = (sectionId: string, itemId: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const itemConfig = getItemConfig(sectionId, itemId);
    return itemConfig?.label || defaultLabel;
  };

  const getSectionLabel = (sectionId: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const config = getSectionConfig(sectionId);
    return config?.label || defaultLabel;
  };

  // ===== Build sections =====
  const coreSections: Section[] = [
    { id: 'sales', label: getSectionLabel('sales', language === 'ar' ? 'المبيعات' : 'Sales'), icon: DollarSign, items: salesMenuItems, showCondition: permissions.admin || permissions.sales },
    { id: 'purchases', label: getSectionLabel('purchases', language === 'ar' ? 'المشتريات' : 'Purchases'), icon: ShoppingCart, items: purchasesMenuItems, showCondition: permissions.admin || permissions.purchases },
    { id: 'accounting', label: getSectionLabel('accounting', language === 'ar' ? 'الحسابات' : 'Accounts'), icon: Calculator, items: accountsMenuItems, showCondition: permissions.admin || permissions.reports || permissions.financial_accounting },
    { id: 'inventory', label: getSectionLabel('inventory', language === 'ar' ? 'المستودعات' : 'Warehouses'), icon: Warehouse, items: warehouseMenuItems, showCondition: permissions.admin || permissions.purchases || permissions.warehouses },
    { id: 'hr', label: getSectionLabel('hr', t.nav_hr), icon: Users, items: hrItems, showCondition: permissions.admin || permissions.employees || permissions.payroll },
    { id: 'system', label: getSectionLabel('system', language === 'ar' ? 'النظام' : 'System'), icon: Settings2, items: systemMenuItems, showCondition: canManageUsers },
    { id: 'tools', label: getSectionLabel('tools', language === 'ar' ? 'الأدوات' : 'Tools'), icon: Wrench, items: toolsMenuItems, showCondition: true },
    { id: 'more', label: language === 'ar' ? 'المزيد' : 'More', icon: MoreHorizontal, items: moreItems, showCondition: true, isMore: true },
  ];

  const getFilteredItems = (sec: Section) =>
    sec.items.filter(item => hasAccess(item.permission) && isItemVisible(sec.id, item.id));

  const visibleSections = coreSections.filter(sec => {
    if (!sec.showCondition || !isSectionVisible(sec.id)) return false;
    return getFilteredItems(sec).length > 0;
  });

  // Auto-open the section containing the active page
  useEffect(() => {
    if (activePage && activePage !== 'dashboard') {
      const matchingSection = visibleSections.find(sec =>
        sec.items.some(item => item.id === activePage)
      );
      if (matchingSection) {
        setOpenSections(prev => ({ ...prev, [matchingSection.id]: true }));
      }
    }
  }, [activePage]);

  // Accordion behavior: opening one section closes others
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const isCurrentlyOpen = prev[sectionId];
      // Close all sections, then toggle the clicked one
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => { newState[key] = false; });
      newState[sectionId] = !isCurrentlyOpen;
      return newState;
    });
  };

  return (
    <aside className="w-[260px] sm:w-60 min-h-screen max-h-[100dvh] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-sidebar-accent flex items-center justify-center ring-2 ring-sidebar-primary/20">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={e => {
              (e.target as HTMLImageElement).src = defaultLogo;
            }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm text-white truncate">{appName}</h1>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{appSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Dashboard button */}
      <div className="px-2 pt-2">
        <button
          onClick={() => setActivePage('dashboard' as ActivePage)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
            activePage === 'dashboard'
              ? "bg-sidebar-primary text-white shadow-sm shadow-sidebar-primary/20"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>{s(settings?.dashboard_title, t.nav_dashboard)}</span>
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <nav className="p-2 space-y-0.5">
          {visibleSections.map(section => {
            const filtered = getFilteredItems(section);
            return (
              <SidebarSection
                key={section.id}
                section={{ ...section, items: filtered }}
                activePage={activePage}
                setActivePage={setActivePage}
                isOpen={!!openSections[section.id]}
                onToggle={() => toggleSection(section.id)}
                getItemLabel={getItemLabel}
              />
            );
          })}

          {/* Super Admin */}
          {isSuperAdmin && (
            <div className="mt-3 pt-3 border-t border-sidebar-border/30">
              <button
                type="button"
                onClick={() => {
                  setActivePage('dashboard');
                  navigate('/companies');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-warning/70 hover:bg-warning/10 hover:text-warning transition-all duration-150"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span>{t.nav_company_management}</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border/50 space-y-2">
        <LanguageSwitcher variant="sidebar" />
        <p className="text-[10px] text-center text-sidebar-foreground/30 font-medium">
          {companyType === 'construction' ? t.nav_system_footer_construction :
            companyType === 'general_trading' ? t.nav_system_footer_trading :
              companyType === 'restaurant' ? t.nav_system_footer_restaurant :
                companyType === 'export_import' ? t.nav_system_footer_export_import :
                  t.nav_system_footer_car} © 2026
        </p>
      </div>
    </aside>
  );
}
