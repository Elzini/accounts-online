import { useState } from 'react';

import { LayoutDashboard, Users, Truck, ShoppingCart, DollarSign, FileText, TrendingUp, Package, UserCog, Settings, Building2, ArrowLeftRight, Crown, Calculator, BookOpen, Percent, PieChart, Receipt, CreditCard, FileCheck, Wallet, ClipboardList, Database, Landmark, Scale, Clock, Calendar, FileSpreadsheet, Settings2, ChevronDown, ChevronRight, LucideIcon, Boxes, FileUp, HardHat, Wrench, HandCoins, MapPin, Palette, UtensilsCrossed, ChefHat, Coffee, Ship, FileBox, Globe, ShieldCheck, ListTodo, Warehouse, Ruler, FolderTree, Target, ClipboardCheck, BadgeDollarSign, BarChart3, Activity, GitBranch, CalendarDays, Shield, Factory, Plug, Coins, GitFork, Puzzle, Monitor, MessageCircle, Workflow, ArrowDownToLine, ArrowUpFromLine, RotateCcw, RotateCw, Star, RefreshCw, CalendarCheck, Play, FileSignature, Home, Award, Link2, BookMarked, TestTube, LayoutGrid, Smartphone, QrCode, Code, Banknote, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useMenuConfiguration } from '@/hooks/useSystemControl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import defaultLogo from '@/assets/logo.png';
import { usePlugins } from '@/hooks/usePlugins';
import { useLanguage } from '@/contexts/LanguageContext';

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
  // Construction icons
  'projects': Building2,
  'contracts': FileText,
  'progress-billings': Receipt,
  'materials': Package,
  'subcontractors': Users,
  'equipment': Wrench,
  // Custody
  'custody': HandCoins,
  // Trips
  'trips': MapPin,
  // Theme settings
  'theme-settings': Palette,
  // Restaurant
  'menu-management': UtensilsCrossed,
  'restaurant-orders': Coffee,
  'kitchen-display': ChefHat,
  'table-management': LayoutDashboard,
  // Export/Import
  'shipments': Ship,
  'letters-of-credit': FileBox,
  'customs-clearance': Globe,
  'accounting-audit': ShieldCheck,
  'tasks': ListTodo,
  // Inventory
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

export function Sidebar({
  activePage,
  setActivePage
}: SidebarProps) {
  const navigate = useNavigate();
  const {
    permissions
  } = useAuth();
  const { company } = useCompany();
  const {
    data: settings
  } = useAppSettings();
  const {
    data: menuConfig
  } = useMenuConfiguration();
  const { t, language } = useLanguage();

  // Only use custom settings labels when language is Arabic (the original/default language)
  // When English is selected, always use translation keys
  const s = (settingValue: string | undefined | null, translationValue: string) => {
    if (language !== 'ar') return translationValue;
    return settingValue || translationValue;
  };

  // Get company type
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';

  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Use company logo if available, otherwise use default
  const logoUrl = settings?.company_logo_url || defaultLogo;
  
  // Dynamic app name/subtitle based on company type
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

  // Construction-specific menu items
  const constructionMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: t.nav_dashboard,
    icon: LayoutDashboard
  }, {
    id: 'projects' as ActivePage,
    label: t.nav_projects,
    icon: Building2,
    permission: 'purchases' as const
  }, {
    id: 'contracts' as ActivePage,
    label: t.nav_contracts,
    icon: FileText,
    permission: 'purchases' as const
  }, {
    id: 'progress-billings' as ActivePage,
    label: t.nav_progress_billings,
    icon: Receipt,
    permission: 'sales' as const
  }, {
    id: 'customers' as ActivePage,
    label: t.nav_customers,
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: t.nav_suppliers,
    icon: Truck,
    permission: 'purchases' as const
  }];

  // Restaurant-specific menu items
  const restaurantMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: t.nav_dashboard,
    icon: LayoutDashboard
  }, {
    id: 'menu-management' as ActivePage,
    label: t.nav_menu_management,
    icon: UtensilsCrossed,
    permission: 'purchases' as const
  }, {
    id: 'restaurant-orders' as ActivePage,
    label: t.nav_restaurant_orders,
    icon: Coffee,
    permission: 'sales' as const
  }, {
    id: 'kitchen-display' as ActivePage,
    label: t.nav_kitchen_display,
    icon: ChefHat,
    permission: 'sales' as const
  }, {
    id: 'table-management' as ActivePage,
    label: t.nav_table_management,
    icon: LayoutDashboard,
    permission: 'sales' as const
  }, {
    id: 'customers' as ActivePage,
    label: t.nav_customers,
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: t.nav_suppliers,
    icon: Truck,
    permission: 'purchases' as const
  }];

  // Export/Import-specific menu items
  const exportImportMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: t.nav_dashboard,
    icon: LayoutDashboard
  }, {
    id: 'shipments' as ActivePage,
    label: t.nav_shipments,
    icon: Ship,
    permission: 'purchases' as const
  }, {
    id: 'letters-of-credit' as ActivePage,
    label: t.nav_letters_of_credit,
    icon: FileBox,
    permission: 'purchases' as const
  }, {
    id: 'customs-clearance' as ActivePage,
    label: t.nav_customs_clearance,
    icon: Globe,
    permission: 'purchases' as const
  }, {
    id: 'customers' as ActivePage,
    label: t.nav_customers,
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: t.nav_suppliers,
    icon: Truck,
    permission: 'purchases' as const
  }, {
    id: 'purchases' as ActivePage,
    label: t.nav_purchases,
    icon: ShoppingCart,
    permission: 'purchases' as const
  }, {
    id: 'sales' as ActivePage,
    label: t.nav_sales,
    icon: DollarSign,
    permission: 'sales' as const
  }];

  // ===== مبيعات (Sales) =====
  const salesMenuItems = [{
    id: 'sales' as ActivePage,
    label: language === 'ar' ? 'فاتورة مبيعات' : 'Sales Invoice',
    icon: DollarSign,
    permission: 'sales' as const
  }, {
    id: 'credit-debit-notes' as ActivePage,
    label: language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Returns / Credit Note',
    icon: RotateCcw,
    permission: 'sales' as const
  }, {
    id: 'quotations' as ActivePage,
    label: s(settings?.quotations_title, t.nav_quotations),
    icon: FileCheck,
    permission: 'sales' as const
  }, {
    id: 'installments' as ActivePage,
    label: s(settings?.installments_title, t.nav_installments),
    icon: CreditCard,
    permission: 'sales' as const
  }, {
    id: 'customers' as ActivePage,
    label: s(settings?.customers_title, t.nav_customers),
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'crm' as ActivePage,
    label: language === 'ar' ? 'إدارة العملاء CRM' : 'CRM',
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'loyalty' as ActivePage,
    label: language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points',
    icon: Star,
    permission: 'sales' as const
  }, {
    id: 'sales-targets' as ActivePage,
    label: language === 'ar' ? 'المبيعات المستهدفة' : 'Sales Targets',
    icon: Award,
    permission: 'sales' as const
  }, {
    id: 'bookings' as ActivePage,
    label: language === 'ar' ? 'الحجوزات' : 'Bookings',
    icon: CalendarCheck,
    permission: 'sales' as const
  }, {
    id: 'sales-report' as ActivePage,
    label: s(settings?.sales_report_title, t.nav_sales_report),
    icon: DollarSign,
    permission: 'reports' as const
  }, {
    id: 'customers-report' as ActivePage,
    label: s(settings?.customers_report_title, t.nav_customers_report),
    icon: Users,
    permission: 'reports' as const
  }, {
    id: 'commissions-report' as ActivePage,
    label: s(settings?.commissions_report_title, t.nav_commissions_report),
    icon: DollarSign,
    permission: 'reports' as const
  }];

  // Car dealership extras in sales
  if (companyType === 'car_dealership') {
    salesMenuItems.splice(6, 0, 
      { id: 'partner-dealerships' as ActivePage, label: s(settings?.partner_dealerships_title, t.nav_partner_dealerships), icon: Building2, permission: 'sales' as const },
      { id: 'car-transfers' as ActivePage, label: s(settings?.car_transfers_title, t.nav_car_transfers), icon: ArrowLeftRight, permission: 'sales' as const },
    );
    salesMenuItems.push(
      { id: 'transfers-report' as ActivePage, label: s(settings?.transfers_report_title, t.nav_transfers_report), icon: ArrowLeftRight, permission: 'reports' as const },
      { id: 'partner-report' as ActivePage, label: s(settings?.partner_report_title, t.nav_partner_report), icon: Building2, permission: 'reports' as const },
    );
  }

  // ===== مشتريات (Purchases) =====
  const purchasesMenuItems = [{
    id: 'purchases' as ActivePage,
    label: language === 'ar' ? 'فاتورة مشتريات' : 'Purchase Invoice',
    icon: ShoppingCart,
    permission: 'purchases' as const
  }, {
    id: 'purchase-returns' as ActivePage,
    label: language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Returns / Debit Note',
    icon: RotateCw,
    permission: 'purchases' as const
  }, {
    id: 'materials-request' as ActivePage,
    label: language === 'ar' ? 'طلب مواد' : 'Materials Request',
    icon: Package,
    permission: 'purchases' as const
  }, {
    id: 'purchase-orders' as ActivePage,
    label: language === 'ar' ? 'طلب شراء' : 'Purchase Request',
    icon: ShoppingCart,
    permission: 'purchases' as const
  }, {
    id: 'contractor-payment' as ActivePage,
    label: language === 'ar' ? 'سند صرف مقاول' : 'Contractor Payment',
    icon: Banknote,
    permission: 'purchases' as const
  }, {
    id: 'goods-receipt' as ActivePage,
    label: language === 'ar' ? 'سند استلام مواد' : 'Goods Receipt',
    icon: ArrowDownToLine,
    permission: 'purchases' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: language === 'ar' ? 'ملف الموردين' : 'Suppliers File',
    icon: Truck,
    permission: 'purchases' as const
  }, {
    id: 'currencies' as ActivePage,
    label: language === 'ar' ? 'ملف العملات' : 'Currencies File',
    icon: Coins,
    permission: 'purchases' as const
  }, {
    id: 'expenses' as ActivePage,
    label: s(settings?.expenses_title, t.nav_expenses),
    icon: Wallet,
    permission: 'purchases' as const
  }, {
    id: 'prepaid-expenses' as ActivePage,
    label: s(settings?.prepaid_expenses_title, t.nav_prepaid_expenses),
    icon: Clock,
    permission: 'purchases' as const
  }, {
    id: 'purchases-report' as ActivePage,
    label: language === 'ar' ? 'تقارير المشتريات' : 'Purchases Reports',
    icon: FileText,
    permission: 'reports' as const
  }, {
    id: 'suppliers-report' as ActivePage,
    label: s(settings?.suppliers_report_title, t.nav_suppliers_report),
    icon: Truck,
    permission: 'reports' as const
  }];

  // ===== حسابات (Accounts) =====
  const accountsMenuItems = [{
    id: 'vouchers' as ActivePage,
    label: s(settings?.vouchers_title, t.nav_vouchers),
    icon: Receipt
  }, {
    id: 'journal-entries' as ActivePage,
    label: s(settings?.journal_entries_title, t.nav_journal_entries),
    icon: Calculator
  }, {
    id: 'general-ledger' as ActivePage,
    label: s(settings?.general_ledger_title, t.nav_general_ledger),
    icon: FileText
  }, {
    id: 'account-statement' as ActivePage,
    label: t.nav_account_statement,
    icon: ClipboardList
  }, {
    id: 'banking' as ActivePage,
    label: s(settings?.banking_title, t.nav_banking),
    icon: Scale
  }, {
    id: 'checks' as ActivePage,
    label: t.nav_checks,
    icon: ClipboardCheck
  }, {
    id: 'financing' as ActivePage,
    label: s(settings?.financing_title, t.nav_financing),
    icon: Landmark
  }, {
    id: 'custody' as ActivePage,
    label: t.nav_custody,
    icon: HandCoins
  }, {
    id: 'chart-of-accounts' as ActivePage,
    label: s(settings?.chart_of_accounts_title, t.nav_chart_of_accounts),
    icon: BookOpen
  }, {
    id: 'cost-centers' as ActivePage,
    label: t.nav_cost_centers,
    icon: Target
  }, {
    id: 'tax-settings' as ActivePage,
    label: s(settings?.tax_settings_title, t.nav_tax_settings),
    icon: Percent
  }, {
    id: 'currencies' as ActivePage,
    label: t.nav_currencies,
    icon: Coins
  }, {
    id: 'vat-return-report' as ActivePage,
    label: t.nav_vat_return,
    icon: Receipt
  }, {
    id: 'financial-reports' as ActivePage,
    label: s(settings?.financial_reports_title, t.nav_financial_reports),
    icon: PieChart
  }, {
    id: 'zakat-reports' as ActivePage,
    label: t.nav_zakat_reports,
    icon: Scale
  }, {
    id: 'trial-balance-analysis' as ActivePage,
    label: t.nav_trial_balance,
    icon: FileSpreadsheet
  }, {
    id: 'financial-statements' as ActivePage,
    label: t.nav_financial_statements,
    icon: FileText
  }, {
    id: 'fixed-assets' as ActivePage,
    label: t.nav_fixed_assets,
    icon: Boxes
  }, {
    id: 'aging-report' as ActivePage,
    label: t.nav_aging_report,
    icon: Clock
  }, {
    id: 'budgets' as ActivePage,
    label: t.nav_budgets,
    icon: BarChart3
  }, {
    id: 'financial-kpis' as ActivePage,
    label: t.nav_financial_kpis,
    icon: Activity
  }, {
    id: 'profit-report' as ActivePage,
    label: s(settings?.profit_report_title, t.nav_profit_report),
    icon: TrendingUp,
    permission: 'reports' as const
  }, {
    id: 'account-movement' as ActivePage,
    label: t.nav_account_movement,
    icon: ClipboardList,
    permission: 'reports' as const
  }];

  // ===== مستودعات (Warehouses/Inventory) =====
  const warehouseMenuItems = [{
    id: 'items-catalog' as ActivePage,
    label: t.nav_items,
    icon: Package
  }, {
    id: 'stock-vouchers' as ActivePage,
    label: language === 'ar' ? 'الأذون المخزنية' : 'Stock Vouchers',
    icon: ArrowUpFromLine
  }, {
    id: 'warehouses' as ActivePage,
    label: t.nav_warehouses,
    icon: Warehouse
  }, {
    id: 'item-categories' as ActivePage,
    label: t.nav_categories,
    icon: FolderTree
  }, {
    id: 'units-of-measure' as ActivePage,
    label: t.nav_units,
    icon: Ruler
  }, {
    id: 'stocktaking' as ActivePage,
    label: language === 'ar' ? 'الجرد' : 'Stocktaking',
    icon: ClipboardList
  }, {
    id: 'manufacturing' as ActivePage,
    label: t.nav_manufacturing,
    icon: Factory
  }, {
    id: 'mobile-inventory' as ActivePage,
    label: language === 'ar' ? 'جرد بالجوال' : 'Mobile Inventory',
    icon: Smartphone
  }, {
    id: 'inventory-report' as ActivePage,
    label: s(settings?.inventory_report_title, t.nav_inventory_report),
    icon: Package,
    permission: 'reports' as const
  }];

  // ===== النظام (System) =====
  const systemMenuItems = [{
    id: 'users-management' as ActivePage,
    label: s(settings?.users_management_title, t.nav_users_management),
    icon: UserCog
  }, {
    id: 'branches' as ActivePage,
    label: t.nav_branches,
    icon: GitFork
  }, {
    id: 'fiscal-years' as ActivePage,
    label: t.nav_fiscal_years,
    icon: Calendar
  }, {
    id: 'tasks' as ActivePage,
    label: t.nav_tasks,
    icon: ListTodo
  }, {
    id: 'approvals' as ActivePage,
    label: t.nav_approvals,
    icon: GitBranch
  }, {
    id: 'workflows' as ActivePage,
    label: language === 'ar' ? 'الدورات المستندية' : 'Workflows',
    icon: Workflow
  }, {
    id: 'app-settings' as ActivePage,
    label: s(settings?.app_settings_title, t.nav_app_settings),
    icon: Settings
  }, {
    id: 'theme-settings' as ActivePage,
    label: t.nav_theme_settings,
    icon: Palette
  }, {
    id: 'control-center' as ActivePage,
    label: t.nav_control_center,
    icon: Settings2
  }, {
    id: 'audit-logs' as ActivePage,
    label: s(settings?.audit_logs_title, t.nav_audit_logs),
    icon: ClipboardList
  }, {
    id: 'accounting-audit' as ActivePage,
    label: t.nav_accounting_audit,
    icon: ShieldCheck
  }, {
    id: 'backups' as ActivePage,
    label: s(settings?.backups_title, t.nav_backups),
    icon: Database
  }, {
    id: 'medad-import' as ActivePage,
    label: t.nav_medad_import,
    icon: FileUp
  }, {
    id: 'zatca-sandbox' as ActivePage,
    label: language === 'ar' ? 'بيئة محاكاة ZATCA' : 'ZATCA Sandbox',
    icon: TestTube
  }, {
    id: 'zatca-technical-doc' as ActivePage,
    label: language === 'ar' ? 'وثائق ZATCA التقنية' : 'ZATCA Technical Docs',
    icon: FileText
  }, {
    id: 'mobile-invoice-reader' as ActivePage,
    label: language === 'ar' ? 'قراءة فاتورة بالجوال' : 'Mobile Invoice Reader',
    icon: QrCode
  }];

  // ===== HR =====
  const hrItems = [{
    id: 'employees' as ActivePage,
    label: t.nav_employees,
    icon: Users
  }, {
    id: 'payroll' as ActivePage,
    label: t.nav_payroll,
    icon: CreditCard
  }, {
    id: 'attendance' as ActivePage,
    label: t.nav_attendance,
    icon: Clock
  }, {
    id: 'fingerprint-devices' as ActivePage,
    label: language === 'ar' ? 'أجهزة البصمة' : 'Fingerprint Devices',
    icon: Fingerprint
  }, {
    id: 'leaves' as ActivePage,
    label: t.nav_leaves,
    icon: CalendarDays
  }, {
    id: 'employee-contracts' as ActivePage,
    label: language === 'ar' ? 'عقود الموظفين' : 'Employee Contracts',
    icon: FileSignature
  }, {
    id: 'org-structure' as ActivePage,
    label: language === 'ar' ? 'الهيكل التنظيمي' : 'Org Structure',
    icon: GitFork
  }];

  // ===== Operations =====
  const operationsItems = [{
    id: 'work-orders' as ActivePage,
    label: language === 'ar' ? 'أوامر العمل' : 'Work Orders',
    icon: Wrench
  }, {
    id: 'time-tracking' as ActivePage,
    label: language === 'ar' ? 'تتبع الوقت' : 'Time Tracking',
    icon: Play
  }, {
    id: 'rentals' as ActivePage,
    label: language === 'ar' ? 'الإيجارات' : 'Rentals',
    icon: Home
  }, {
    id: 'trips' as ActivePage,
    label: t.nav_trips,
    icon: MapPin
  }, {
    id: 'advanced-projects' as ActivePage,
    label: language === 'ar' ? 'إدارة مشاريع متقدمة' : 'Advanced Projects',
    icon: LayoutGrid
  }, {
    id: 'customer-portal' as ActivePage,
    label: language === 'ar' ? 'بوابة العملاء' : 'Customer Portal',
    icon: Globe
  }, {
    id: 'bookkeeping-service' as ActivePage,
    label: language === 'ar' ? 'مسك الدفاتر كخدمة' : 'Bookkeeping Service',
    icon: BookMarked
  }, {
    id: 'subscriptions' as ActivePage,
    label: language === 'ar' ? 'الاشتراكات' : 'Subscriptions',
    icon: RefreshCw
  }, {
    id: 'payment-gateway' as ActivePage,
    label: language === 'ar' ? 'بوابة الدفع' : 'Payment Gateway',
    icon: Link2
  }];

  // ===== Integrations =====
  const { activePlugins } = usePlugins();

  const pluginMenuItems = activePlugins.map(p => ({
    id: p.pageId as ActivePage,
    label: language === 'ar' ? p.menuLabel : p.menuLabel_en,
    icon: ICON_MAP[p.menuIcon] || Puzzle,
  }));

  const integrationItems = [{
    id: 'integrations' as ActivePage,
    label: t.nav_integrations,
    icon: Plug
  }, {
    id: 'api-management' as ActivePage,
    label: t.nav_api_management,
    icon: Globe
  }, {
    id: 'developer-api' as ActivePage,
    label: language === 'ar' ? 'API للمطورين' : 'Developer API',
    icon: Code
  }, {
    id: 'plugins' as ActivePage,
    label: t.nav_plugins,
    icon: Puzzle
  }, ...pluginMenuItems];
  
  const hasAccess = (permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users') => {
    if (!permission) return true;
    return permissions.admin || permissions[permission];
  };
  const canManageUsers = permissions.admin || permissions.users || permissions.super_admin;
  const isSuperAdmin = permissions.super_admin;

  // Get menu configuration for a section
  const getSectionConfig = (sectionId: string) => {
    if (!menuConfig?.menu_items) return null;
    return menuConfig.menu_items.find(item => item.id === sectionId);
  };

  // Check if section is visible
  const isSectionVisible = (sectionId: string) => {
    const config = getSectionConfig(sectionId);
    return config ? config.visible !== false : true;
  };

  // Check if section is collapsible - default to true (all sections collapsible)
  const isSectionCollapsible = (sectionId: string) => {
    const config = getSectionConfig(sectionId);
    return config?.isCollapsible !== false;
  };

  // Get section label - respect language setting
  const getSectionLabel = (sectionId: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const config = getSectionConfig(sectionId);
    return config?.label || defaultLabel;
  };

  // Get item config
  const getItemConfig = (sectionId: string, itemId: string) => {
    const section = getSectionConfig(sectionId);
    if (!section?.children) return null;
    return section.children.find(child => child.id === itemId);
  };

  // Check if item is visible
  const isItemVisible = (sectionId: string, itemId: string) => {
    const itemConfig = getItemConfig(sectionId, itemId);
    return itemConfig ? itemConfig.visible !== false : true;
  };

  // Get item label - respect language setting
  const getItemLabel = (sectionId: string, itemId: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const itemConfig = getItemConfig(sectionId, itemId);
    return itemConfig?.label || defaultLabel;
  };
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Render a collapsible section
  const renderCollapsibleSection = (sectionId: string, defaultLabel: string, items: Array<{
    id: ActivePage;
    label: string;
    icon: LucideIcon;
    permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users';
  }>, showCondition: boolean = true) => {
    if (!showCondition || !isSectionVisible(sectionId)) return null;
    const isCollapsible = isSectionCollapsible(sectionId);
    const sectionLabel = getSectionLabel(sectionId, defaultLabel);
    const isCollapsed = collapsedSections[sectionId];
    const filteredItems = items.filter(item => hasAccess(item.permission) && isItemVisible(sectionId, item.id));
    if (filteredItems.length === 0) return null;
    if (!isCollapsible) {
      return <div className="mb-5">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-2 px-3">
            {sectionLabel}
          </p>
          <ul className="space-y-0.5">
            {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const itemLabel = getItemLabel(sectionId, item.id, item.label);
            return <li key={item.id}>
                  <button onClick={() => setActivePage(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200", isActive ? "bg-sidebar-primary text-white shadow-md shadow-sidebar-primary/25" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-white/20" : "bg-sidebar-accent/50")}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="font-medium text-sm truncate">{itemLabel}</span>
                  </button>
                </li>;
          })}
          </ul>
        </div>;
    }
    return <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(sectionId)} className="mb-5">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-2 px-3 hover:text-sidebar-foreground/60 transition-colors">
            <span>{sectionLabel}</span>
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-0.5">
            {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const itemLabel = getItemLabel(sectionId, item.id, item.label);
            return <li key={item.id}>
                  <button onClick={() => setActivePage(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200", isActive ? "bg-sidebar-primary text-white shadow-md shadow-sidebar-primary/25" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-white/20" : "bg-sidebar-accent/50")}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="font-medium text-sm truncate">{itemLabel}</span>
                  </button>
                </li>;
          })}
          </ul>
        </CollapsibleContent>
      </Collapsible>;
  };
  return <aside className="w-[280px] sm:w-64 min-h-screen max-h-[100dvh] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-sidebar-accent flex items-center justify-center ring-2 ring-sidebar-primary/20">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={e => {
            (e.target as HTMLImageElement).src = defaultLogo;
          }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base text-white truncate">{appName}</h1>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{appSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
        {/* Dashboard */}
        {renderCollapsibleSection('main', t.nav_main_menu, [{
          id: 'dashboard' as ActivePage,
          label: s(settings?.dashboard_title, t.nav_dashboard),
          icon: LayoutDashboard
        }])}

        {/* مبيعات - Sales */}
        {renderCollapsibleSection('sales', language === 'ar' ? 'مبيعات' : 'Sales', salesMenuItems, permissions.admin || permissions.sales)}

        {/* مشتريات - Purchases */}
        {renderCollapsibleSection('purchases', language === 'ar' ? 'مشتريات' : 'Purchases', purchasesMenuItems, permissions.admin || permissions.purchases)}

        {/* حسابات - Accounts */}
        {renderCollapsibleSection('accounting', language === 'ar' ? 'حسابات' : 'Accounts', accountsMenuItems, permissions.admin || permissions.reports || permissions.financial_accounting)}

        {/* مستودعات - Warehouses */}
        {renderCollapsibleSection('inventory', language === 'ar' ? 'مستودعات' : 'Warehouses', warehouseMenuItems, permissions.admin || permissions.purchases || permissions.warehouses)}

        {/* الموارد البشرية - HR */}
        {renderCollapsibleSection('hr', t.nav_hr, hrItems, permissions.admin || permissions.employees || permissions.payroll)}

        {/* العمليات - Operations */}
        {renderCollapsibleSection('operations', language === 'ar' ? 'العمليات' : 'Operations', operationsItems, true)}

        {/* التكامل - Integrations */}
        {renderCollapsibleSection('integrations', t.nav_integrations_section, integrationItems, true)}

        {/* النظام - System */}
        {renderCollapsibleSection('system', language === 'ar' ? 'النظام' : 'System', systemMenuItems, canManageUsers)}

        {isSuperAdmin && <div className="mb-5">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-warning/50 mb-2 px-3">{t.nav_super_admin}</p>
            <ul className="space-y-0.5">
              <li>
                <button type="button" onClick={() => {
              setActivePage('dashboard');
              navigate('/companies');
            }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200", "text-warning/70 hover:bg-warning/10 hover:text-warning")}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warning/10">
                    <Crown className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="font-medium text-sm truncate">{t.nav_company_management}</span>
                </button>
              </li>
            </ul>
          </div>}

      </nav>

      {/* Language Switcher & Footer */}
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
    </aside>;
}