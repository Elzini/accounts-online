import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  ShoppingCart, 
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  Car
} from 'lucide-react';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

const menuItems = [
  { id: 'dashboard' as ActivePage, label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'customers' as ActivePage, label: 'العملاء', icon: Users },
  { id: 'suppliers' as ActivePage, label: 'الموردين', icon: Truck },
  { id: 'purchases' as ActivePage, label: 'المشتريات', icon: ShoppingCart },
  { id: 'sales' as ActivePage, label: 'المبيعات', icon: DollarSign },
];

const reportItems = [
  { id: 'inventory-report' as ActivePage, label: 'تقرير المخزون', icon: Package },
  { id: 'profit-report' as ActivePage, label: 'تقرير الأرباح', icon: TrendingUp },
  { id: 'purchases-report' as ActivePage, label: 'تقرير المشتريات', icon: FileText },
];

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen gradient-dark text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Car className="w-7 h-7 text-white" />
          </div>
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
            {menuItems.map((item) => {
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
        <div>
          <p className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-3">التقارير</p>
          <ul className="space-y-1">
            {reportItems.map((item) => {
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
