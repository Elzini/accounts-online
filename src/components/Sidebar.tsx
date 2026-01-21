import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingCart, 
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  UserCog,
  Settings,
  Building2,
  ArrowLeftRight,
  Crown,
  Calculator,
  BookOpen,
  Percent,
  PieChart,
  Receipt,
  CreditCard,
  FileCheck,
  Wallet,
  ClipboardList,
  Database,
  Landmark,
  Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/hooks/useSettings';
import defaultLogo from '@/assets/logo.png';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { data: settings } = useAppSettings();

  // Use company logo if available, otherwise use default
  const logoUrl = settings?.company_logo_url || defaultLogo;
  const appName = settings?.app_name || 'منصة إدارة المعارض';
  const appSubtitle = settings?.app_subtitle || 'لتجارة السيارات';

  const menuItems = [
    { id: 'dashboard' as ActivePage, label: settings?.dashboard_title || 'الرئيسية', icon: LayoutDashboard },
    { id: 'customers' as ActivePage, label: settings?.customers_title || 'العملاء', icon: Users, permission: 'sales' as const },
    { id: 'suppliers' as ActivePage, label: settings?.suppliers_title || 'الموردين', icon: Truck, permission: 'purchases' as const },
    { id: 'purchases' as ActivePage, label: settings?.purchases_title || 'المشتريات', icon: ShoppingCart, permission: 'purchases' as const },
    { id: 'sales' as ActivePage, label: settings?.sales_title || 'المبيعات', icon: DollarSign, permission: 'sales' as const },
  ];

  const transferItems = [
    { id: 'partner-dealerships' as ActivePage, label: 'المعارض الشريكة', icon: Building2 },
    { id: 'car-transfers' as ActivePage, label: 'تحويلات السيارات', icon: ArrowLeftRight },
  ];

  const financeItems = [
    { id: 'expenses' as ActivePage, label: 'المصروفات', icon: Wallet },
    { id: 'quotations' as ActivePage, label: 'عروض الأسعار', icon: FileCheck },
    { id: 'installments' as ActivePage, label: 'الأقساط', icon: CreditCard },
    { id: 'vouchers' as ActivePage, label: 'سندات القبض والصرف', icon: Receipt },
    { id: 'financing' as ActivePage, label: 'شركات التمويل', icon: Landmark },
    { id: 'banking' as ActivePage, label: 'إدارة البنوك', icon: Scale },
  ];

  const reportItems = [
    { id: 'inventory-report' as ActivePage, label: 'تقرير المخزون', icon: Package, permission: 'reports' as const },
    { id: 'profit-report' as ActivePage, label: 'تقرير الأرباح', icon: TrendingUp, permission: 'reports' as const },
    { id: 'purchases-report' as ActivePage, label: 'تقرير المشتريات', icon: FileText, permission: 'reports' as const },
    { id: 'sales-report' as ActivePage, label: 'تقرير المبيعات', icon: DollarSign, permission: 'reports' as const },
    { id: 'customers-report' as ActivePage, label: 'تقرير العملاء', icon: Users, permission: 'reports' as const },
    { id: 'suppliers-report' as ActivePage, label: 'تقرير الموردين', icon: Truck, permission: 'reports' as const },
    { id: 'commissions-report' as ActivePage, label: 'تقرير العمولات', icon: DollarSign, permission: 'reports' as const },
    { id: 'transfers-report' as ActivePage, label: 'تقرير التحويلات', icon: ArrowLeftRight, permission: 'reports' as const },
    { id: 'partner-report' as ActivePage, label: 'تقرير المعرض الشريك', icon: Building2, permission: 'reports' as const },
  ];

  const accountingItems = [
    { id: 'tax-settings' as ActivePage, label: 'إعدادات الضريبة', icon: Percent },
    { id: 'chart-of-accounts' as ActivePage, label: 'شجرة الحسابات', icon: BookOpen },
    { id: 'journal-entries' as ActivePage, label: 'دفتر اليومية', icon: Calculator },
    { id: 'general-ledger' as ActivePage, label: 'دفتر الأستاذ', icon: FileText },
    { id: 'financial-reports' as ActivePage, label: 'التقارير المالية', icon: PieChart },
  ];

  const hasAccess = (permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users') => {
    if (!permission) return true;
    return permissions.admin || permissions[permission];
  };

  const canManageUsers = permissions.admin || permissions.users || permissions.super_admin;
  const isSuperAdmin = permissions.super_admin;
  return (
    <aside className="w-64 min-h-screen max-h-[100dvh] gradient-dark text-sidebar-foreground flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-12 h-12 rounded-xl object-cover bg-white/10" 
            onError={(e) => {
              // Fallback to default logo if company logo fails to load
              (e.target as HTMLImageElement).src = defaultLogo;
            }}
          />
          <div>
            <h1 className="font-bold text-lg text-white">{appName}</h1>
            <p className="text-xs text-sidebar-foreground/70">{appSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">القائمة الرئيسية</p>
          <ul className="space-y-1">
            {menuItems.filter(item => hasAccess(item.permission)).map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActivePage(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "gradient-primary text-white shadow-lg" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Transfers */}
        {(permissions.admin || permissions.sales || permissions.purchases) && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">التحويلات</p>
            <ul className="space-y-1">
              {transferItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive 
                          ? "gradient-primary text-white shadow-lg" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Finance Section */}
        {(permissions.admin || permissions.sales || permissions.purchases) && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">المالية</p>
            <ul className="space-y-1">
              {financeItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive 
                          ? "gradient-primary text-white shadow-lg" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {hasAccess('reports') && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">{settings?.reports_title || 'التقارير'}</p>
            <ul className="space-y-1">
              {reportItems.filter(item => hasAccess(item.permission)).map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive 
                          ? "gradient-primary text-white shadow-lg" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Accounting */}
        {(permissions.admin || permissions.reports) && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">المحاسبة</p>
            <ul className="space-y-1">
              {accountingItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive 
                          ? "gradient-primary text-white shadow-lg" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Super Admin - Companies */}
        {isSuperAdmin && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-warning/70 mb-3 px-3">مدير النظام</p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    // Close mobile sheet (because MobileSidebar closes on any setActivePage call)
                    setActivePage('dashboard');
                    navigate('/companies');
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "text-warning/80 hover:bg-warning/20 hover:text-warning"
                  )}
                >
                  <Crown className="w-5 h-5" />
                  <span className="font-medium">إدارة الشركات</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Users Management */}
        {canManageUsers && (
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">الإدارة</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActivePage('users-management')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activePage === 'users-management'
                      ? "gradient-primary text-white shadow-lg" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <UserCog className="w-5 h-5" />
                  <span className="font-medium">إدارة المستخدمين</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('app-settings')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activePage === 'app-settings'
                      ? "gradient-primary text-white shadow-lg" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">إعدادات النظام</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('audit-logs')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activePage === 'audit-logs'
                      ? "gradient-primary text-white shadow-lg" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="font-medium">سجل التدقيق</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('backups')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activePage === 'backups'
                      ? "gradient-primary text-white shadow-lg" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <Database className="w-5 h-5" />
                  <span className="font-medium">النسخ الاحتياطي</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-center text-sidebar-foreground/50">
          نظام إدارة المعرض © 2024
        </p>
      </div>
    </aside>
  );
}
