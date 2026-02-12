import { useState } from 'react';

import { LayoutDashboard, Users, Truck, ShoppingCart, DollarSign, FileText, TrendingUp, Package, UserCog, Settings, Building2, ArrowLeftRight, Crown, Calculator, BookOpen, Percent, PieChart, Receipt, CreditCard, FileCheck, Wallet, ClipboardList, Database, Landmark, Scale, Clock, Calendar, FileSpreadsheet, Settings2, ChevronDown, ChevronRight, LucideIcon, Boxes, FileUp, HardHat, Wrench, HandCoins, MapPin, Palette, UtensilsCrossed, ChefHat, Coffee, Ship, FileBox, Globe, ShieldCheck, ListTodo, Warehouse, Ruler, FolderTree, Target, ClipboardCheck, BadgeDollarSign, BarChart3, Activity, GitBranch, CalendarDays, Shield, Factory, Plug, Coins, GitFork, Puzzle, Monitor, MessageCircle } from 'lucide-react';
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

  // Default menu structure (car dealership / general trading)
  const defaultMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: s(settings?.dashboard_title, t.nav_dashboard),
    icon: LayoutDashboard
  }, {
    id: 'customers' as ActivePage,
    label: s(settings?.customers_title, t.nav_customers),
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: s(settings?.suppliers_title, t.nav_suppliers),
    icon: Truck,
    permission: 'purchases' as const
  }, {
    id: 'purchases' as ActivePage,
    label: s(settings?.purchases_title, t.nav_purchases),
    icon: ShoppingCart,
    permission: 'purchases' as const
  }, {
    id: 'sales' as ActivePage,
    label: s(settings?.sales_title, t.nav_sales),
    icon: DollarSign,
    permission: 'sales' as const
  }];
  const transferItems = [{
    id: 'partner-dealerships' as ActivePage,
    label: s(settings?.partner_dealerships_title, t.nav_partner_dealerships),
    icon: Building2
  }, {
    id: 'car-transfers' as ActivePage,
    label: s(settings?.car_transfers_title, t.nav_car_transfers),
    icon: ArrowLeftRight
  }];
  const financeItems = [{
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
    id: 'leaves' as ActivePage,
    label: t.nav_leaves,
    icon: CalendarDays
  }, {
    id: 'expenses' as ActivePage,
    label: s(settings?.expenses_title, t.nav_expenses),
    icon: Wallet
  }, {
    id: 'prepaid-expenses' as ActivePage,
    label: s(settings?.prepaid_expenses_title, t.nav_prepaid_expenses),
    icon: Clock
  }, {
    id: 'quotations' as ActivePage,
    label: s(settings?.quotations_title, t.nav_quotations),
    icon: FileCheck
  }, {
    id: 'installments' as ActivePage,
    label: s(settings?.installments_title, t.nav_installments),
    icon: CreditCard
  }, {
    id: 'vouchers' as ActivePage,
    label: s(settings?.vouchers_title, t.nav_vouchers),
    icon: Receipt
  }, {
    id: 'financing' as ActivePage,
    label: s(settings?.financing_title, t.nav_financing),
    icon: Landmark
  }, {
    id: 'banking' as ActivePage,
    label: s(settings?.banking_title, t.nav_banking),
    icon: Scale
  }, {
    id: 'custody' as ActivePage,
    label: t.nav_custody,
    icon: HandCoins
  }, {
    id: 'trips' as ActivePage,
    label: t.nav_trips,
    icon: MapPin
  }, {
    id: 'tasks' as ActivePage,
    label: t.nav_tasks,
    icon: ListTodo
  }, {
    id: 'manufacturing' as ActivePage,
    label: t.nav_manufacturing,
    icon: Factory
  }];
  const { activePlugins } = usePlugins();

  const pluginMenuItems = activePlugins.map(p => ({
    id: p.pageId as ActivePage,
    label: p.menuLabel,
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
    id: 'plugins' as ActivePage,
    label: t.nav_plugins,
    icon: Puzzle
  }, ...pluginMenuItems];
  // Inventory items
  const inventoryItems = [{
    id: 'warehouses' as ActivePage,
    label: t.nav_warehouses,
    icon: Warehouse
  }, {
    id: 'items-catalog' as ActivePage,
    label: t.nav_items,
    icon: Package
  }, {
    id: 'item-categories' as ActivePage,
    label: t.nav_categories,
    icon: FolderTree
  }, {
    id: 'units-of-measure' as ActivePage,
    label: t.nav_units,
    icon: Ruler
  }];
  // Reports - filtered by company type
  const allReportItems = [{
    id: 'inventory-report' as ActivePage,
    label: s(settings?.inventory_report_title, t.nav_inventory_report),
    icon: Package,
    permission: 'reports' as const,
    types: ['car_dealership', 'general_trading', 'restaurant'] as string[],
  }, {
    id: 'profit-report' as ActivePage,
    label: s(settings?.profit_report_title, t.nav_profit_report),
    icon: TrendingUp,
    permission: 'reports' as const,
    types: null,
  }, {
    id: 'purchases-report' as ActivePage,
    label: s(settings?.purchases_report_title, t.nav_purchases_report),
    icon: FileText,
    permission: 'reports' as const,
    types: null,
  }, {
    id: 'sales-report' as ActivePage,
    label: s(settings?.sales_report_title, t.nav_sales_report),
    icon: DollarSign,
    permission: 'reports' as const,
    types: null,
  }, {
    id: 'customers-report' as ActivePage,
    label: s(settings?.customers_report_title, t.nav_customers_report),
    icon: Users,
    permission: 'reports' as const,
    types: null,
  }, {
    id: 'suppliers-report' as ActivePage,
    label: s(settings?.suppliers_report_title, t.nav_suppliers_report),
    icon: Truck,
    permission: 'reports' as const,
    types: null,
  }, {
    id: 'commissions-report' as ActivePage,
    label: s(settings?.commissions_report_title, t.nav_commissions_report),
    icon: DollarSign,
    permission: 'reports' as const,
    types: ['car_dealership', 'general_trading'] as string[],
  }, {
    id: 'transfers-report' as ActivePage,
    label: s(settings?.transfers_report_title, t.nav_transfers_report),
    icon: ArrowLeftRight,
    permission: 'reports' as const,
    types: ['car_dealership'] as string[],
  }, {
    id: 'partner-report' as ActivePage,
    label: s(settings?.partner_report_title, t.nav_partner_report),
    icon: Building2,
    permission: 'reports' as const,
    types: ['car_dealership'] as string[],
  }, {
    id: 'account-movement' as ActivePage,
    label: t.nav_account_movement,
    icon: ClipboardList,
    permission: 'reports' as const,
    types: null,
  }];
  
  const reportItems = allReportItems
    .filter(item => !item.types || item.types.includes(companyType))
    .map(({ types, ...rest }) => rest);
  const accountingItems = [{
    id: 'fiscal-years' as ActivePage,
    label: t.nav_fiscal_years,
    icon: Calendar
  }, {
    id: 'tax-settings' as ActivePage,
    label: s(settings?.tax_settings_title, t.nav_tax_settings),
    icon: Percent
  }, {
    id: 'chart-of-accounts' as ActivePage,
    label: s(settings?.chart_of_accounts_title, t.nav_chart_of_accounts),
    icon: BookOpen
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
    id: 'cost-centers' as ActivePage,
    label: t.nav_cost_centers,
    icon: Target
  }, {
    id: 'medad-import' as ActivePage,
    label: t.nav_medad_import,
    icon: FileUp
  }, {
    id: 'aging-report' as ActivePage,
    label: t.nav_aging_report,
    icon: Clock
  }, {
    id: 'checks' as ActivePage,
    label: t.nav_checks,
    icon: ClipboardCheck
  }, {
    id: 'budgets' as ActivePage,
    label: t.nav_budgets,
    icon: BarChart3
  }, {
    id: 'financial-kpis' as ActivePage,
    label: t.nav_financial_kpis,
    icon: Activity
  }, {
    id: 'approvals' as ActivePage,
    label: t.nav_approvals,
    icon: GitBranch
  }, {
    id: 'currencies' as ActivePage,
    label: t.nav_currencies,
    icon: Coins
  }, {
    id: 'branches' as ActivePage,
    label: t.nav_branches,
    icon: GitFork
  }];
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

  // Check if section is collapsible
  const isSectionCollapsible = (sectionId: string) => {
    const config = getSectionConfig(sectionId);
    return config?.isCollapsible === true;
  };

  // Get section label
  const getSectionLabel = (sectionId: string, defaultLabel: string) => {
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

  // Get item label
  const getItemLabel = (sectionId: string, itemId: string, defaultLabel: string) => {
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
        {renderCollapsibleSection('main', t.nav_main_menu, 
          companyType === 'construction' ? constructionMenuItems :
          companyType === 'restaurant' ? restaurantMenuItems :
          companyType === 'export_import' ? exportImportMenuItems :
          defaultMenuItems
        )}

        {companyType === 'car_dealership' && renderCollapsibleSection('transfers', s(settings?.transfers_section_title, t.nav_transfers), transferItems, permissions.admin || permissions.sales || permissions.purchases)}

        {renderCollapsibleSection('finance', s(settings?.finance_section_title, t.nav_finance), financeItems, permissions.admin || permissions.sales || permissions.purchases)}

        {renderCollapsibleSection('inventory', t.nav_inventory, inventoryItems, permissions.admin || permissions.purchases)}

        {renderCollapsibleSection('reports', s(settings?.reports_title, t.nav_reports), reportItems, hasAccess('reports'))}

        {renderCollapsibleSection('accounting', s(settings?.accounting_section_title, t.nav_accounting), accountingItems, permissions.admin || permissions.reports)}

        {renderCollapsibleSection('integrations', t.nav_integrations_section, integrationItems, true)}

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

        {canManageUsers && renderCollapsibleSection('admin', s(settings?.admin_section_title, t.nav_admin), [{
        id: 'users-management' as ActivePage,
        label: s(settings?.users_management_title, t.nav_users_management),
        icon: UserCog
      }, {
        id: 'app-settings' as ActivePage,
        label: s(settings?.app_settings_title, t.nav_app_settings),
        icon: Settings
      }, {
        id: 'theme-settings' as ActivePage,
        label: t.nav_theme_settings,
        icon: Palette
      }, {
        id: 'audit-logs' as ActivePage,
        label: s(settings?.audit_logs_title, t.nav_audit_logs),
        icon: ClipboardList
      }, {
        id: 'backups' as ActivePage,
        label: s(settings?.backups_title, t.nav_backups),
        icon: Database
      }, {
        id: 'control-center' as ActivePage,
        label: t.nav_control_center,
        icon: Settings2
      }, {
        id: 'accounting-audit' as ActivePage,
        label: t.nav_accounting_audit,
        icon: ShieldCheck
      }], canManageUsers)}
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