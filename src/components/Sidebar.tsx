import { useState } from 'react';
import { LayoutDashboard, Users, Truck, ShoppingCart, DollarSign, FileText, TrendingUp, Package, UserCog, Settings, Building2, ArrowLeftRight, Crown, Calculator, BookOpen, Percent, PieChart, Receipt, CreditCard, FileCheck, Wallet, ClipboardList, Database, Landmark, Scale, Clock, Calendar, FileSpreadsheet, Settings2, ChevronDown, ChevronRight, LucideIcon, Boxes, FileUp, HardHat, Wrench, HandCoins, MapPin, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useAppSettings } from '@/hooks/useSettings';
import { useMenuConfiguration } from '@/hooks/useSystemControl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import defaultLogo from '@/assets/logo.png';

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
  'theme-settings': Palette
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

  // Get company type
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';

  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Use company logo if available, otherwise use default
  const logoUrl = settings?.company_logo_url || defaultLogo;
  
  // Dynamic app name/subtitle based on company type
  const getAppName = () => {
    if (settings?.app_name) return settings.app_name;
    switch (companyType) {
      case 'construction': return 'نظام إدارة المقاولات';
      case 'general_trading': return 'نظام إدارة التجارة';
      default: return 'منصة إدارة المعارض';
    }
  };
  
  const getAppSubtitle = () => {
    if (settings?.app_subtitle) return settings.app_subtitle;
    switch (companyType) {
      case 'construction': return 'للمشاريع والعقود';
      case 'general_trading': return 'للتجارة العامة';
      default: return 'لتجارة السيارات';
    }
  };
  
  const appName = getAppName();
  const appSubtitle = getAppSubtitle();

  // Construction-specific menu items
  const constructionMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: 'الرئيسية',
    icon: LayoutDashboard
  }, {
    id: 'projects' as ActivePage,
    label: 'المشاريع',
    icon: Building2,
    permission: 'purchases' as const
  }, {
    id: 'contracts' as ActivePage,
    label: 'العقود',
    icon: FileText,
    permission: 'purchases' as const
  }, {
    id: 'progress-billings' as ActivePage,
    label: 'المستخلصات',
    icon: Receipt,
    permission: 'sales' as const
  }, {
    id: 'customers' as ActivePage,
    label: 'العملاء',
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: 'الموردين',
    icon: Truck,
    permission: 'purchases' as const
  }];

  // Default menu structure (car dealership)
  const defaultMenuItems = [{
    id: 'dashboard' as ActivePage,
    label: settings?.dashboard_title || 'الرئيسية',
    icon: LayoutDashboard
  }, {
    id: 'customers' as ActivePage,
    label: settings?.customers_title || 'العملاء',
    icon: Users,
    permission: 'sales' as const
  }, {
    id: 'suppliers' as ActivePage,
    label: settings?.suppliers_title || 'الموردين',
    icon: Truck,
    permission: 'purchases' as const
  }, {
    id: 'purchases' as ActivePage,
    label: settings?.purchases_title || 'المشتريات',
    icon: ShoppingCart,
    permission: 'purchases' as const
  }, {
    id: 'sales' as ActivePage,
    label: settings?.sales_title || 'المبيعات',
    icon: DollarSign,
    permission: 'sales' as const
  }];
  const transferItems = [{
    id: 'partner-dealerships' as ActivePage,
    label: settings?.partner_dealerships_title || 'المعارض الشريكة',
    icon: Building2
  }, {
    id: 'car-transfers' as ActivePage,
    label: settings?.car_transfers_title || 'تحويلات السيارات',
    icon: ArrowLeftRight
  }];
  const financeItems = [{
    id: 'employees' as ActivePage,
    label: 'الموظفين',
    icon: Users
  }, {
    id: 'payroll' as ActivePage,
    label: 'مسير الرواتب',
    icon: CreditCard
  }, {
    id: 'expenses' as ActivePage,
    label: settings?.expenses_title || 'المصروفات',
    icon: Wallet
  }, {
    id: 'prepaid-expenses' as ActivePage,
    label: settings?.prepaid_expenses_title || 'المصروفات المقدمة',
    icon: Clock
  }, {
    id: 'quotations' as ActivePage,
    label: settings?.quotations_title || 'عروض الأسعار',
    icon: FileCheck
  }, {
    id: 'installments' as ActivePage,
    label: settings?.installments_title || 'الأقساط',
    icon: CreditCard
  }, {
    id: 'vouchers' as ActivePage,
    label: settings?.vouchers_title || 'سندات القبض والصرف',
    icon: Receipt
  }, {
    id: 'financing' as ActivePage,
    label: settings?.financing_title || 'شركات التمويل',
    icon: Landmark
  }, {
    id: 'banking' as ActivePage,
    label: settings?.banking_title || 'إدارة البنوك',
    icon: Scale
  }, {
    id: 'custody' as ActivePage,
    label: 'إدارة العهد',
    icon: HandCoins
  }, {
    id: 'trips' as ActivePage,
    label: 'إدارة الرحلات',
    icon: MapPin
  }];
  const reportItems = [{
    id: 'inventory-report' as ActivePage,
    label: settings?.inventory_report_title || 'تقرير المخزون',
    icon: Package,
    permission: 'reports' as const
  }, {
    id: 'profit-report' as ActivePage,
    label: settings?.profit_report_title || 'تقرير الأرباح',
    icon: TrendingUp,
    permission: 'reports' as const
  }, {
    id: 'purchases-report' as ActivePage,
    label: settings?.purchases_report_title || 'تقرير المشتريات',
    icon: FileText,
    permission: 'reports' as const
  }, {
    id: 'sales-report' as ActivePage,
    label: settings?.sales_report_title || 'تقرير المبيعات',
    icon: DollarSign,
    permission: 'reports' as const
  }, {
    id: 'customers-report' as ActivePage,
    label: settings?.customers_report_title || 'تقرير العملاء',
    icon: Users,
    permission: 'reports' as const
  }, {
    id: 'suppliers-report' as ActivePage,
    label: settings?.suppliers_report_title || 'تقرير الموردين',
    icon: Truck,
    permission: 'reports' as const
  }, {
    id: 'commissions-report' as ActivePage,
    label: settings?.commissions_report_title || 'تقرير العمولات',
    icon: DollarSign,
    permission: 'reports' as const
  }, {
    id: 'transfers-report' as ActivePage,
    label: settings?.transfers_report_title || 'تقرير التحويلات',
    icon: ArrowLeftRight,
    permission: 'reports' as const
  }, {
    id: 'partner-report' as ActivePage,
    label: settings?.partner_report_title || 'تقرير المعرض الشريك',
    icon: Building2,
    permission: 'reports' as const
  }, {
    id: 'account-movement' as ActivePage,
    label: 'تقرير حركة الحسابات',
    icon: ClipboardList,
    permission: 'reports' as const
  }];
  const accountingItems = [{
    id: 'fiscal-years' as ActivePage,
    label: 'السنوات المالية',
    icon: Calendar
  }, {
    id: 'tax-settings' as ActivePage,
    label: settings?.tax_settings_title || 'إعدادات الضريبة',
    icon: Percent
  }, {
    id: 'chart-of-accounts' as ActivePage,
    label: settings?.chart_of_accounts_title || 'شجرة الحسابات',
    icon: BookOpen
  }, {
    id: 'journal-entries' as ActivePage,
    label: settings?.journal_entries_title || 'دفتر اليومية',
    icon: Calculator
  }, {
    id: 'general-ledger' as ActivePage,
    label: settings?.general_ledger_title || 'دفتر الأستاذ',
    icon: FileText
  }, {
    id: 'account-statement' as ActivePage,
    label: 'كشف حساب مفصل',
    icon: ClipboardList
  }, {
    id: 'vat-return-report' as ActivePage,
    label: 'إقرار ضريبة القيمة المضافة',
    icon: Receipt
  }, {
    id: 'financial-reports' as ActivePage,
    label: settings?.financial_reports_title || 'التقارير المالية',
    icon: PieChart
  }, {
    id: 'zakat-reports' as ActivePage,
    label: 'القوائم الزكوية',
    icon: Scale
  }, {
    id: 'trial-balance-analysis' as ActivePage,
    label: 'تحليل ميزان المراجعة',
    icon: FileSpreadsheet
  }, {
    id: 'financial-statements' as ActivePage,
    label: 'القوائم المالية الشاملة',
    icon: FileText
  }, {
    id: 'fixed-assets' as ActivePage,
    label: 'الأصول الثابتة',
    icon: Boxes
  }, {
    id: 'medad-import' as ActivePage,
    label: 'استيراد من مداد',
    icon: FileUp
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
      return <div className="mb-4 sm:mb-5">
          <p className="text-[11px] sm:text-xs font-semibold text-sidebar-foreground/50 mb-2 sm:mb-3 px-2 sm:px-3">
            {sectionLabel}
          </p>
          <ul className="space-y-1">
            {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const itemLabel = getItemLabel(sectionId, item.id, item.label);
            return <li key={item.id}>
                  <button onClick={() => setActivePage(item.id)} className={cn("w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200", isActive ? "gradient-primary text-white shadow-md" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white")}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">{itemLabel}</span>
                  </button>
                </li>;
          })}
          </ul>
        </div>;
    }
    return <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(sectionId)} className="mb-4 sm:mb-5">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-[11px] sm:text-xs font-semibold text-sidebar-foreground/50 mb-2 sm:mb-3 px-2 sm:px-3 hover:text-sidebar-foreground/70 transition-colors">
            <span>{sectionLabel}</span>
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-1">
            {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const itemLabel = getItemLabel(sectionId, item.id, item.label);
            return <li key={item.id}>
                  <button onClick={() => setActivePage(item.id)} className={cn("w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200", isActive ? "gradient-primary text-white shadow-md" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white")}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">{itemLabel}</span>
                  </button>
                </li>;
          })}
          </ul>
        </CollapsibleContent>
      </Collapsible>;
  };
  return <aside className="w-[280px] sm:w-64 min-h-screen max-h-[100dvh] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-cover bg-white/10" onError={e => {
          (e.target as HTMLImageElement).src = defaultLogo;
        }} />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-lg text-white truncate">{appName}</h1>
            <p className="text-[11px] sm:text-xs text-sidebar-foreground/70 truncate">{appSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto">
        {/* Main Section - Changes based on company type */}
        {renderCollapsibleSection('main', 'القائمة الرئيسية', 
          companyType === 'construction' ? constructionMenuItems : defaultMenuItems
        )}

        {/* Transfers - Only for car dealership */}
        {companyType === 'car_dealership' && renderCollapsibleSection('transfers', settings?.transfers_section_title || 'التحويلات', transferItems, permissions.admin || permissions.sales || permissions.purchases)}

        {/* Finance Section */}
        {renderCollapsibleSection('finance', settings?.finance_section_title || 'المالية', financeItems, permissions.admin || permissions.sales || permissions.purchases)}

        {/* Reports */}
        {renderCollapsibleSection('reports', settings?.reports_title || 'التقارير', reportItems, hasAccess('reports'))}

        {/* Accounting */}
        {renderCollapsibleSection('accounting', settings?.accounting_section_title || 'المحاسبة', accountingItems, permissions.admin || permissions.reports)}

        {/* Super Admin - Companies */}
        {isSuperAdmin && <div className="mb-4 sm:mb-5">
            <p className="text-[11px] sm:text-xs font-semibold text-warning/70 mb-2 sm:mb-3 px-2 sm:px-3">مدير النظام</p>
            <ul className="space-y-1">
              <li>
                <button type="button" onClick={() => {
              setActivePage('dashboard');
              navigate('/companies');
            }} className={cn("w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200", "text-warning/80 hover:bg-warning/20 hover:text-warning")}>
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">إدارة الشركات</span>
                </button>
              </li>
            </ul>
          </div>}

        {/* Admin Section */}
        {canManageUsers && renderCollapsibleSection('admin', settings?.admin_section_title || 'الإدارة', [{
        id: 'users-management' as ActivePage,
        label: settings?.users_management_title || 'إدارة المستخدمين',
        icon: UserCog
      }, {
        id: 'app-settings' as ActivePage,
        label: settings?.app_settings_title || 'إعدادات النظام',
        icon: Settings
      }, {
        id: 'theme-settings' as ActivePage,
        label: 'إعدادات المظهر',
        icon: Palette
      }, {
        id: 'audit-logs' as ActivePage,
        label: settings?.audit_logs_title || 'سجل التدقيق',
        icon: ClipboardList
      }, {
        id: 'backups' as ActivePage,
        label: settings?.backups_title || 'النسخ الاحتياطي',
        icon: Database
      }, {
        id: 'control-center' as ActivePage,
        label: 'مركز التحكم',
        icon: Settings2
      }], canManageUsers)}
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-sidebar-border">
        <p className="text-[10px] sm:text-xs text-center text-sidebar-foreground/50">
          {companyType === 'construction' ? 'نظام إدارة المقاولات' : 
           companyType === 'general_trading' ? 'نظام إدارة التجارة' : 
           'نظام إدارة المعرض'} © 2026
        </p>
      </div>
    </aside>;
}