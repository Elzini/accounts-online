import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingCart, 
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  Car,
  UserCog,
  Settings
} from 'lucide-react';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

const menuItems = [
  { id: 'dashboard' as ActivePage, label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'customers' as ActivePage, label: 'العملاء', icon: Users, permission: 'sales' as const },
  { id: 'suppliers' as ActivePage, label: 'الموردين', icon: Truck, permission: 'purchases' as const },
  { id: 'purchases' as ActivePage, label: 'المشتريات', icon: ShoppingCart, permission: 'purchases' as const },
  { id: 'sales' as ActivePage, label: 'المبيعات', icon: DollarSign, permission: 'sales' as const },
];

const reportItems = [
  { id: 'inventory-report' as ActivePage, label: 'تقرير المخزون', icon: Package, permission: 'reports' as const },
  { id: 'profit-report' as ActivePage, label: 'تقرير الأرباح', icon: TrendingUp, permission: 'reports' as const },
  { id: 'purchases-report' as ActivePage, label: 'تقرير المشتريات', icon: FileText, permission: 'reports' as const },
  { id: 'sales-report' as ActivePage, label: 'تقرير المبيعات', icon: DollarSign, permission: 'reports' as const },
];

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const { permissions } = useAuth();

  const hasAccess = (permission?: 'sales' | 'purchases' | 'reports' | 'admin' | 'users') => {
    if (!permission) return true;
    return permissions.admin || permissions[permission];
  };

  const canManageUsers = permissions.admin || permissions.users;

  return (
    <aside className="w-64 min-h-screen gradient-dark text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h1 className="font-bold text-lg text-white">أشبال النمر</h1>
            <p className="text-xs text-sidebar-foreground/70">لتجارة السيارات</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4">
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

        {/* Reports */}
        {hasAccess('reports') && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">التقارير</p>
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
