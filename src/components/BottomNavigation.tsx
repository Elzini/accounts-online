import { LayoutDashboard, ShoppingCart, DollarSign, Users, Menu, HardHat, Ship, UtensilsCrossed, LucideIcon } from 'lucide-react';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';

interface BottomNavigationProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onMenuClick: () => void;
}

interface NavItem {
  id: ActivePage;
  label: string;
  icon: LucideIcon;
}

function getNavItems(companyType: CompanyActivityType): NavItem[] {
  switch (companyType) {
    case 'construction':
      return [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'projects', label: 'المشاريع', icon: HardHat },
        { id: 'contracts', label: 'العقود', icon: DollarSign },
        { id: 'customers', label: 'العملاء', icon: Users },
      ];
    case 'export_import':
      return [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'shipments', label: 'الشحنات', icon: Ship },
        { id: 'sales', label: 'الصادرات', icon: DollarSign },
        { id: 'customers', label: 'العملاء', icon: Users },
      ];
    case 'restaurant':
      return [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'restaurant-orders', label: 'الطلبات', icon: UtensilsCrossed },
        { id: 'sales', label: 'المبيعات', icon: DollarSign },
        { id: 'customers', label: 'العملاء', icon: Users },
      ];
    default: // car_dealership, general_trading
      return [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'purchases', label: 'المشتريات', icon: ShoppingCart },
        { id: 'sales', label: 'المبيعات', icon: DollarSign },
        { id: 'customers', label: 'العملاء', icon: Users },
      ];
  }
}

export function BottomNavigation({ activePage, setActivePage, onMenuClick }: BottomNavigationProps) {
  const { company } = useCompany();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const navItems = getNavItems(companyType);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/98 backdrop-blur-lg border-t-2 border-border/80 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-all duration-200 min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </div>
    </nav>
  );
}
